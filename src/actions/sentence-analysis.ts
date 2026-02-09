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

export interface SyntaxTreeNode {
    label: string;
    labelJa: string;
    text: string;
    children: SyntaxTreeNode[];
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
    syntaxTree: SyntaxTreeNode;
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

// ── Main Analysis ──

export async function analyzeSentence(sentence: string): Promise<AnalysisResponse> {
    const normalized = sentence.trim();
    if (!normalized) return { result: null, error: "Empty sentence" };

    const validationError = validateInput(normalized);
    if (validationError) return { result: null, error: validationError };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { result: null, error: "Not authenticated" };

    // 1. Check cache
    const cacheKey = normalized.toLowerCase().replace(/\s+/g, " ");
    const { data: cached } = await (supabase as any)
        .from("sentence_analysis_cache")
        .select("analysis_result")
        .eq("sentence_normalized", cacheKey)
        .single();

    if (cached) {
        saveToHistory(user.id, normalized, cacheKey, cached.analysis_result, supabase);
        return { result: cached.analysis_result as SentenceAnalysisResult };
    }

    // 2. Consume credit
    const limitCheck = await checkAndConsumeCredit(user.id, "sentence", supabase);
    if (!limitCheck.allowed) {
        return { result: null, error: limitCheck.error || "Insufficient credits" };
    }

    const safeSentence = sanitizeForPrompt(normalized);

    // 3. AI call
    try {
        const prompt = `You are an expert English grammar teacher specializing in 英文解釈 (English sentence interpretation) for Japanese learners.

Analyze the following English sentence and return structured JSON with a LAYERED, EXPANDABLE structure.

Sentence: "${safeSentence}"

## DESIGN PHILOSOPHY
The analysis uses Progressive Disclosure:
- Layer 0: Show the main clause skeleton with sentence pattern (第1〜5文型)
- Layer 1: Elements that contain clauses/phrases are expandable (expandsTo field)
- Layer 2: Sub-clauses get their own SVOC analysis, recursively expandable

## SENTENCE PATTERN (文型) - REQUIRED
Determine the main clause's sentence pattern:
1 = 第1文型 (SV) — intransitive
2 = 第2文型 (SVC) — linking verb + complement
3 = 第3文型 (SVO) — transitive with one object
4 = 第4文型 (SVOO) — ditransitive (indirect + direct object)
5 = 第5文型 (SVOC) — object + object complement

Priority rules:
1. V is be/seem/become/look/appear + C required → Pattern 2
2. V is give/tell/show/send/buy etc. with TWO objects → Pattern 4
3. V is make/keep/find/call/consider + O + C → Pattern 5
4. V + one object → Pattern 3
5. No object → Pattern 1

If ambiguous, pick the most likely pattern.

## CRITICAL RULES

### Clause-based analysis
1. EXCLUDE all punctuation (periods, commas, etc.) from SVOC elements.
2. The main clause ALWAYS has clauseId "main".
3. Each clause must have its own sentencePattern (1-5).

### SVOC Roles
- "S" = 主語 (Subject)
- "V" = 動詞 (Verb phrase including auxiliaries)
- "Oi" = 間接目的語 (Indirect Object)
- "Od" = 直接目的語 (Direct Object)
- "C" = 補語 (Complement)
- "M" = 修飾語 (Modifier)

### Dual labels (IMPORTANT: separate function from structure)
For each element, provide BOTH:
- beginnerLabel: simple Japanese (e.g. "〜すること", "〜な本", "いつ？")
- advancedLabel: linguistic term (e.g. "名詞節(that節)", "関係詞節(目的格)", "分詞構文(付帯状況)")

### Expandable elements
If an S, Od, Oi, C, or M element is itself a clause or complex phrase (relative clause, noun clause, participial phrase, infinitive phrase, etc.):
- Set expandsTo to the clauseId of the sub-clause
- Add the sub-clause to the clauses array with parentClause and parentElementIndex referencing back

### Arrow semantics
For M elements and complement relationships, set arrowType:
- "modifies" = modification (adjective/adverb modifying a noun/verb)
- "complement" = complement relationship (subject/object complement)
- "reference" = anaphoric reference (e.g. relative pronoun referring to antecedent)

### startIndex/endIndex
Character positions in the ORIGINAL sentence "${safeSentence}". Inclusive start, exclusive end.

## JSON SCHEMA
{
  "originalSentence": "${safeSentence}",
  "sentencePattern": 3,
  "sentencePatternLabel": "第3文型 (SVO)",
  "clauses": [
    {
      "clauseId": "main",
      "type": "main",
      "typeLabel": "主節",
      "sentencePattern": 3,
      "sentencePatternLabel": "第3文型 (SVO)",
      "elements": [
        {
          "text": "She",
          "startIndex": 0, "endIndex": 3,
          "role": "S",
          "roleLabel": "主語",
          "structureLabel": null,
          "beginnerLabel": "誰が？",
          "advancedLabel": "主語(代名詞)",
          "explanation": "この文の主語。動作の主体。",
          "expandsTo": null,
          "modifiesIndex": null,
          "arrowType": null
        },
        {
          "text": "a book that she had bought yesterday",
          "startIndex": 18, "endIndex": 54,
          "role": "Od",
          "roleLabel": "直接目的語",
          "structureLabel": "名詞句＋関係詞節",
          "beginnerLabel": "何を？→（彼女が昨日買った本）",
          "advancedLabel": "直接目的語(NP＋関係詞節による後置修飾)",
          "explanation": "gaveの直接目的語。関係詞節で修飾された名詞句。クリックで内部構造を展開可能。",
          "expandsTo": "rel-1",
          "modifiesIndex": null,
          "arrowType": null
        }
      ],
      "parentClause": null,
      "parentElementIndex": null,
      "modifierScope": null
    },
    {
      "clauseId": "rel-1",
      "type": "relative",
      "typeLabel": "関係詞節（a bookを後置修飾）",
      "sentencePattern": 3,
      "sentencePatternLabel": "第3文型 (SVO)",
      "elements": [
        {
          "text": "that",
          "startIndex": 26, "endIndex": 30,
          "role": "Od",
          "roleLabel": "直接目的語",
          "structureLabel": "関係代名詞",
          "beginnerLabel": "（＝a book）を",
          "advancedLabel": "関係代名詞(目的格, 先行詞=a book)",
          "explanation": "先行詞a bookを受ける関係代名詞。boughtの目的語。",
          "expandsTo": null,
          "modifiesIndex": null,
          "arrowType": "reference"
        },
        {
          "text": "yesterday",
          "startIndex": 45, "endIndex": 54,
          "role": "M",
          "roleLabel": "修飾語",
          "structureLabel": null,
          "beginnerLabel": "いつ？→昨日",
          "advancedLabel": "時の副詞(文修飾)",
          "explanation": "boughtを時間的に限定する副詞。",
          "expandsTo": null,
          "modifiesIndex": 2,
          "arrowType": "modifies"
        }
      ],
      "parentClause": "main",
      "parentElementIndex": 3,
      "modifierScope": "noun_phrase"
    }
  ],
  "svocPattern": "S + V + Oi + Od[関係詞節]（第4文型 SVOO）",
  "syntaxTree": { "label": "S", "labelJa": "文", "text": "...", "children": [] },
  "translation": "自然な日本語訳",
  "structuralTranslation": "[S]は [Oi]に [Od[関係詞節で修飾]]を [V]した",
  "vocabulary": [{ "word": "...", "pos": "品詞", "meaning": "意味", "pronunciation": "/IPA/" }],
  "grammarPoints": [{ "name": "文法項目", "explanation": "解説", "relevantPart": "該当部分" }],
  "similarExamples": [{ "sentence": "...", "pattern": "パターン", "translation": "訳" }],
  "difficulty": "beginner|intermediate|advanced",
  "structureExplanation": "全体構造の日本語解説。文型、節の関係、修飾構造を明確に。"
}

ALL text explanations MUST be in Japanese.`;

        console.log(`\n=== [Sentence Analysis] "${normalized.slice(0, 60)}..." ===`);

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        if (response.usage) {
            logTokenUsage(
                user.id,
                "sentence_analysis",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0].message.content;
        if (!content) return { result: null, error: "Empty AI response" };

        console.log(`--- Tokens: ${response.usage?.prompt_tokens ?? "?"} prompt, ${response.usage?.completion_tokens ?? "?"} completion ---`);

        const analysisResult = JSON.parse(content) as SentenceAnalysisResult;

        // Validate and fix startIndex/endIndex for all clause elements
        // Sort by startIndex so we search sequentially, avoiding duplicate-word issues
        for (const clause of analysisResult.clauses ?? []) {
            const sorted = [...clause.elements].sort((a, b) => a.startIndex - b.startIndex);
            let searchFrom = 0;
            for (const elem of sorted) {
                const expected = safeSentence.slice(elem.startIndex, elem.endIndex);
                if (expected !== elem.text) {
                    const idx = safeSentence.indexOf(elem.text, searchFrom);
                    if (idx !== -1) {
                        elem.startIndex = idx;
                        elem.endIndex = idx + elem.text.length;
                    }
                }
                searchFrom = Math.max(searchFrom, elem.endIndex);
            }
        }

        // 4. Cache result
        (supabase as any)
            .from("sentence_analysis_cache")
            .insert({
                sentence_normalized: cacheKey,
                analysis_result: analysisResult,
            })
            .then(() => { });

        // 5. Save to user history
        saveToHistory(user.id, normalized, cacheKey, analysisResult, supabase);

        return { result: analysisResult };

    } catch (e: any) {
        console.error("Sentence analysis error:", e);
        return { result: null, error: "英文の解析に失敗しました。" };
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
