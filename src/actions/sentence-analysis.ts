"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── Types ──

export type SvocRole = "S" | "V" | "O" | "C" | "M";

export interface SvocElement {
    text: string;
    startIndex: number;
    endIndex: number;
    role: SvocRole;
    roleLabel: string;
    subRole: string;
    modifiesIndex: number | null;
    explanation: string;
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
    svocElements: SvocElement[];
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

Analyze the following English sentence and return structured JSON.

Sentence: "${safeSentence}"

CRITICAL RULES:
1. ALL explanations, labels, and translations MUST be in Japanese.
2. svocElements must cover every word in the sentence (no gaps). Adjacent words with the same syntactic role should be grouped into a single element.
3. startIndex/endIndex must be accurate character positions in the ORIGINAL sentence "${safeSentence}". startIndex is inclusive, endIndex is exclusive. Verify: sentence.slice(startIndex, endIndex) === text for each element.
4. modifiesIndex: for modifiers (M), provide the 0-based index of the svocElements array element being modified. For non-modifiers, set to null.
5. syntaxTree must be a valid constituency parse tree with standard labels (S, NP, VP, PP, AdjP, AdvP, Det, N, V, Aux, P, Adj, Adv, Conj, etc.).
6. vocabulary: include all content words (nouns, verbs, adjectives, adverbs) with IPA pronunciation.
7. grammarPoints: identify 1-4 key grammar structures present in the sentence.
8. similarExamples: provide 2-3 English sentences that use the same structural pattern.
9. difficulty: "beginner" for simple SV/SVO sentences, "intermediate" for compound/complex sentences, "advanced" for deeply nested or literary structures.

Return a JSON object with this exact schema:
{
  "originalSentence": "${safeSentence}",
  "svocElements": [
    {
      "text": "exact text span from the sentence",
      "startIndex": 0,
      "endIndex": 5,
      "role": "S|V|O|C|M",
      "roleLabel": "主語|動詞|目的語|補語|修飾語",
      "subRole": "e.g. 直接目的語, 間接目的語, 主格補語, 副詞的修飾語, 形容詞的修飾語, 時を表す副詞, 場所を表す前置詞句",
      "modifiesIndex": null,
      "explanation": "Japanese explanation of this element's function in the sentence"
    }
  ],
  "svocPattern": "S + V + O + M (SVO型)",
  "syntaxTree": {
    "label": "S",
    "labelJa": "文",
    "text": "full sentence text",
    "children": [
      {
        "label": "NP",
        "labelJa": "名詞句",
        "text": "...",
        "children": [...]
      }
    ]
  },
  "translation": "自然な日本語訳",
  "structuralTranslation": "英文の構造に忠実な逐語訳（構造が分かるように括弧付き）",
  "vocabulary": [
    {
      "word": "word",
      "pos": "品詞（日本語）",
      "meaning": "日本語の意味",
      "pronunciation": "/IPA/",
      "note": "optional usage note"
    }
  ],
  "grammarPoints": [
    {
      "name": "文法項目名（日本語）",
      "explanation": "日本語での解説",
      "relevantPart": "該当する英文の部分"
    }
  ],
  "similarExamples": [
    {
      "sentence": "English sentence with similar structure",
      "pattern": "構造パターン（日本語）",
      "translation": "日本語訳"
    }
  ],
  "difficulty": "beginner|intermediate|advanced",
  "structureExplanation": "この文の全体構造を日本語で解説。文型の特徴、節の関係、修飾構造などを詳しく説明する。"
}`;

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

        // Validate and fix startIndex/endIndex
        for (const elem of analysisResult.svocElements) {
            const expected = safeSentence.slice(elem.startIndex, elem.endIndex);
            if (expected !== elem.text) {
                // Try to find the text in the sentence
                const idx = safeSentence.indexOf(elem.text);
                if (idx !== -1) {
                    elem.startIndex = idx;
                    elem.endIndex = idx + elem.text.length;
                }
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

        return { result: analysisResult };

    } catch (e: any) {
        console.error("Sentence analysis error:", e);
        return { result: null, error: "英文の解析に失敗しました。" };
    }
}
