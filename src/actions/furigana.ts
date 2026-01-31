"use server";

import OpenAI from "openai";
import { logTokenUsage } from "@/lib/token-usage";
import { createAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for current request (fallback)
const memoryCache = new Map<string, string>();

interface FuriganaCacheRow {
    kanji: string;
    reading: string;
}

/**
 * Get cached readings from database
 */
async function getDbCachedReadings(tokens: string[]): Promise<Record<string, string>> {
    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from("furigana_cache")
            .select("kanji, reading")
            .in("kanji", tokens);

        const result: Record<string, string> = {};
        if (data) {
            (data as FuriganaCacheRow[]).forEach(row => {
                result[row.kanji] = row.reading;
            });
        }
        return result;
    } catch {
        // Table might not exist yet, return empty
        return {};
    }
}

/**
 * Save readings to database
 */
async function saveDbReadings(readings: Record<string, string>): Promise<void> {
    try {
        const supabase = await createAdminClient();
        const rows = Object.entries(readings)
            .filter(([, reading]) => reading)
            .map(([kanji, reading]) => ({ kanji, reading }));

        if (rows.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from("furigana_cache")
                .upsert(rows, { onConflict: "kanji", ignoreDuplicates: true });
        }
    } catch {
        // Ignore database errors
    }
}

/**
 * Get furigana readings for Japanese text using OpenAI API
 * Returns a map of token text to its hiragana reading
 * Uses database cache to minimize API calls
 */
export async function getFuriganaReadings(
    tokens: string[]
): Promise<Record<string, string>> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set.");
        return {};
    }

    // Filter tokens that contain kanji
    const kanjiRegex = /[\u4e00-\u9faf\u3400-\u4dbf]/;
    const kanjiTokens = tokens.filter(t => kanjiRegex.test(t));

    if (kanjiTokens.length === 0) {
        return {};
    }

    // Check database cache first
    const dbCached = await getDbCachedReadings(kanjiTokens);

    // Also check memory cache
    kanjiTokens.forEach(t => {
        if (!dbCached[t] && memoryCache.has(t)) {
            dbCached[t] = memoryCache.get(t)!;
        }
    });

    // Find tokens still needing API call
    const tokensToProcess = kanjiTokens.filter(t => !dbCached[t]);

    // Return cached results if all tokens are cached
    if (tokensToProcess.length === 0) {
        return dbCached;
    }

    try {
        const prompt = `Convert the following Japanese words/phrases to hiragana readings (furigana).
Return ONLY a JSON object mapping each input to its hiragana reading.
If a word has no kanji, return empty string for that word.

Input words (JSON array):
${JSON.stringify(tokensToProcess)}

Example output format:
{"漢字": "かんじ", "東京": "とうきょう", "食べる": "たべる"}

Return ONLY the JSON object, no markdown or explanation.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
        });

        // Log token usage
        if (response.usage) {
            logTokenUsage(
                null,
                "furigana",
                "gpt-4o-mini",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return dbCached;

        const jsonStr = content.replace(/^```json/, "").replace(/```$/, "").trim();
        const readings = JSON.parse(jsonStr) as Record<string, string>;

        // Save to memory cache
        Object.entries(readings).forEach(([word, reading]) => {
            if (reading) {
                memoryCache.set(word, reading);
            }
        });

        // Save to database (async, don't block)
        saveDbReadings(readings).catch(console.error);

        // Combine cached + new readings
        return { ...dbCached, ...readings };
    } catch (error) {
        console.error("Furigana API error:", error);
        return dbCached;
    }
}