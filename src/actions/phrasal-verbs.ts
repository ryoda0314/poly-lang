"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── Language Constants ──

const LANG_NAMES: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", vi: "Vietnamese",
};

// ── Types ──

export interface ExpressionMeaning {
    meaning: string;
    examples: string[];
    formality: "formal" | "neutral" | "informal" | "slang";
}

export interface MeaningDerivation {
    meaning: string;
    connection: string;
}

export interface SameParticleExample {
    expression: string;
    meaning: string;
}

export interface ParticleImagery {
    particle: string;
    direction: "up" | "down" | "out" | "in" | "off" | "on" | "over" | "through" | "away" | "back" | "around" | "about" | "along" | "other";
    coreImage: string;
    coreImageDetail: string;
    meaningDerivations: MeaningDerivation[];
    sameParticleExamples: SameParticleExample[];
}

export interface ExpressionEntry {
    id: string;
    expression: string;
    type: "phrasal_verb" | "idiom" | "collocation";
    meanings: ExpressionMeaning[];
    origin: string;
    history: string;
    particleImagery: ParticleImagery | null;
    relatedExpressions: string[];
    baseVerb: string;
    targetLanguage: string;
}

export interface ExpressionResult {
    entry: ExpressionEntry | null;
    error?: string;
}

export interface VerbExplorerItem {
    expression: string;
    type: "phrasal_verb" | "idiom" | "collocation";
    briefMeaning: string;
    formality: "formal" | "neutral" | "informal" | "slang";
}

export interface VerbExplorerResult {
    verb: string;
    expressions: VerbExplorerItem[];
    targetLanguage: string;
    error?: string;
}

export interface RecentPVSearch {
    query: string;
    search_mode: "expression" | "verb";
    target_language: string;
}

// ── Input Validation ──

const MAX_INPUT_LENGTH = 60;
const VALID_INPUT_PATTERN = /^[\p{L}\p{M}\s'\-·]+$/u;

function validateInput(input: string): string | null {
    if (input.length > MAX_INPUT_LENGTH) {
        return `入力が長すぎます（最大${MAX_INPUT_LENGTH}文字）`;
    }
    if (!VALID_INPUT_PATTERN.test(input)) {
        return "使用できない文字が含まれています。";
    }
    return null;
}

function sanitizeForPrompt(input: string): string {
    return input.replace(/["""«»{}[\]<>\\|]/g, "").trim();
}

// ── DB → Type Mapping ──

function mapDbToEntry(row: any): ExpressionEntry {
    return {
        id: row.id || "",
        expression: row.expression,
        type: row.type,
        meanings: row.meanings || [],
        origin: row.origin || "",
        history: row.history || "",
        particleImagery: row.particle_imagery
            ? {
                particle: row.particle_imagery.particle,
                direction: row.particle_imagery.direction || "other",
                coreImage: row.particle_imagery.core_image,
                coreImageDetail: row.particle_imagery.core_image_detail || "",
                meaningDerivations: (row.particle_imagery.meaning_derivations || []).map((d: any) => ({
                    meaning: d.meaning,
                    connection: d.connection,
                })),
                sameParticleExamples: (row.particle_imagery.same_particle_examples || []).map((e: any) => ({
                    expression: e.expression,
                    meaning: e.meaning,
                })),
            }
            : null,
        relatedExpressions: row.related_expressions || [],
        baseVerb: row.base_verb,
        targetLanguage: row.target_language,
    };
}

// ── Expression Lookup ──

export async function lookupExpression(
    expression: string,
    targetLang: string,
    nativeLang: string
): Promise<ExpressionResult> {
    const normalized = expression.trim().toLowerCase();
    if (!normalized) return { entry: null, error: "Empty input" };

    const validationError = validateInput(normalized);
    if (validationError) return { entry: null, error: validationError };

    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entry: null, error: "Not authenticated" };

    // 2. Cache check
    const { data: cached } = await (supabase as any)
        .from("phrasal_verb_entries")
        .select("*")
        .eq("expression", normalized)
        .eq("target_language", targetLang)
        .single();

    if (cached) {
        (supabase as any).from("phrasal_verb_search_history")
            .insert({ user_id: user.id, query: normalized, search_mode: "expression", target_language: targetLang })
            .then(() => { });
        return { entry: mapDbToEntry(cached) };
    }

    // 3. Credit check
    const limitCheck = await checkAndConsumeCredit(user.id, "expression", supabase);
    if (!limitCheck.allowed) {
        return { entry: null, error: limitCheck.error || "クレジットが不足しています" };
    }

    // 4. AI call
    const safeExpression = sanitizeForPrompt(normalized);
    const langName = LANG_NAMES[targetLang] || "English";
    const nativeLangName = LANG_NAMES[nativeLang] || "English";

    const prompt = `You are an expert linguist specializing in ${langName} phrasal verbs, idioms, and fixed expressions.

Analyze the expression "${safeExpression}" in ${langName} and provide a comprehensive breakdown.

Respond in JSON. All text explanations in ${nativeLangName}.

{
  "expression": "${safeExpression}",
  "type": "phrasal_verb" | "idiom" | "collocation",
  "base_verb": "the main verb in this expression",
  "meanings": [
    {
      "meaning": "definition of this sense",
      "examples": ["example sentence 1", "example sentence 2"],
      "formality": "formal" | "neutral" | "informal" | "slang"
    }
  ],
  "origin": "How this expression was formed/came about (成り立ち). Explain the literal components and how they combine to create the figurative meaning.",
  "history": "Historical background: when it first appeared, how it evolved, any cultural context. Include the approximate century/decade of first known use.",
  "particle_imagery": {
    "particle": "the preposition/particle (e.g. 'up', 'down', 'out', 'off')",
    "direction": "up" | "down" | "out" | "in" | "off" | "on" | "over" | "through" | "away" | "back" | "around" | "about" | "along" | "other",
    "core_image": "A SHORT label for the core spatial/conceptual image (e.g. '上方向・完了・増加', '外へ・完全に・消滅'). Keep to 10 characters or less.",
    "core_image_detail": "A thorough explanation (3-5 sentences) of the core spatial metaphor this particle carries. Describe the physical/spatial origin of the image, then how it extends metaphorically. For example: 'up' originates from physical upward movement. From this, it extends to: (1) completion (use up, eat up — consuming fully, reaching the top), (2) increase (speed up, turn up), (3) appearance/emergence (show up, come up). This single spatial concept unifies all these meanings.",
    "meaning_derivations": [
      {
        "meaning": "the specific meaning of THIS expression that derives from the core image",
        "connection": "How this specific meaning connects to the particle's core image. Be concrete: 'upは「完了」のイメージ → look up で「情報を完全に見つけ出す」'"
      }
    ],
    "same_particle_examples": [
      { "expression": "another phrasal verb with the SAME particle", "meaning": "brief meaning showing the same core image" }
    ]
  },
  "related_expressions": ["expression1", "expression2", "expression3"],
  "formality_summary": "Overall formality assessment of this expression"
}

IMPORTANT RULES:
- For idioms without a particle/preposition, set "particle_imagery" to null.
- Include 2-5 meanings if the expression is polysemous.
- Each meaning MUST have 2 concrete example sentences.
- "origin" should explain the literal → figurative derivation path.
- "related_expressions" should include synonymous or thematically related phrasal verbs/idioms (3-5 items).
- For particle_imagery:
  - "direction" must be one of the enumerated values. Choose the one that best matches the particle.
  - "core_image" is a SHORT label (max 10 chars). Example: "完了・上昇", "外へ・消滅", "離脱・中断"
  - "core_image_detail" must thoroughly explain the core spatial metaphor (3-5 sentences). This is the most important field — it helps the learner understand WHY the particle means what it means.
  - "meaning_derivations" must have one entry PER meaning in the meanings array, showing how EACH specific meaning derives from the core image.
  - "same_particle_examples" should include 3-4 other common phrasal verbs that use the SAME particle with the SAME core image. This shows the pattern.
  - Think about the core spatial metaphor: "up" = completion/increase, "out" = fully/completely/emergence, "down" = recording/reducing/settling, "off" = separation/disconnection, "on" = continuation/attachment, "over" = covering/repetition/transfer, "through" = completion from start to end, "away" = departure/disappearance, "back" = return/reversal.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        // 5. Log tokens
        if (response.usage) {
            logTokenUsage(
                user.id, "expression", "gpt-5.2",
                response.usage.prompt_tokens, response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0].message.content;
        if (!content) return { entry: null, error: "AIからの応答が空でした" };

        const result = JSON.parse(content);

        // 6. Cache in Supabase
        const entryData = {
            expression: normalized,
            target_language: targetLang,
            type: result.type || "phrasal_verb",
            base_verb: result.base_verb || normalized.split(" ")[0],
            meanings: result.meanings || [],
            origin: result.origin || null,
            history: result.history || null,
            particle_imagery: result.particle_imagery || null,
            related_expressions: result.related_expressions || [],
            formality_summary: result.formality_summary || null,
        };

        const { data: inserted } = await (supabase as any)
            .from("phrasal_verb_entries")
            .insert(entryData)
            .select()
            .single();

        // Save search history (fire-and-forget)
        (supabase as any).from("phrasal_verb_search_history")
            .insert({ user_id: user.id, query: normalized, search_mode: "expression", target_language: targetLang })
            .then(() => { });

        return { entry: mapDbToEntry(inserted || { ...entryData, id: "" }) };
    } catch (e) {
        console.error("Expression lookup error:", e);
        return { entry: null, error: "表現の解析に失敗しました。" };
    }
}

// ── Verb Explorer ──

export async function exploreVerb(
    verb: string,
    targetLang: string,
    nativeLang: string
): Promise<VerbExplorerResult> {
    const normalized = verb.trim().toLowerCase();
    if (!normalized) return { verb: normalized, expressions: [], targetLanguage: targetLang, error: "Empty input" };

    const validationError = validateInput(normalized);
    if (validationError) return { verb: normalized, expressions: [], targetLanguage: targetLang, error: validationError };

    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { verb: normalized, expressions: [], targetLanguage: targetLang, error: "Not authenticated" };

    // 2. Cache check
    const { data: cached } = await (supabase as any)
        .from("phrasal_verb_explorer")
        .select("*")
        .eq("verb", normalized)
        .eq("target_language", targetLang)
        .single();

    if (cached) {
        (supabase as any).from("phrasal_verb_search_history")
            .insert({ user_id: user.id, query: normalized, search_mode: "verb", target_language: targetLang })
            .then(() => { });
        return { verb: normalized, expressions: cached.expressions, targetLanguage: targetLang };
    }

    // 3. Credit check
    const limitCheck = await checkAndConsumeCredit(user.id, "expression", supabase);
    if (!limitCheck.allowed) {
        return { verb: normalized, expressions: [], targetLanguage: targetLang, error: limitCheck.error || "クレジットが不足しています" };
    }

    // 4. AI call
    const safeVerb = sanitizeForPrompt(normalized);
    const langName = LANG_NAMES[targetLang] || "English";
    const nativeLangName = LANG_NAMES[nativeLang] || "English";

    const prompt = `You are an expert linguist. List ALL common phrasal verbs, idioms, and collocations that use the ${langName} base verb "${safeVerb}".

Respond in JSON. Brief meanings in ${nativeLangName}.

{
  "verb": "${safeVerb}",
  "expressions": [
    {
      "expression": "the full phrasal verb/idiom",
      "type": "phrasal_verb" | "idiom" | "collocation",
      "brief_meaning": "concise meaning (1 sentence)",
      "formality": "formal" | "neutral" | "informal" | "slang"
    }
  ]
}

RULES:
- Include ALL commonly used phrasal verbs with this verb (aim for 10-25 entries).
- Sort by frequency of use (most common first).
- Include both separable and inseparable phrasal verbs.
- Include well-known idioms containing this verb (e.g. "break the ice", "break a leg").
- For each entry, the "brief_meaning" should be a single concise sentence.
- Do NOT include rare or archaic expressions.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        // 5. Log tokens
        if (response.usage) {
            logTokenUsage(
                user.id, "expression", "gpt-5.2",
                response.usage.prompt_tokens, response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0].message.content;
        if (!content) return { verb: normalized, expressions: [], targetLanguage: targetLang, error: "AIからの応答が空でした" };

        const result = JSON.parse(content);
        const expressions: VerbExplorerItem[] = (result.expressions || []).map((e: any) => ({
            expression: e.expression,
            type: e.type || "phrasal_verb",
            briefMeaning: e.brief_meaning || e.briefMeaning || "",
            formality: e.formality || "neutral",
        }));

        // 6. Cache
        await (supabase as any)
            .from("phrasal_verb_explorer")
            .insert({ verb: normalized, target_language: targetLang, expressions });

        // Search history
        (supabase as any).from("phrasal_verb_search_history")
            .insert({ user_id: user.id, query: normalized, search_mode: "verb", target_language: targetLang })
            .then(() => { });

        return { verb: normalized, expressions, targetLanguage: targetLang };
    } catch (e) {
        console.error("Verb explorer error:", e);
        return { verb: normalized, expressions: [], targetLanguage: targetLang, error: "動詞の探索に失敗しました。" };
    }
}

// ── Recent Searches ──

export async function getRecentPVSearches(targetLang?: string): Promise<RecentPVSearch[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let q = (supabase as any)
        .from("phrasal_verb_search_history")
        .select("query, search_mode, target_language")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(30);

    if (targetLang) {
        q = q.eq("target_language", targetLang);
    }

    const { data } = await q;

    // Deduplicate
    const seen = new Set<string>();
    return (data || [])
        .filter((d: any) => {
            const key = `${d.query}:${d.search_mode}:${d.target_language}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 15);
}
