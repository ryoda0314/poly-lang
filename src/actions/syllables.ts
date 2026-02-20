"use server";

import OpenAI from "openai";
import { logTokenUsage } from "@/lib/token-usage";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const memoryCache = new Map<string, string>();

async function hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getDbCached(textHash: string): Promise<string | null> {
    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from("ipa_cache")
            .select("ipa")
            .eq("text_hash", textHash)
            .eq("mode", "syllable")
            .single();
        return data?.ipa ?? null;
    } catch {
        return null;
    }
}

async function saveDbCache(textHash: string, originalText: string, syllables: string): Promise<void> {
    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from("ipa_cache")
            .upsert(
                { text_hash: textHash, original_text: originalText, mode: "syllable", ipa: syllables },
                { onConflict: "text_hash,mode", ignoreDuplicates: true }
            );
    } catch {
        // Ignore - mode='syllable' may not pass CHECK constraint yet
    }
}

/**
 * Get syllable breakdown for English text.
 * Returns text with middle dots between syllables: "beau·ti·ful in·for·ma·tion"
 *
 * Uses 3-tier cache: memory → database → OpenAI API
 * Shares IPA credit quota.
 */
export async function getSyllableBreakdown(text: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY || !text.trim()) {
        return "";
    }

    const normalizedText = text.trim();
    const textHash = await hashText(normalizedText);
    const cacheKey = `syl:${textHash}`;

    // 1. Memory cache
    if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey)!;
    }

    // 2. Database cache
    const dbCached = await getDbCached(textHash);
    if (dbCached) {
        memoryCache.set(cacheKey, dbCached);
        return dbCached;
    }

    // 3. Check usage limit (shares IPA credit)
    let user: { id: string } | null = null;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
        if (user) {
            const limitCheck = await checkAndConsumeCredit(user.id, "ipa", supabase);
            if (!limitCheck.allowed) {
                return "";
            }
        }
    } catch {
        // Proceed if credit check fails
    }

    // 4. Generate via OpenAI
    try {
        const prompt = `Break each word in the following English text into syllables.
Use the middle dot character (·) to separate syllables within each word.
Keep spaces between words as-is.
Preserve all punctuation exactly.

Text: "${normalizedText}"

Examples:
"beautiful information" → "beau·ti·ful in·for·ma·tion"
"I want to go" → "I want to go"
"comfortable temperature" → "com·fort·a·ble tem·per·a·ture"
"interesting" → "in·ter·est·ing"

Return ONLY the syllable-segmented text, no explanation.`;

        const response = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [{ role: "user", content: prompt }],
        });

        if (response.usage) {
            logTokenUsage(
                user?.id ?? null,
                "syllable",
                "gpt-5-mini",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return "";

        // Clean: remove quotes if present
        const syllables = content.replace(/^["']|["']$/g, "").trim();

        memoryCache.set(cacheKey, syllables);
        saveDbCache(textHash, normalizedText, syllables).catch(console.error);

        return syllables;
    } catch (error) {
        console.error("Syllable generation error:", error);
        return "";
    }
}

/**
 * Batch syllable breakdown for multiple texts.
 */
export async function batchGetSyllableBreakdowns(
    texts: string[]
): Promise<Record<string, string>> {
    if (!process.env.OPENAI_API_KEY || texts.length === 0) {
        return {};
    }

    const results: Record<string, string> = {};
    const uncached: string[] = [];

    for (const text of texts) {
        const normalizedText = text.trim();
        if (!normalizedText) continue;

        const textHash = await hashText(normalizedText);
        const cacheKey = `syl:${textHash}`;

        if (memoryCache.has(cacheKey)) {
            results[normalizedText] = memoryCache.get(cacheKey)!;
            continue;
        }

        const dbCached = await getDbCached(textHash);
        if (dbCached) {
            memoryCache.set(cacheKey, dbCached);
            results[normalizedText] = dbCached;
            continue;
        }

        uncached.push(normalizedText);
    }

    if (uncached.length === 0) return results;

    // Credit check (shares IPA credit)
    let user: { id: string } | null = null;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
        if (user) {
            const limitCheck = await checkAndConsumeCredit(user.id, "ipa", supabase);
            if (!limitCheck.allowed) {
                return results;
            }
        }
    } catch {
        // Proceed if credit check fails
    }

    try {
        const prompt = `Break each word in each of the following English texts into syllables.
Use the middle dot character (·) to separate syllables within each word.
Keep spaces between words as-is.
Preserve all punctuation exactly.

Texts (JSON array):
${JSON.stringify(uncached)}

Return a JSON object mapping each original text to its syllable-segmented version.
Example: {"beautiful information": "beau·ti·ful in·for·ma·tion", "I want to go": "I want to go"}

Return ONLY the JSON object, no markdown or explanation.`;

        const response = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [{ role: "user", content: prompt }],
        });

        if (response.usage) {
            logTokenUsage(
                user?.id ?? null,
                "syllable_batch",
                "gpt-5-mini",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return results;

        const jsonStr = content.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(jsonStr) as Record<string, string>;

        for (const [text, syllables] of Object.entries(parsed)) {
            if (!syllables) continue;
            const clean = syllables.replace(/^["']|["']$/g, "").trim();
            const textHash = await hashText(text);
            const cacheKey = `syl:${textHash}`;

            memoryCache.set(cacheKey, clean);
            saveDbCache(textHash, text, clean).catch(console.error);
            results[text] = clean;
        }
    } catch (error) {
        console.error("Batch syllable generation error:", error);
    }

    return results;
}
