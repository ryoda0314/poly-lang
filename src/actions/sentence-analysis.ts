"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit, getUsageStatus } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";
import { resolveVChains } from "@/lib/sentence-parser/vchain";
import { applyPatternFix } from "@/lib/sentence-parser/sentence-pattern";
import { validate } from "@/lib/sentence-parser/invariants";
import { repairLoop } from "@/lib/sentence-parser/repair";
import { fixElementIndices, normalizeRoles } from "@/lib/sentence-parser/fix-indices";
import { enforceVChains, markParentheticalInsertions, stampVChainIds } from "@/lib/sentence-parser/vchain-enforce";
import { tokenizeWithPOS } from "@/lib/sentence-parser/tokenizer";
import { runSyntaxTests } from "@/lib/sentence-parser/syntax-tests";
import { fixLongDistanceExtractionLabels } from "@/lib/sentence-parser/gap-detector";
import type { PosToken, SyntaxTestEvidence, ValidationReport as InternalValidationReport, RepairLog, VChainResult } from "@/lib/sentence-parser/types";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── Types ──

export type SvocRole = "S" | "V" | "Oi" | "Od" | "C" | "M" | "Comp" | "Insert" | "Compz";

export type SentencePattern = 1 | 2 | 3 | 4 | 5;

export type ArrowType = "modifies" | "complement" | "reference" | "insertion";

export interface SvocElement {
    text: string;
    startIndex: number;
    endIndex: number;
    role: SvocRole;
    roleLabel: string;
    /** Structural label: 名詞節, 関係詞節, 不定詞句, etc. */
    structureLabel: string | null;
    /** Beginner-friendly explanation */
    beginnerLabel: string;
    /** Advanced label (linguistic term) */
    advancedLabel: string;
    explanation: string;
    /** If this element contains a sub-clause, its clauseId */
    expandsTo: string | null;
    /** For M: index of the element this modifies within the same clause */
    modifiesIndex: number | null;
    /** Arrow semantic type */
    arrowType: ArrowType | null;
    /** V-complex grouping ID (e.g. "vc-0") — links V + Comp elements of same predicate */
    vChainId?: string;
}

export type ModifierScope = "sentence" | "noun_phrase" | "verb_phrase";

export interface Clause {
    clauseId: string;
    type: "main" | "relative" | "adverbial" | "noun" | "conditional" | "participial" | "infinitive";
    typeLabel: string;
    elements: SvocElement[];
    /** Which clause this subordinate clause belongs to */
    parentClause: string | null;
    /** Index of the element in the parent clause that this clause expands */
    parentElementIndex: number | null;
    modifierScope: ModifierScope | null;
    /** Sentence pattern for this clause (1-5) */
    sentencePattern: SentencePattern | null;
    sentencePatternLabel: string | null;
}

export interface VocabNote {
    word: string;
    pos: string;
    meaning: string;
    pronunciation: string;
    note?: string;
}

export interface GrammarPoint {
    name: string;
    explanation: string;
    relevantPart: string;
}

export interface SimilarExample {
    sentence: string;
    pattern: string;
    translation: string;
}

export interface SentenceAnalysisResult {
    originalSentence: string;
    clauses: Clause[];
    /** Main clause sentence pattern */
    sentencePattern: SentencePattern;
    sentencePatternLabel: string;
    svocPattern: string;
    translation: string;
    structuralTranslation: string;
    vocabulary: VocabNote[];
    grammarPoints: GrammarPoint[];
    similarExamples: SimilarExample[];
    difficulty: "beginner" | "intermediate" | "advanced";
    structureExplanation: string;
    /** Evidence-based syntax test results */
    syntaxTests?: SyntaxTestEvidence[];
    /** Final validation report */
    validation?: InternalValidationReport;
    /** Repair actions taken */
    repairLog?: RepairLog;
}

export interface AnalysisResponse {
    result: SentenceAnalysisResult | null;
    error?: string;
}

export interface HistoryEntry {
    id: string;
    sentence: string;
    difficulty: string | null;
    sentencePatternLabel: string | null;
    createdAt: string;
}

// ── Input Validation ──

const MAX_SENTENCE_LENGTH = 300;

function validateInput(sentence: string): string | null {
    if (!sentence.trim()) {
        return "文を入力してください。";
    }
    if (sentence.length > MAX_SENTENCE_LENGTH) {
        return `入力が長すぎます（最大${MAX_SENTENCE_LENGTH}文字）`;
    }
    if (!/[a-zA-Z]/.test(sentence)) {
        return "英文を入力してください。";
    }
    return null;
}

function sanitizeForPrompt(sentence: string): string {
    return sentence.replace(/["""«»{}[\]<>\\|]/g, "").trim();
}

// ── Shared prompt rules (referenced by both Stage 1 and Stage 2) ──

const VERB_COMPLEMENT_RULES = `## V-complement classification (applies to ALL clauses)
- Aspectual predicates (come/get/grow to V): to-inf = Comp (NOT Od, C, or M). Pattern 1 (SV). These verbs are intransitive.
- Raising predicates (seem/appear/happen/prove/tend + to V): to-inf = Comp. Pattern 2 (SV+Comp).
- Causative passives (was made/forced/caused/allowed + to V): to-inf = Comp.
- Copular passive adj (is meant/supposed/believed/designed + to V): to-inf = Comp. Pattern 2 (SV+Comp).
- Purpose verbs in passive (was built/created/used + to V): to-inf = M (purpose adverbial, "in order to" insertable). Pattern 1 (SV).
Key test: "in order to" insertable → M (purpose). Cannot be omitted → Comp (verbal complement). Describes S/O attribute → C.`;

// ── Stage 1: Main Clause SVOC ──

function buildStage1Prompt(sentence: string, vchainSummary: string = ""): string {
    return `Analyze the MAIN CLAUSE of this English sentence. Return SVOC elements and sentence pattern.

Sentence: "${sentence}"

Roles: S(主語), V(動詞), Od(直接目的語), Oi(間接目的語), C(補語), M(修飾語), Comp(補部), Insert(挿入句), Compz(補文標識)

## Role distinctions
- C(補語) = describes an attribute of S or O. "She is happy" → C:happy, "They call him John" → C:John
- Comp(補部) = obligatory verbal complement (cannot be omitted without losing meaning). "She seems to be happy" → Comp:to be happy, "He came to know" → Comp:to know
- M(修飾語) = optional adverbs, PPs, participial phrases, post-nominal modifiers
- Insert(挿入句) = comma-delimited parenthetical that interrupts clause structure
- Compz(補文標識) = complementizer that introduces a clause: "that", "whether", "if". Separate from the Od/C it introduces.
  Compz NEVER has expandsTo — only the Od/C after it gets expandsTo.
  Example: "I know that she is happy" → V:"know", Compz:"that" (no expandsTo), Od:"she is happy" (expandsTo:"sub-1")

## CRITICAL: Contiguity constraint
Every element "text" MUST be an exact contiguous substring of the original sentence.
NEVER skip words or combine non-adjacent words into one element.
WRONG: text="did acknowledge" when sentence has "did the committee acknowledge" (words are separated)
RIGHT: V:"did" + S:"the committee" + V:"acknowledge" (each is contiguous)

## Sentence pattern (first match wins)
- be/seem/become/appear + adj/participle phrase → Pattern 2 (SVC): V=be ONLY, C=full phrase incl. to-inf/of-phrase
- give/tell/show/send/buy + TWO objects → Pattern 4 (SVOO)
- make/keep/find/call/consider + O + complement → Pattern 5 (SVOC)
- V + one object → Pattern 3 (SVO)
- V + no object → Pattern 1 (SV)

## Rules
1. Auxiliary verbs (be/have/do/modals) are ALWAYS role=V, NEVER role=M.
   Adjacent aux+verb → single V: "had come", "were designed", "had claimed"
   Separated by subject (inversion) → SEPARATE V elements: V1:"did", V2:"acknowledge"
   Discontinuous V-chain (parenthetical insertion): "had, once codified into procedure, come" → V:"had", Insert:", once codified into procedure,", V:"come" (three separate elements, NOT one V element)
   Example: "Rarely did the committee acknowledge..." → M:"Rarely", V:"did", S:"the committee", V:"acknowledge", Od:"that..."
2. Heavy NP splitting: If an S/Od phrase contains a finite verb (= has an embedded clause), SPLIT it:
   Head noun → S/Od, embedded clause part → M with expandsTo
   Example: "the criteria it had claimed were designed..." → S:"the very criteria", M:"it had once claimed were designed to protect dissent" (expandsTo:"sub-1", modifiesIndex pointing to S)
   NEVER create a single element that spans across multiple finite verbs.
   Bridge verbs (claim/think/say/believe/know/argue/report/...): When a heavy NP contains
   [noun] + [pronoun + bridge verb + finite clause], the finite clause after the bridge verb
   belongs to the bridge verb's complement, NOT to the head noun directly.
   Split: head noun = S/Od, everything from the pronoun onward = M (expandsTo for sub-clause analysis).
3. Split NPs with post-nominal modifiers: head noun = S/Od/C, rest = M with modifiesIndex + expandsTo
4. Mark complex elements with expandsTo: "sub-1", "sub-2", etc.
5. M is ONLY for: adverbs, adverbial phrases, prepositional phrases, participial constructions, post-nominal modifiers (with expandsTo).
   Comp is for: to-infinitive complements of raising/aspectual/causative verbs (seem to V, come to V, be meant to V).
   Insert is for: comma-delimited parenthetical interruptions (", once codified into procedure,").
6. Exclude punctuation. startIndex/endIndex = char positions (start inclusive, end exclusive)
7. arrowType: "modifies" (M→target), "complement" (C/Comp→V), "reference" (pronoun→antecedent)
8. That-clause scope (CRITICAL): When a verb (acknowledge/claim/believe/think/say/know/etc.) takes a that-clause as object,
   separate the complementizer: Compz:"that", then Od spans the REST of the clause to the END of the sentence (or next main-clause boundary).
   A that-clause ALWAYS contains a subject + predicate. NEVER truncate it at the subject NP.
   WRONG: Od:"that the very criteria" (no predicate — incomplete clause)
   RIGHT: Compz:"that", Od:"the very criteria ... had ... come to exclude the voices ... to safeguard" (expandsTo:"sub-1", full clause with predicate)
   Similarly for "whether"/"if" clauses: Compz:"whether", Od:"she will come"
9. Flat decomposition (CRITICAL): When expanding a that-clause (Od with expandsTo), the sub-clause in Stage 2 should
   decompose ALL layers flat. A relative clause modifying S is M (not V). To-infinitive after passive V is Comp or M (not part of V).
   WRONG: S:"the very criteria", V:"it had once claimed were designed to protect dissent" (relative clause is NOT a verb)
   RIGHT: S:"the very criteria", M:"it had once claimed were designed to protect dissent" (expandsTo, modifiesIndex→S)
   and then V:"had", Insert:", once codified,...", V:"come", Comp:"to exclude..."
${VERB_COMPLEMENT_RULES}
${vchainSummary ? `\n## Pre-analyzed V-chains (MANDATORY)\n${vchainSummary}\nFollow the V-chain analysis exactly. Contiguous chains = single V element. Inversions = separate V elements.\n` : ""}
Return JSON:
{
  "sentencePattern": 2,
  "sentencePatternLabel": "第2文型 (SVC)",
  "svocPattern": "S + M + V + C",
  "difficulty": "beginner|intermediate|advanced",
  "elements": [
    { "text": "...", "role": "S", "startIndex": 0, "endIndex": 5, "expandsTo": null, "modifiesIndex": null, "arrowType": null }
  ]
}`;
}

// ── Stage 2: Sub-clause Expansion ──

function buildStage2Prompt(sentence: string, mainElements: any[], vchainSummary: string = ""): string {
    return `Expand complex elements into sub-clauses with SVOC analysis.

Sentence: "${sentence}"

Main clause elements:
${JSON.stringify(mainElements, null, 2)}

For each element where expandsTo != null, create a sub-clause with its own SVOC breakdown.

Roles: S, V, Od (NOT "O"), Oi, C, M, Comp, Insert, Compz — use "Od" for direct objects, "Oi" for indirect objects.
- C = attribute complement (S=C or O=C). Comp = obligatory verbal complement (to-inf of raising/aspectual/causative verbs).
- Insert = comma-delimited parenthetical insertion.
- Compz = complementizer (that/whether/if) — separate element BEFORE the clause it introduces. Compz NEVER has expandsTo.

## CRITICAL: Contiguity + Single-role constraints
- Every element "text" MUST be an exact contiguous substring of the original sentence.
- Each clause should have exactly ONE S element (except for elided elements with startIndex:-1).
- Adjacent aux+verb → single V: "had come", "had claimed", "were designed"
- Discontinuous V-chain: aux + parenthetical + main verb → V:"aux", Insert:"parenthetical", V:"main verb" (three separate elements)
- V split by adverb → V1, M:adverb, V2 (all separate elements)
- V elements contain ONLY auxiliary + main verb. NEVER include a to-infinitive phrase inside V.
  WRONG: V:"were designed to protect dissent"
  RIGHT: V:"were designed", Comp:"to protect dissent"
  WRONG: V:"had once claimed were designed to protect dissent"
  RIGHT: V:"had claimed", M:"once", Od:"..." (the complement clause)
${vchainSummary ? `\n## V-chains\n${vchainSummary}\n` : ""}
## Rules
1. clauseId must match the parent's expandsTo value
2. Types: "relative", "noun", "adverbial", "conditional", "participial", "infinitive"
3. Explicit relative pronouns (that/which/who/whom visible in the sentence):
   - The visible pronoun gets a ROLE based on its grammatical function:
     Subject-case (who/which/that as subject) → role="S"
     Object-case (whom/which/that as object) → role="Od"
   - Do NOT add any elided "(that)" — the pronoun is already present.
   - typeLabel: "関係詞節（主格）" or "関係詞節（目的格）"
4. Reduced relative clauses (post-nominal adj/participle, NO pronoun):
   - type="relative", typeLabel="関係詞節の縮約（← which/who is ... が省略）"
   - Reconstruct: S="(which)"/"(who)" [省略], V="(is)"/"(was)" [省略], C=visible phrase
5. Contact relative clauses (NO visible pronoun, but has subject+verb after noun):
   - Apply when a NOUN is directly followed by pronoun+finite-verb (no conjunction between)
   - Example: "the criteria [it had claimed were designed...]" → contact relative
   - type="relative", typeLabel="関係詞節（目的格の省略：that/which が省略）"
   - MUST include elided pronoun: "(that)"/"(which)" with startIndex:-1
   - The pronoun after the noun ("it") = S of the relative clause
6. Content-taking verbs (claim/say/argue/acknowledge/believe/think/suggest/report/know/feel):
   - A clause AFTER these verbs is a noun clause, NOT a contact relative
   - type="noun", typeLabel="名詞節（that省略）"
   - Example: "he claimed (that) the criteria were fair" → noun clause
7. What-clauses: determine what's role by the missing argument slot (S/Od/C)
8. Deep nesting (IMPORTANT): Sub-clause elements can ALSO be complex.
   Mark them with new expandsTo IDs and include deeper sub-clauses.
   Example for "the criteria it had once claimed were designed to protect dissent":
   - sub-1 (contact relative, long-distance extraction via "claimed"):
     (that/which)=Od:-1, S:"it", V:"had claimed", M:"once",
     Od:"(the criteria) were designed to protect dissent" → expandsTo:"sub-2"
   - sub-2 (noun clause, complement of "claimed"):
     S:(criteria) startIndex:-1, V:"were designed", Comp:"to protect dissent"
9. Bridge verb + long-distance extraction (CRITICAL):
   Bridge verbs: claim/think/say/believe/know/argue/report/assume/feel/suggest/expect/admit/declare/find
   When a relative clause's verb is a bridge verb, the gap (=antecedent) may NOT be the verb's direct object.
   Instead, the gap is often the SUBJECT of the complement clause (long-distance extraction).
   The Od of the bridge verb is the entire clause (subject + predicate), not just the predicate.
   typeLabel: "関係詞節（補文内主語の取り出し：long-distance extraction）"
${VERB_COMPLEMENT_RULES}
10. That-clause scope: A that-clause (noun clause) ALWAYS has a subject + predicate.
    If the parent Od is "that + NP + ... finite verb ...", the entire span is ONE clause.
    NEVER split it so that the subject NP is separated from its predicate.
14. sentencePattern (1-5) for each sub-clause
15. modifierScope: "noun_phrase", "verb_phrase", or "sentence"
16. Elided elements: startIndex:-1, endIndex:-1
17. parentClause = parent clauseId, parentElementIndex = element index in parent

Return JSON:
{
  "subClauses": [
    {
      "clauseId": "sub-1",
      "type": "relative",
      "typeLabel": "関係詞節（目的格の省略）",
      "sentencePattern": 3,
      "sentencePatternLabel": "第3文型 (SVO)",
      "parentClause": "main",
      "parentElementIndex": 1,
      "modifierScope": "noun_phrase",
      "elements": [
        { "text": "(which)", "role": "Od", "startIndex": -1, "endIndex": -1, "expandsTo": null, "modifiesIndex": null, "arrowType": null },
        { "text": "it", "role": "S", "startIndex": 20, "endIndex": 22, "expandsTo": null, "modifiesIndex": null, "arrowType": null },
        { "text": "had claimed", "role": "V", "startIndex": 23, "endIndex": 34, "expandsTo": null, "modifiesIndex": null, "arrowType": null }
      ]
    }
  ]
}

Return { "subClauses": [] } if no elements need expansion.
typeLabel must be in Japanese.`;
}

// ── Stage 3: Enrichment ──

function buildStage3Prompt(sentence: string, clauseSummary: any[]): string {
    return `You are an English teacher for Japanese learners. Annotate this sentence analysis with educational content.

Sentence: "${sentence}"

Structure (FIXED — do NOT modify role, text, startIndex, endIndex, or expandsTo):
${JSON.stringify(clauseSummary, null, 2)}

IMPORTANT: The structure above is finalized by previous stages. Your job is ONLY to add educational labels and explanations. Do NOT change any role assignments, element text, spans, or expandsTo values.

For EACH element (identified by clauseId + elementIndex), provide:
- roleLabel: Japanese role name matching the element's role exactly (S→主語, V→動詞, Od→直接目的語, Oi→間接目的語, C→補語, M→修飾語, Comp→補部, Insert→挿入句, Compz→補文標識)
- structureLabel: structural type (名詞節, 関係詞節, 不定詞句, 動名詞句, etc.) or null
- beginnerLabel: simple Japanese (e.g. "誰が？", "何を？→（本）", "いつ？→昨日")
- advancedLabel: linguistic term (e.g. "主語(代名詞)", "関係詞節の縮約(← which is ...)")
- explanation: 1-2 sentence Japanese explanation of grammatical function

Also provide:
- translation: natural Japanese translation
- structuralTranslation: structural translation like [S]は [V]した [Od]を
- vocabulary: [{word, pos(品詞), meaning, pronunciation(IPA), note?}]
- grammarPoints: [{name, explanation, relevantPart}] key grammar points
- similarExamples: 2-3 [{sentence, pattern, translation}]
- structureExplanation: overall structure explanation in Japanese

Return JSON:
{
  "labels": [
    { "clauseId": "main", "elementIndex": 0, "roleLabel": "主語", "structureLabel": null, "beginnerLabel": "誰が？", "advancedLabel": "主語(代名詞)", "explanation": "..." },
    { "clauseId": "main", "elementIndex": 1, "roleLabel": "修飾語", "structureLabel": "関係詞節の縮約", "beginnerLabel": "どんなmethod？", "advancedLabel": "関係詞節の縮約(← which is ...)", "explanation": "..." }
  ],
  "translation": "...",
  "structuralTranslation": "...",
  "vocabulary": [...],
  "grammarPoints": [...],
  "similarExamples": [...],
  "structureExplanation": "..."
}

ALL text MUST be in Japanese.`;
}

// ── Pipeline Helpers ──

const ROLE_LABELS: Record<string, string> = {
    S: "主語", V: "動詞", Od: "直接目的語", Oi: "間接目的語", C: "補語", M: "修飾語",
    Comp: "補部", Insert: "挿入句", Compz: "補文標識",
};

// Old helpers (fixElementIndices, normalizeRoles, applyCopularFix, fixSentencePattern, validateAndRepair)
// have been moved to lib/sentence-parser/ modules.

/** Compz is a function word — it should never own a sub-clause expansion. */
function stripCompzExpandsTo(elements: any[]): void {
    for (const elem of elements) {
        if (elem.role === "Compz" && elem.expandsTo) {
            elem.expandsTo = null;
        }
    }
}

function buildClauseSummary(stage1: any, stage2: any): any[] {
    const main = {
        clauseId: "main", type: "main", typeLabel: "主節",
        elements: (stage1.elements ?? []).map((e: any) => ({ text: e.text, role: e.role })),
    };
    const subs = (stage2.subClauses ?? []).map((sc: any) => ({
        clauseId: sc.clauseId, type: sc.type, typeLabel: sc.typeLabel,
        elements: (sc.elements ?? []).map((e: any) => ({ text: e.text, role: e.role })),
    }));
    return [main, ...subs];
}

function mergeStageResults(
    sentence: string,
    stage1: any,
    stage2: any,
    stage3: any,
): SentenceAnalysisResult {
    const labelsMap = new Map<string, any>();
    for (const label of stage3.labels ?? []) {
        labelsMap.set(`${label.clauseId}:${label.elementIndex}`, label);
    }

    function annotateElements(clauseId: string, elements: any[]): SvocElement[] {
        return (elements ?? []).map((elem: any, i: number) => {
            const label = labelsMap.get(`${clauseId}:${i}`) ?? {};
            return {
                text: elem.text ?? "",
                startIndex: elem.startIndex ?? -1,
                endIndex: elem.endIndex ?? -1,
                role: elem.role ?? "M",
                roleLabel: label.roleLabel ?? ROLE_LABELS[elem.role] ?? elem.role,
                structureLabel: label.structureLabel ?? null,
                beginnerLabel: label.beginnerLabel ?? "",
                advancedLabel: label.advancedLabel ?? "",
                explanation: label.explanation ?? "",
                expandsTo: elem.expandsTo ?? null,
                modifiesIndex: elem.modifiesIndex ?? null,
                arrowType: elem.arrowType ?? null,
                ...(elem.vChainId ? { vChainId: elem.vChainId } : {}),
            };
        });
    }

    const mainClause: Clause = {
        clauseId: "main",
        type: "main",
        typeLabel: "主節",
        sentencePattern: stage1.sentencePattern,
        sentencePatternLabel: stage1.sentencePatternLabel,
        parentClause: null,
        parentElementIndex: null,
        modifierScope: null,
        elements: annotateElements("main", stage1.elements),
    };

    const subClauses: Clause[] = (stage2.subClauses ?? []).map((sc: any) => ({
        clauseId: sc.clauseId,
        type: sc.type ?? "relative",
        typeLabel: sc.typeLabel ?? "",
        sentencePattern: sc.sentencePattern ?? null,
        sentencePatternLabel: sc.sentencePatternLabel ?? null,
        parentClause: sc.parentClause ?? "main",
        parentElementIndex: sc.parentElementIndex ?? null,
        modifierScope: sc.modifierScope ?? null,
        elements: annotateElements(sc.clauseId, sc.elements),
    }));

    return {
        originalSentence: sentence,
        clauses: [mainClause, ...subClauses],
        sentencePattern: stage1.sentencePattern,
        sentencePatternLabel: stage1.sentencePatternLabel,
        svocPattern: stage1.svocPattern ?? "",
        translation: stage3.translation ?? "",
        structuralTranslation: stage3.structuralTranslation ?? "",
        vocabulary: stage3.vocabulary ?? [],
        grammarPoints: stage3.grammarPoints ?? [],
        similarExamples: stage3.similarExamples ?? [],
        difficulty: stage1.difficulty ?? "intermediate",
        structureExplanation: stage3.structureExplanation ?? "",
    };
}

// ── Stage responses ──

export interface Stage1Response {
    cached: boolean;
    result?: SentenceAnalysisResult;
    stage1Data?: any;
    hasExpandable?: boolean;
    safeSentence?: string;
    cacheKey?: string;
    posTokens?: PosToken[];
    vchainResult?: VChainResult;
    tokenUsage?: { prompt: number; completion: number };
    error?: string;
}

export interface Stage2Response {
    stage2Data: any;
    tokenUsage: { prompt: number; completion: number };
    error?: string;
}

// ── Stage 1: Cache check + Credit + Main clause SVOC ──

export async function analyzeStage1(sentence: string): Promise<Stage1Response> {
    const normalized = sentence.trim();
    if (!normalized) return { cached: false, error: "文を入力してください。" };

    const validationError = validateInput(normalized);
    if (validationError) return { cached: false, error: validationError };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { cached: false, error: "Not authenticated" };

    const cacheKey = normalized.toLowerCase().replace(/\s+/g, " ");
    const { data: cached } = await (supabase as any)
        .from("sentence_analysis_cache")
        .select("analysis_result")
        .eq("sentence_normalized", cacheKey)
        .single();

    if (cached) {
        saveToHistory(user.id, normalized, cacheKey, cached.analysis_result, supabase);
        return { cached: true, result: cached.analysis_result as SentenceAnalysisResult };
    }

    // Check credit availability (don't consume yet — consume after LLM success)
    const usageStatus = await getUsageStatus(user.id, "sentence", supabase);
    if (!usageStatus.canUse) {
        return { cached: false, error: "クレジット不足" };
    }

    const safeSentence = sanitizeForPrompt(normalized);

    try {
        console.log(`\n=== [Sentence Analysis] "${normalized.slice(0, 60)}..." ===`);

        // ローカル POS トークン化 + V-Chain 解析
        const posTokens = tokenizeWithPOS(safeSentence);
        const vchainResult = resolveVChains(safeSentence, posTokens);
        if (vchainResult.chains.length > 0) {
            console.log("  V-Chain pre-analysis:", vchainResult.chains.map(c => c.text).join(", "));
        }

        console.log("  Stage 1: Main clause...");
        const s1Res = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: buildStage1Prompt(safeSentence, vchainResult.promptSummary) }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const stage1 = JSON.parse(s1Res.choices[0].message.content!);
        fixElementIndices(safeSentence, stage1.elements ?? []);
        normalizeRoles(stage1.elements ?? []);
        stripCompzExpandsTo(stage1.elements ?? []);

        // V-chain 強制適用 (非連続 V 分割、重複除去)
        const enforceResult = enforceVChains(safeSentence, stage1.elements ?? [], vchainResult);
        if (enforceResult.fixed > 0) {
            console.log(`  V-chain enforce: ${enforceResult.fixed} fix(es)`);
        }

        // 挿入句マーキング (不連続 V-chain の V1→V2 bracket)
        const parenMarked = markParentheticalInsertions(stage1.elements ?? [], vchainResult);
        if (parenMarked > 0) {
            console.log(`  Parenthetical insertions: ${parenMarked} marked`);
        }

        // V-complex グルーピング (V + Comp に vChainId を付与)
        stampVChainIds(stage1.elements ?? [], vchainResult);

        // validate のみ (repair は Stage 3 前に一括)
        const preReport = validate(safeSentence, stage1, { subClauses: [] });
        if (!preReport.valid) {
            console.log("  Stage 1 violations:", preReport.violations.map(v => v.message).join("; "));
        }

        // 文型判定 (辞書ベース)
        const mainVChain = vchainResult.chains[0] ?? null;
        applyPatternFix(stage1, mainVChain);

        // Consume credit after LLM success (not before — avoids losing credits on LLM failure)
        const limitCheck = await checkAndConsumeCredit(user.id, "sentence", supabase);
        if (!limitCheck.allowed) {
            // Rare: another request consumed the last credit between check and LLM completion.
            // LLM work is already done, so fail-open and return the result.
            console.warn("Credit race: consumed between availability check and LLM completion");
        }

        return {
            cached: false,
            stage1Data: stage1,
            hasExpandable: (stage1.elements ?? []).some((e: any) => e.expandsTo),
            safeSentence,
            cacheKey,
            posTokens,
            vchainResult,
            tokenUsage: {
                prompt: s1Res.usage?.prompt_tokens ?? 0,
                completion: s1Res.usage?.completion_tokens ?? 0,
            },
        };
    } catch (e: any) {
        console.error("Stage 1 error:", e);
        return { cached: false, error: "英文の解析に失敗しました。" };
    }
}

// ── Stage 2: Sub-clause expansion ──

export async function analyzeStage2(
    sentence: string,
    stage1Elements: any[],
    precomputedPosTokens?: PosToken[],
    precomputedVChain?: VChainResult,
): Promise<Stage2Response> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { stage2Data: { subClauses: [] }, tokenUsage: { prompt: 0, completion: 0 }, error: "Not authenticated" };

    const safeSentence = sanitizeForPrompt(sentence.trim());

    try {
        // V-Chain: reuse Stage 1 results if available, otherwise recompute
        const posTokens = precomputedPosTokens ?? tokenizeWithPOS(safeSentence);
        const vchainResult = precomputedVChain ?? resolveVChains(safeSentence, posTokens);

        console.log("  Stage 2: Sub-clause expansion...");
        const s2Res = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{
                role: "user",
                content: buildStage2Prompt(safeSentence, stage1Elements, vchainResult.promptSummary),
            }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const stage2 = JSON.parse(s2Res.choices[0].message.content!);
        for (const sc of stage2.subClauses ?? []) {
            fixElementIndices(safeSentence, sc.elements ?? []);
            normalizeRoles(sc.elements ?? []);
            stripCompzExpandsTo(sc.elements ?? []);
            enforceVChains(safeSentence, sc.elements ?? [], vchainResult);
            markParentheticalInsertions(sc.elements ?? [], vchainResult);
            stampVChainIds(sc.elements ?? [], vchainResult);
            applyPatternFix(sc);
        }

        // Long-distance extraction: fix typeLabel for relative clauses with bridge verbs
        const ldFixes = fixLongDistanceExtractionLabels(stage2, posTokens);
        if (ldFixes > 0) {
            console.log(`  Long-distance extraction: ${ldFixes} label(s) fixed`);
        }

        return {
            stage2Data: stage2,
            tokenUsage: {
                prompt: s2Res.usage?.prompt_tokens ?? 0,
                completion: s2Res.usage?.completion_tokens ?? 0,
            },
        };
    } catch (e: any) {
        console.error("Stage 2 error:", e);
        return { stage2Data: { subClauses: [] }, tokenUsage: { prompt: 0, completion: 0 }, error: "句・節の展開に失敗しました。" };
    }
}

// ── Stage 3: Enrichment + merge + cache + history ──

export async function analyzeStage3(
    sentence: string,
    stage1Data: any,
    stage2Data: any,
    cacheKey: string,
    prevTokenUsage: { prompt: number; completion: number },
): Promise<AnalysisResponse> {
    const normalized = sentence.trim();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { result: null, error: "Not authenticated" };

    const safeSentence = sanitizeForPrompt(normalized);

    try {
        // ローカル POS トークン化
        const posTokens = tokenizeWithPOS(safeSentence);

        // 全体 validate + repair (Stage 1 + 2 結果に対して)
        const { report: repairReport, log: repairLog } = repairLoop(safeSentence, stage1Data, stage2Data);
        if (repairLog.actions.length > 0) {
            console.log("  Repair actions:", repairLog.actions.map(a => a.reason).join("; "));
        }
        if (!repairReport.valid) {
            console.warn("  Remaining violations:", repairReport.violations.map(v => v.message).join("; "));
        }

        // 統語テスト実行
        const syntaxTests = runSyntaxTests(safeSentence, stage1Data, stage2Data, posTokens);
        const testFails = syntaxTests.filter(t => t.status === "fail").length;
        const testWarns = syntaxTests.filter(t => t.status === "warn").length;
        console.log(`  Syntax tests: ${syntaxTests.length} total, ${testFails} fail, ${testWarns} warn`);

        console.log("  Stage 3: Enrichment...");
        const clauseSummary = buildClauseSummary(stage1Data, stage2Data);
        const s3Res = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: buildStage3Prompt(safeSentence, clauseSummary) }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const totalPrompt = prevTokenUsage.prompt + (s3Res.usage?.prompt_tokens ?? 0);
        const totalCompletion = prevTokenUsage.completion + (s3Res.usage?.completion_tokens ?? 0);
        const stage3 = JSON.parse(s3Res.choices[0].message.content!);

        logTokenUsage(user.id, "sentence_analysis", "gpt-5.2", totalPrompt, totalCompletion).catch(console.error);
        console.log(`--- Total: ${totalPrompt} prompt + ${totalCompletion} completion tokens ---`);

        const analysisResult = mergeStageResults(safeSentence, stage1Data, stage2Data, stage3);

        // 統語テスト結果・バリデーション・修復ログを付与
        analysisResult.syntaxTests = syntaxTests;
        analysisResult.validation = repairReport;
        analysisResult.repairLog = repairLog;

        // NOTE: Race condition possible if two requests for the same uncached sentence
        // arrive simultaneously. Both will call the LLM and consume credits.
        // Accepted trade-off given low request volume (max 50/day per user).
        (supabase as any)
            .from("sentence_analysis_cache")
            .upsert(
                { sentence_normalized: cacheKey, analysis_result: analysisResult },
                { onConflict: "sentence_normalized" }
            )
            .then(() => { })
            .catch((err: any) => console.error("Cache upsert failed:", err));

        saveToHistory(user.id, normalized, cacheKey, analysisResult, supabase);

        return { result: analysisResult };
    } catch (e: any) {
        console.error("Stage 3 error:", e);
        return { result: null, error: "解説の生成に失敗しました。" };
    }
}

// ── History helpers ──

function saveToHistory(
    userId: string,
    sentence: string,
    cacheKey: string,
    result: SentenceAnalysisResult,
    supabase: any,
) {
    (supabase as any)
        .from("user_sentence_history")
        .upsert(
            {
                user_id: userId,
                sentence,
                sentence_normalized: cacheKey,
                difficulty: result.difficulty ?? null,
                sentence_pattern_label: result.sentencePatternLabel ?? null,
                created_at: new Date().toISOString(),
            },
            { onConflict: "user_id,sentence_normalized" }
        )
        .then(() => { }, (err: any) => console.error("History save failed:", err));
}

export async function getAnalysisHistory(): Promise<{ entries: HistoryEntry[]; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entries: [], error: "Not authenticated" };

    const { data, error } = await (supabase as any)
        .from("user_sentence_history")
        .select("id, sentence, difficulty, sentence_pattern_label, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("History fetch error:", error);
        return { entries: [], error: "履歴の取得に失敗しました" };
    }

    return {
        entries: (data ?? []).map((row: any) => ({
            id: row.id,
            sentence: row.sentence,
            difficulty: row.difficulty,
            sentencePatternLabel: row.sentence_pattern_label,
            createdAt: row.created_at,
        })),
    };
}
