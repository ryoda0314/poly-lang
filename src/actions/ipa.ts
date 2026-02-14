"use server";

import OpenAI from "openai";
import { logTokenUsage } from "@/lib/token-usage";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for current server instance
const memoryCache = new Map<string, string>();

/**
 * Simple hash for cache key (SHA-256 hex via Web Crypto)
 */
async function hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get cached IPA from database
 */
async function getDbCached(textHash: string, mode: string): Promise<string | null> {
    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from("ipa_cache")
            .select("ipa")
            .eq("text_hash", textHash)
            .eq("mode", mode)
            .single();

        return data?.ipa ?? null;
    } catch {
        return null;
    }
}

/**
 * Save IPA to database cache
 */
async function saveDbCache(textHash: string, originalText: string, mode: string, ipa: string): Promise<void> {
    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from("ipa_cache")
            .upsert(
                { text_hash: textHash, original_text: originalText, mode, ipa },
                { onConflict: "text_hash,mode", ignoreDuplicates: true }
            );
    } catch {
        // Ignore database errors
    }
}

/**
 * Get IPA transcription for English text using OpenAI.
 * Supports two modes:
 * - 'word': dictionary-style IPA for each word
 * - 'connected': connected speech IPA with reductions, linking, assimilation
 *
 * Uses 3-tier cache: memory → database → OpenAI API
 */
export async function getIPATranscription(
    text: string,
    mode: "word" | "connected"
): Promise<string> {
    if (!process.env.OPENAI_API_KEY || !text.trim()) {
        return "";
    }

    const normalizedText = text.trim();
    const textHash = await hashText(normalizedText);
    const cacheKey = `${mode}:${textHash}`;

    // 1. Memory cache
    if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey)!;
    }

    // 2. Database cache
    const dbCached = await getDbCached(textHash, mode);
    if (dbCached) {
        memoryCache.set(cacheKey, dbCached);
        return dbCached;
    }

    // 3. Check usage limit before calling OpenAI
    let user: { id: string } | null = null;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
        if (user) {
            const limitCheck = await checkAndConsumeCredit(user.id, "ipa", supabase);
            if (!limitCheck.allowed) {
                console.warn("IPA credit check denied for user", user.id, limitCheck.error);
                return "";
            }
        }
    } catch (e) {
        console.warn("IPA credit check failed, proceeding anyway:", e);
    }

    // 4. Generate via OpenAI
    try {
        const prompt = mode === "word"
            ? `Convert the following English text to IPA transcription (American English, dictionary pronunciation).

FORMAT RULES:
- DOTS (.) separate syllables WITHIN a word. SPACES separate different words. Never use spaces between syllables of the same word.
- Place ˈ (primary) or ˌ (secondary) before the stressed syllable within a word.
- Place * ONLY at the very start of a content word (noun, main verb, adjective, adverb) to mark sentence stress. Never place * between syllables or inside a word. Function words (articles, prepositions, pronouns, auxiliaries, conjunctions) do NOT get *.
- Wrap in slashes: /…/

Text: "${normalizedText}"

Examples:
"hello world" → /*hə.ˈloʊ *wɜːrld/
"I want to go" → /aɪ *wɒnt tə *ɡoʊ/
"beautiful information" → /*ˈbjuː.tɪ.fəl *ˌɪn.fɚ.ˈmeɪ.ʃən/
"the cat is on the table" → /ðə *kæt ɪz ɒn ðə *ˈteɪ.bəl/
"I'm not really enjoying this conversation" → /aɪm nɒt *ˈrɪ.li *ɪn.ˈdʒɔɪ.ɪŋ ðɪs *ˌkɒn.vɚ.ˈseɪ.ʃən/
"she is improving quickly" → /ʃi ɪz *ɪm.ˈpɹuː.vɪŋ *ˈkwɪk.li/

Return ONLY the IPA (e.g. /.../) with no explanation.`
            : `Convert the following English text to IPA transcription reflecting natural connected speech (American English).
Apply reductions, linking, assimilation, elision, and weak forms.

FORMAT RULES:
- DOTS (.) separate syllables WITHIN a word. SPACES separate different words. Never use spaces between syllables of the same word.
- Place ˈ (primary) or ˌ (secondary) before the stressed syllable within a word.
- Place * ONLY at the very start of a content word (noun, main verb, adjective, adverb) to mark sentence stress. Never place * between syllables or inside a word. Function words in weak form do NOT get *.
- Wrap in slashes: /…/

Text: "${normalizedText}"

Examples:
"I want to go to the store" → /aɪ *ˈwɒ.nə *ɡoʊ tə ðə *stɔːr/
"beautiful information" → /*ˈbjuː.ɾɪ.fəl *ˌɪn.fɚ.ˈmeɪ.ʃən/
"the cat is on the table" → /ðə *kæt ɪz ɒn ðə *ˈteɪ.bəl/
"I'm not really enjoying this conversation" → /aɪm nɒt *ˈrɪ.li *ɪn.ˈdʒɔɪ.ɪŋ ðɪs *ˌkɒn.vɚ.ˈseɪ.ʃən/
"she was improving quickly" → /ʃi wəz *ɪm.ˈpɹuː.vɪŋ *ˈkwɪk.li/

Return ONLY the IPA (e.g. /.../) with no explanation.`;

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
        });

        if (response.usage) {
            logTokenUsage(
                user?.id ?? null,
                "ipa",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return "";

        // Clean up: ensure wrapped in slashes
        const ipa = content.startsWith("/") ? content : `/${content}/`;

        // Save to caches
        memoryCache.set(cacheKey, ipa);
        saveDbCache(textHash, normalizedText, mode, ipa).catch(console.error);

        return ipa;
    } catch (error) {
        console.error("IPA generation error:", error);
        return "";
    }
}

/**
 * Batch IPA transcription for multiple texts at once.
 * Returns a map of text → IPA.
 */
export async function batchGetIPATranscriptions(
    texts: string[],
    mode: "word" | "connected"
): Promise<Record<string, string>> {
    if (!process.env.OPENAI_API_KEY || texts.length === 0) {
        return {};
    }

    const results: Record<string, string> = {};
    const uncached: string[] = [];

    // Check caches for each text
    for (const text of texts) {
        const normalizedText = text.trim();
        if (!normalizedText) continue;

        const textHash = await hashText(normalizedText);
        const cacheKey = `${mode}:${textHash}`;

        // Memory cache
        if (memoryCache.has(cacheKey)) {
            results[normalizedText] = memoryCache.get(cacheKey)!;
            continue;
        }

        // DB cache
        const dbCached = await getDbCached(textHash, mode);
        if (dbCached) {
            memoryCache.set(cacheKey, dbCached);
            results[normalizedText] = dbCached;
            continue;
        }

        uncached.push(normalizedText);
    }

    if (uncached.length === 0) return results;

    // Check usage limit before calling OpenAI
    let user: { id: string } | null = null;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
        if (user) {
            const limitCheck = await checkAndConsumeCredit(user.id, "ipa", supabase);
            if (!limitCheck.allowed) {
                console.warn("IPA batch credit check denied for user", user.id, limitCheck.error);
                return results;
            }
        }
    } catch (e) {
        console.warn("IPA batch credit check failed, proceeding anyway:", e);
    }

    // Generate all uncached at once
    try {
        const prompt = mode === "word"
            ? `Convert each of the following English texts to IPA transcription (American English, dictionary pronunciation).

FORMAT RULES:
- DOTS (.) separate syllables WITHIN a word. SPACES separate different words. Never use spaces between syllables of the same word.
- Place ˈ (primary) or ˌ (secondary) before the stressed syllable within a word.
- Place * ONLY at the very start of a content word (noun, main verb, adjective, adverb) to mark sentence stress. Never place * between syllables or inside a word. Function words do NOT get *.
- Wrap each transcription in slashes: /…/

Texts (JSON array):
${JSON.stringify(uncached)}

Return a JSON object mapping each text to its IPA transcription.
Example: {"hello world": "/*hə.ˈloʊ *wɜːrld/", "I'm enjoying this conversation": "/aɪm *ɪn.ˈdʒɔɪ.ɪŋ ðɪs *ˌkɒn.vɚ.ˈseɪ.ʃən/"}

Return ONLY the JSON object, no markdown or explanation.`
            : `Convert each of the following English texts to IPA transcription reflecting natural connected speech (American English).
Apply reductions, linking, assimilation, elision, and weak forms.

FORMAT RULES:
- DOTS (.) separate syllables WITHIN a word. SPACES separate different words. Never use spaces between syllables of the same word.
- Place ˈ (primary) or ˌ (secondary) before the stressed syllable within a word.
- Place * ONLY at the very start of a content word (noun, main verb, adjective, adverb) to mark sentence stress. Never place * between syllables or inside a word. Function words in weak form do NOT get *.
- Wrap each transcription in slashes: /…/

Texts (JSON array):
${JSON.stringify(uncached)}

Return a JSON object mapping each text to its connected-speech IPA transcription.
Example: {"I want to go to the store": "/aɪ *ˈwɒ.nə *ɡoʊ tə ðə *stɔːr/", "I'm enjoying this conversation": "/aɪm *ɪn.ˈdʒɔɪ.ɪŋ ðɪs *ˌkɒn.vɚ.ˈseɪ.ʃən/"}

Return ONLY the JSON object, no markdown or explanation.`;

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
        });

        if (response.usage) {
            logTokenUsage(
                user?.id ?? null,
                "ipa_batch",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return results;

        const jsonStr = content.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(jsonStr) as Record<string, string>;

        // Save each result
        for (const [text, ipa] of Object.entries(parsed)) {
            if (!ipa) continue;
            const cleanIpa = ipa.startsWith("/") ? ipa : `/${ipa}/`;
            const textHash = await hashText(text);
            const cacheKey = `${mode}:${textHash}`;

            memoryCache.set(cacheKey, cleanIpa);
            saveDbCache(textHash, text, mode, cleanIpa).catch(console.error);
            results[text] = cleanIpa;
        }
    } catch (error) {
        console.error("Batch IPA generation error:", error);
    }

    return results;
}
