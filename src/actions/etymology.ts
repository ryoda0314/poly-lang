"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── Language Constants ──

const WIKTIONARY_LANG_HEADERS: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", vi: "Vietnamese",
};

const ETYMOLOGY_TIERS: Record<string, 1 | 2 | 3> = {
    en: 1, fr: 1, de: 1, es: 1,
    ja: 2, zh: 2, ko: 2, ru: 2,
    vi: 3,
};

const LANG_NAMES: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", vi: "Vietnamese",
};

// ── Types ──

export interface PartAncestorNode {
    form: string;
    language: string;
    meaning: string;
}

export interface PartBreakdown {
    part: string;
    type: "prefix" | "suffix" | "root" | "combining_form";
    meaning: string;
    origin: string;
    ancestry?: PartAncestorNode[];
}

export interface LearningHint {
    part: string;
    hint: string;
}

export interface NuanceNote {
    words: string[];
    explanation: string;
}

export interface Cognate {
    word: string;
    language: string;
    meaning: string;
}

export interface TreeNode {
    word: string;
    language: string;
    meaning?: string;
    relation?: string;
    children?: TreeNode[];
}

export interface CompoundTree {
    form: string;
    language: string;
    meaning?: string;
    components?: CompoundTree[];
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceInfo {
    overall: ConfidenceLevel;
    etymology: ConfidenceLevel;
    parts: ConfidenceLevel;
    tree: ConfidenceLevel;
    reasoning?: string;
}

export interface EtymologyEntry {
    id: string;
    word: string;
    target_language: string;
    definition: string | null;
    origin_language: string | null;
    etymology_summary: string | null;
    pronunciation: string | null;
    part_breakdown: PartBreakdown[] | null;
    first_known_use: string | null;
    tree_data: TreeNode | null;
    etymology_story: string | null;
    learning_hints: LearningHint[] | null;
    nuance_notes: NuanceNote[] | null;
    cognates: Cognate[] | null;
    compound_tree: CompoundTree | null;
    confidence: ConfidenceInfo | null;
    has_wiktionary_data: boolean;
}

export interface EtymologyResult {
    entry: EtymologyEntry | null;
    error?: string;
}

export interface WordPart {
    id: string;
    part: string;
    part_type: string;
    meaning: string;
    origin_language: string;
    examples: string[] | null;
    learning_hint: string | null;
}

// ── Admin Check ──

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
    return profile?.role === "admin";
}

// ── Web Search (Admin-only) ──

async function fetchWebEtymology(word: string, targetLang: string): Promise<string | null> {
    const langName = LANG_NAMES[targetLang] || "English";
    try {
        const response = await openai.responses.create({
            model: "gpt-5.2",
            tools: [{ type: "web_search" as any }],
            input: `Search for the etymology of the ${langName} word "${word}" using authoritative linguistic sources. Prioritize: etymological dictionaries (e.g. Oxford English Dictionary, 국립국어원 표준국어대사전 for Korean, 大辞林/日本国語大辞典 for Japanese), academic papers on historical linguistics, and official language institute publications. Find: the earliest attested form, historical sound changes, the language of origin, and how the word evolved to its modern form. Cite specific sources when possible.`,
        });

        const text = (response as any).output_text;
        if (!text || text.length < 20) return null;

        console.log(`--- Web search result (${text.length} chars) ---\n${text.slice(0, 500)}...\n`);
        return text;
    } catch (e) {
        console.error("Web search error:", e);
        return null;
    }
}

// ── Wiktionary API ──

async function fetchWiktionaryEtymology(word: string, targetLang: string): Promise<string | null> {
    const tier = ETYMOLOGY_TIERS[targetLang] ?? 3;
    if (tier === 3) return null; // Tier 3: AI-only

    try {
        const url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
        const res = await fetch(url, {
            headers: { "User-Agent": "PolyLang/1.0 (language-learning-app)" },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const wikitext = data?.parse?.wikitext?.["*"];
        if (!wikitext) return null;

        if (targetLang === "en") {
            // English: extract Etymology section directly
            const etymologyMatch = wikitext.match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|\Z)/);
            return etymologyMatch ? etymologyMatch[1].trim() : null;
        }

        // Other languages: find language section header (e.g. ==French==), then extract Etymology within it
        const langHeader = WIKTIONARY_LANG_HEADERS[targetLang];
        if (!langHeader) return null;

        const langSectionRegex = new RegExp(
            `==\\s*${langHeader}\\s*==\\s*\\n([\\s\\S]*?)(?=\\n==\\s*[A-Z]|\\Z)`
        );
        const langSection = wikitext.match(langSectionRegex);
        if (!langSection) return null;

        const etymologyMatch = langSection[1].match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|\Z)/);
        return etymologyMatch ? etymologyMatch[1].trim() : null;
    } catch (e) {
        console.error("Wiktionary API error:", e);
        return null;
    }
}

// ── Main Lookup ──

export async function lookupEtymology(word: string, targetLang: string, nativeLang: string): Promise<EtymologyResult> {
    // German nouns are capitalized — preserve case for de
    const normalizedWord = targetLang === "de" ? word.trim() : word.trim().toLowerCase();
    if (!normalizedWord) return { entry: null, error: "Empty word" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entry: null, error: "Not authenticated" };

    // 1. Check cache (keyed by word + target_language)
    const { data: cached } = await (supabase as any)
        .from("etymology_entries")
        .select("*")
        .eq("word", normalizedWord)
        .eq("target_language", targetLang)
        .single();

    if (cached) {
        // Save to search history (fire-and-forget)
        (supabase as any).from("etymology_search_history")
            .insert({ user_id: user.id, word: normalizedWord, target_language: targetLang })
            .then(() => { });
        return { entry: cached as EtymologyEntry };
    }

    // 2. Consume credit
    const limitCheck = await checkAndConsumeCredit(user.id, "explanation", supabase);
    if (!limitCheck.allowed) {
        return { entry: null, error: limitCheck.error || "Insufficient credits" };
    }

    // 3. Fetch from Wiktionary (tier-based)
    const wikitext = await fetchWiktionaryEtymology(normalizedWord, targetLang);

    const langName = LANG_NAMES[targetLang] || "English";
    console.log(`\n=== [Etymology Debug] Word: "${normalizedWord}" (${langName}) ===`);
    console.log(`--- Wiktionary raw ---\n${wikitext || "(no data)"}\n`);

    // 3b. Web search for admin users when Wiktionary data is missing
    const hasWiktionaryData = !!wikitext;
    let webSearchResult: string | null = null;
    if (!hasWiktionaryData) {
        const adminUser = await isAdmin(supabase, user.id);
        if (adminUser) {
            console.log(`--- Admin user: running web search for "${normalizedWord}" ---`);
            webSearchResult = await fetchWebEtymology(normalizedWord, targetLang);
        }
    }

    const nativeLangName = LANG_NAMES[nativeLang] || "English";

    // 4. AI structuring
    try {
        let sourceGuidance: string;
        if (hasWiktionaryData) {
            sourceGuidance = `Wiktionary data:\n${wikitext}\nUse this as your primary source. Do not add claims beyond what this data supports.`;
        } else if (webSearchResult) {
            sourceGuidance = `Web research data:\n${webSearchResult}\nUse this as reference but verify claims against your training data. Exclude any folk etymologies, urban legends, or unverified theories. Only include claims supported by multiple reliable sources.`;
        } else {
            sourceGuidance = `No Wiktionary data available. Only state what you are confident about from established linguistic scholarship. Do NOT include folk etymologies or urban legend-like theories.`;
        }

        const prompt = `You are an expert etymologist. Analyze the ${langName} word "${normalizedWord}".

${sourceGuidance}

ACCURACY RULES (MUST follow):
1. If the origin is disputed, present the prevailing scholarly theory but add "（諸説あり）" to indicate debate. Never state debated theories as undisputed fact.
2. If multiple research sources agree on a theory, include it with a note like "〜とされる（諸説あり）". Only set a field to null if there is truly NO credible theory at all.
3. For part_breakdown: include morphemes even if their etymology is debated, as long as there is a prevailing scholarly view. Add "（諸説あり）" in the "meaning" field when needed.
4. Do NOT include folk etymologies, urban legends, or unverified popular theories. Only include claims from established linguistic scholarship.
5. For tree_data: only include attested historical forms. Mark reconstructed forms with *. Include sound changes between stages when known (e.g. "어히 (method/means)" → "어이 (ㅎ脱落)").

Respond in JSON. All text explanations in ${nativeLangName}.

{
  "definition": "Brief definition",
  "origin_language": "primary origin language",
  "etymology_summary": "Clear, factual explanation of the word's origin and evolution. State uncertainty where it exists.",
  "pronunciation": "Romanization for Korean (Revised Romanization, e.g. eo-i-eops-eo), hiragana reading for Japanese, pinyin for Chinese, IPA for all other languages",
  "first_known_use": "Century or approximate date",
  "part_breakdown": [
    { "part": "morpheme", "type": "prefix|suffix|root|combining_form", "meaning": "meaning", "origin": "origin language", "ancestry": [{ "form": "ancestor form", "language": "language", "meaning": "meaning" }] }
  ],
  "tree_data": {
    "word": "oldest ancestor",
    "language": "language",
    "meaning": "meaning",
    "children": [{ "word": "intermediate form", "language": "language", "meaning": "meaning", "relation": "inherited|borrowed|derived", "children": [{ "word": "${normalizedWord}", "language": "${langName}", "meaning": "current meaning" }] }]
  },
  "etymology_story": "Engaging narrative about the word's history. Only include well-supported facts.",
  "learning_hints": [{ "part": "morpheme", "hint": "memory tip" }],
  "nuance_notes": [{ "words": ["${normalizedWord}", "synonym"], "explanation": "How etymological origins create usage differences" }],
  "cognates": [{ "word": "cognate", "language": "Language", "meaning": "meaning" }],
  "compound_tree": {
    "form": "${normalizedWord}",
    "language": "${langName}",
    "meaning": "current meaning",
    "components": [
      { "form": "historical form", "language": "language", "meaning": "meaning", "components": [
        { "form": "part1", "language": "language", "meaning": "meaning" },
        { "form": "part2", "language": "language", "meaning": "meaning" }
      ]}
    ]
  },
  "related_words": ["word1", "word2", "word3"],
  "confidence": {
    "overall": "high|medium|low",
    "etymology": "high|medium|low",
    "parts": "high|medium|low",
    "tree": "high|medium|low",
    "reasoning": "Why this confidence level"
  }
}

Notes:
- part_breakdown.ancestry: oldest to newest. Use * for reconstructed forms. Omit ancestry if uncertain.
- tree_data: show the ancestral chain with attested intermediate forms and sound changes.
- compound_tree: show how morphemes were historically combined. Root = modern word, leaves = oldest forms.
- cognates: related words in other modern languages.
- confidence: "high" = well-documented (Latin/Greek, Sino-Korean/Sino-Japanese with known 漢字). "medium" = generally accepted with some uncertainty. "low" = debated or poorly documented. Be honest.`;

        console.log(`--- AI prompt (first 500 chars) ---\n${prompt.slice(0, 500)}...\n`);

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        if (response.usage) {
            logTokenUsage(
                user.id,
                "explanation",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0].message.content;
        if (!content) return { entry: null, error: "Empty AI response" };

        console.log(`--- AI response ---\n${content}\n`);
        console.log(`--- Tokens: ${response.usage?.prompt_tokens ?? "?"} prompt, ${response.usage?.completion_tokens ?? "?"} completion ---\n`);

        const result = JSON.parse(content);

        // 5. Cache in Supabase
        const entryData = {
            word: normalizedWord,
            target_language: targetLang,
            definition: result.definition || null,
            origin_language: result.origin_language || null,
            etymology_summary: result.etymology_summary || null,
            pronunciation: result.pronunciation || null,
            part_breakdown: result.part_breakdown || null,
            first_known_use: result.first_known_use || null,
            tree_data: result.tree_data || null,
            etymology_story: result.etymology_story || null,
            learning_hints: result.learning_hints || null,
            nuance_notes: result.nuance_notes || null,
            cognates: result.cognates || null,
            compound_tree: result.compound_tree || null,
            confidence: result.confidence || null,
            has_wiktionary_data: hasWiktionaryData || !!webSearchResult,
            raw_wikitext: wikitext || webSearchResult || null,
        };

        const { data: inserted, error: insertError } = await (supabase as any)
            .from("etymology_entries")
            .insert(entryData)
            .select()
            .single();

        if (insertError) {
            console.error("Failed to cache etymology:", insertError);
        }

        // 6. Cache derivation relationships
        if (result.related_words && Array.isArray(result.related_words)) {
            const derivations = result.related_words.map((childWord: string) => ({
                parent_word: normalizedWord,
                child_word: targetLang === "de" ? childWord : childWord.toLowerCase(),
                relationship_type: "related",
                target_language: targetLang,
            }));

            if (derivations.length > 0) {
                (supabase as any).from("etymology_derivations")
                    .upsert(derivations, { onConflict: "parent_word,child_word,target_language" })
                    .then(() => { });
            }
        }

        // 7. Save search history
        (supabase as any).from("etymology_search_history")
            .insert({ user_id: user.id, word: normalizedWord, target_language: targetLang })
            .then(() => { });

        return { entry: (inserted || entryData) as EtymologyEntry };

    } catch (e) {
        console.error("Etymology AI Error:", e);
        return { entry: null, error: "Failed to analyze etymology" };
    }
}

// ── Word Parts Search ──

export async function searchWordParts(
    query?: string,
    type?: string,
    origin?: string
): Promise<WordPart[]> {
    const supabase = await createClient();

    let q = (supabase as any)
        .from("etymology_word_parts")
        .select("*")
        .order("part", { ascending: true });

    if (type && type !== "all") {
        q = q.eq("part_type", type);
    }
    if (origin && origin !== "all") {
        q = q.eq("origin_language", origin);
    }
    if (query) {
        q = q.or(`part.ilike.%${query}%,meaning.ilike.%${query}%,learning_hint.ilike.%${query}%`);
    }

    const { data, error } = await q.limit(200);

    if (error) {
        console.error("Word parts search error:", error);
        return [];
    }

    return data as WordPart[];
}

// ── Related Words ──

export async function getRelatedWords(word: string, targetLang: string): Promise<string[]> {
    const supabase = await createClient();
    const normalizedWord = targetLang === "de" ? word.trim() : word.trim().toLowerCase();

    const { data } = await (supabase as any)
        .from("etymology_derivations")
        .select("child_word")
        .eq("parent_word", normalizedWord)
        .eq("target_language", targetLang)
        .limit(20);

    return data?.map((d: any) => d.child_word) || [];
}

// ── Recent Searches ──

export interface RecentSearch {
    word: string;
    target_language: string;
}

export async function getRecentSearches(targetLang?: string): Promise<RecentSearch[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let q = (supabase as any)
        .from("etymology_search_history")
        .select("word, target_language")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(30);

    if (targetLang) {
        q = q.eq("target_language", targetLang);
    }

    const { data } = await q;

    // Deduplicate by word+lang
    const seen = new Set<string>();
    return (data || [])
        .filter((d: any) => {
            const key = `${d.word}:${d.target_language}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 20)
        .map((d: any) => ({ word: d.word, target_language: d.target_language }));
}
