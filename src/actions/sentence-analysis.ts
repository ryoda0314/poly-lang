"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── Types ──

export type SvocRole = "S" | "V" | "Oi" | "Od" | "C" | "M";

export type SentencePattern = 1 | 2 | 3 | 4 | 5;

export type ArrowType = "modifies" | "complement" | "reference";

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

// ── Stage 1: Main Clause SVOC ──

function buildStage1Prompt(sentence: string): string {
    return `Analyze the MAIN CLAUSE of this English sentence. Return SVOC elements and sentence pattern.

Sentence: "${sentence}"

Roles: S(主語), V(動詞), Od(直接目的語), Oi(間接目的語), C(補語), M(修飾語)

## Sentence pattern (first match wins)
- be/seem/become/appear + adj/participle phrase → Pattern 2 (SVC): V=be ONLY, C=full phrase incl. to-inf/of-phrase
  (be bound to, be likely to, be capable of, be afraid of, be willing to, etc.)
- give/tell/show/send/buy + TWO objects → Pattern 4 (SVOO)
- make/keep/find/call/consider + O + complement → Pattern 5 (SVOC)
- V + one object → Pattern 3 (SVO)
- V + no object → Pattern 1 (SV)

## Rules
1. Split NPs with post-nominal modifiers: head noun = S/Od/C, post-nominal part = separate M with modifiesIndex pointing to head noun index
   Example: "Any method capable of X" → S:"Any method", M:"capable of X" (modifiesIndex:0, expandsTo:"sub-1")
2. Mark complex elements (clauses, phrases with internal structure) with expandsTo: "sub-1", "sub-2", etc.
3. Discontinuous elements (inversions) → separate element per contiguous part, all with role=V
4. Exclude punctuation. Each text = contiguous substring of original.
5. startIndex/endIndex = char positions (start inclusive, end exclusive)
6. arrowType: "modifies" (M→target), "complement" (C→V), "reference" (pronoun→antecedent)
7. Auxiliary verbs (be/have/do/modals: can/could/will/would/shall/should/may/might/must) are ALWAYS role=V, NEVER role=M.
   If aux + main verb are contiguous → single V element: "had come", "was designed", "did acknowledge"
   If split by inversion/adverb → multiple V elements: V1="do", V2="see" (both role=V)
8. M is ONLY for: adverbs (rarely, never), adverbial phrases (in advance), prepositional phrases (once codified into procedure), participial constructions

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

function buildStage2Prompt(sentence: string, mainElements: any[]): string {
    return `Expand complex elements into sub-clauses with SVOC analysis.

Sentence: "${sentence}"

Main clause elements:
${JSON.stringify(mainElements, null, 2)}

For each element where expandsTo != null, create a sub-clause with its own SVOC breakdown.

Roles: S, V, Od (NOT "O"), Oi, C, M — use "Od" for direct objects, "Oi" for indirect objects. Never use bare "O".

## Auxiliary verb rule
Auxiliary verbs (be/have/do/modals) are ALWAYS role=V, NEVER role=M.
Contiguous aux+main → single V: "had come", "was treated", "did acknowledge"
Split by adverb → multiple V elements, all role=V: V1="was", M="previously", V2="treated"

## Rules
1. clauseId must match the parent's expandsTo value
2. Types: "relative", "noun", "adverbial", "conditional", "participial", "infinitive"
3. Reduced relative clauses (post-nominal adj/participle after noun):
   - type="relative", typeLabel="関係詞節の縮約（← which/who is ... が省略）"
   - Reconstruct full SVC: S="(which)"/"(who)" [省略], V="(is)"/"(was)" [省略], C=full visible phrase
4. Contact clauses (relative clause with omitted that/which/who — NO visible pronoun):
   - type="relative", typeLabel="関係詞節（目的格/主格の省略：that/which が省略）"
   - MUST include the omitted pronoun as an elided element: "(that)", "(which)", or "(who)"
   - Elided element: startIndex:-1, endIndex:-1, beginnerLabel="（省略）＝[先行詞]"
   - Example: "the criteria it had claimed were designed to protect dissent"
     → S:"(that/which)" [省略, =criteria], then the rest of the clause's SVOC
5. Each sub-clause needs its own sentencePattern (1-5)
6. modifierScope: "noun_phrase", "verb_phrase", or "sentence"
7. If sub-clause elements are also complex, mark with new expandsTo IDs and include deeper sub-clauses
8. Elided elements like "(which)", "(that)", "(is)" have startIndex:-1, endIndex:-1
9. parentClause = parent clauseId, parentElementIndex = element index in parent

Return JSON:
{
  "subClauses": [
    {
      "clauseId": "sub-1",
      "type": "relative",
      "typeLabel": "関係詞節の縮約（← which is capable of ... が省略）",
      "sentencePattern": 2,
      "sentencePatternLabel": "第2文型 (SVC)",
      "parentClause": "main",
      "parentElementIndex": 1,
      "modifierScope": "noun_phrase",
      "elements": [
        { "text": "(which)", "role": "S", "startIndex": -1, "endIndex": -1, "expandsTo": null, "modifiesIndex": null, "arrowType": null },
        { "text": "(is)", "role": "V", "startIndex": -1, "endIndex": -1, "expandsTo": null, "modifiesIndex": null, "arrowType": null },
        { "text": "capable of quantifying X", "role": "C", "startIndex": 11, "endIndex": 35, "expandsTo": "sub-3", "modifiesIndex": null, "arrowType": "complement" }
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

Structure:
${JSON.stringify(clauseSummary, null, 2)}

For EACH element (identified by clauseId + elementIndex), provide:
- roleLabel: Japanese role name (主語, 動詞, 直接目的語, 間接目的語, 補語, 修飾語)
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
};

const BE_FORMS = /^(am|is|are|was|were|be|been|being)$/i;
const COPULAR_ADJ_PATTERNS = /\b(bound|likely|unlikely|ready|able|unable|supposed|willing|apt|certain|sure|afraid|capable|inclined|prone|destined|meant|set|about|due)\b/i;

function fixElementIndices(sentence: string, elements: any[]) {
    const sorted = [...elements].sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));
    let searchFrom = 0;
    for (const elem of sorted) {
        if (!elem.text || elem.startIndex < 0) continue;
        const expected = sentence.slice(elem.startIndex, elem.endIndex);
        if (expected !== elem.text) {
            const idx = sentence.indexOf(elem.text, searchFrom);
            if (idx !== -1) {
                elem.startIndex = idx;
                elem.endIndex = idx + elem.text.length;
            }
        }
        searchFrom = Math.max(searchFrom, elem.endIndex ?? 0);
    }
}

/** Normalize bare "O" → "Od", etc. */
function normalizeRoles(elements: any[]) {
    for (const elem of elements) {
        if (elem.role === "O") elem.role = "Od";
    }
}

function applyCopularFix(stage1: any) {
    const elements = stage1.elements ?? [];
    const vElems = elements.filter((e: any) => e.role === "V");
    const odElems = elements.filter((e: any) => e.role === "Od");
    const cElems = elements.filter((e: any) => e.role === "C");
    if (cElems.length > 0) return;

    const vWithAdj = vElems.find((e: any) => {
        const words = e.text.trim().split(/\s+/);
        return words.length >= 2 && BE_FORMS.test(words[0]) && COPULAR_ADJ_PATTERNS.test(words.slice(1).join(" "));
    });

    const beOnly = vElems.length === 1 && BE_FORMS.test(vElems[0].text.trim());
    const odWithAdj = odElems.find((e: any) => COPULAR_ADJ_PATTERNS.test(e.text.trim().split(/\s+/)[0]));

    if (vWithAdj) {
        const words = vWithAdj.text.trim().split(/\s+/);
        const beWord = words[0];
        const adjPart = words.slice(1).join(" ");
        const odText = odElems.map((e: any) => e.text).join(" ");
        const cText = odText ? `${adjPart} ${odText}` : adjPart;
        const adjStart = vWithAdj.startIndex + beWord.length + 1;
        const cEnd = odElems.length > 0 ? Math.max(...odElems.map((e: any) => e.endIndex)) : vWithAdj.endIndex;

        stage1.elements = elements.filter((e: any) => e.role !== "Od");
        vWithAdj.text = beWord;
        vWithAdj.endIndex = vWithAdj.startIndex + beWord.length;

        const vIdx = stage1.elements.indexOf(vWithAdj);
        stage1.elements.splice(vIdx + 1, 0, {
            text: cText, role: "C", startIndex: adjStart, endIndex: cEnd,
            expandsTo: odElems[0]?.expandsTo ?? null, modifiesIndex: null, arrowType: "complement",
        });
        stage1.sentencePattern = 2;
        stage1.sentencePatternLabel = "第2文型 (SVC)";
    } else if (beOnly && odWithAdj) {
        odWithAdj.role = "C";
        stage1.sentencePattern = 2;
        stage1.sentencePatternLabel = "第2文型 (SVC)";
    }
}

/** Derive sentence pattern from actual element roles (overrides AI's guess) */
function fixSentencePattern(stage: any) {
    const elements: any[] = stage.elements ?? [];
    const roles = new Set(elements.map((e: any) => e.role));
    const hasOd = roles.has("Od");
    const hasOi = roles.has("Oi");
    const hasC = roles.has("C");

    let pattern: number;
    let label: string;

    if (hasOi && hasOd) {
        pattern = 4; label = "第4文型 (SVOO)";
    } else if (hasOd && hasC) {
        pattern = 5; label = "第5文型 (SVOC)";
    } else if (hasOd) {
        pattern = 3; label = "第3文型 (SVO)";
    } else if (hasC) {
        pattern = 2; label = "第2文型 (SVC)";
    } else {
        pattern = 1; label = "第1文型 (SV)";
    }

    stage.sentencePattern = pattern;
    stage.sentencePatternLabel = label;
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

    const limitCheck = await checkAndConsumeCredit(user.id, "sentence", supabase);
    if (!limitCheck.allowed) {
        return { cached: false, error: limitCheck.error || "クレジット不足" };
    }

    const safeSentence = sanitizeForPrompt(normalized);

    try {
        console.log(`\n=== [Sentence Analysis] "${normalized.slice(0, 60)}..." ===`);
        console.log("  Stage 1: Main clause...");
        const s1Res = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: buildStage1Prompt(safeSentence) }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const stage1 = JSON.parse(s1Res.choices[0].message.content!);
        fixElementIndices(safeSentence, stage1.elements ?? []);
        normalizeRoles(stage1.elements ?? []);
        applyCopularFix(stage1);
        fixSentencePattern(stage1);

        return {
            cached: false,
            stage1Data: stage1,
            hasExpandable: (stage1.elements ?? []).some((e: any) => e.expandsTo),
            safeSentence,
            cacheKey,
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
): Promise<Stage2Response> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { stage2Data: { subClauses: [] }, tokenUsage: { prompt: 0, completion: 0 }, error: "Not authenticated" };

    const safeSentence = sanitizeForPrompt(sentence.trim());

    try {
        console.log("  Stage 2: Sub-clause expansion...");
        const s2Res = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: buildStage2Prompt(safeSentence, stage1Elements) }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const stage2 = JSON.parse(s2Res.choices[0].message.content!);
        for (const sc of stage2.subClauses ?? []) {
            fixElementIndices(safeSentence, sc.elements ?? []);
            normalizeRoles(sc.elements ?? []);
            fixSentencePattern(sc);
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

        (supabase as any)
            .from("sentence_analysis_cache")
            .insert({ sentence_normalized: cacheKey, analysis_result: analysisResult })
            .then(() => { });

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
            { onConflict: "idx_user_sentence_history_unique" }
        )
        .then(() => { })
        .catch(console.error);
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
