"use server";

import OpenAI from "openai";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Server-side cache for furigana readings
const furiganaCache = new Map<string, string>();

/**
 * Get furigana readings for Japanese text using OpenAI API
 * Returns a map of token text to its hiragana reading
 */
export async function getFuriganaReadings(
    tokens: string[]
): Promise<Record<string, string>> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set.");
        return {};
    }

    // Filter tokens that contain kanji and aren't cached
    const kanjiRegex = /[\u4e00-\u9faf\u3400-\u4dbf]/;
    const tokensToProcess = tokens.filter(t =>
        kanjiRegex.test(t) && !furiganaCache.has(t)
    );

    // Return cached results if all tokens are cached
    if (tokensToProcess.length === 0) {
        const result: Record<string, string> = {};
        tokens.forEach(t => {
            const cached = furiganaCache.get(t);
            if (cached) result[t] = cached;
        });
        return result;
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
        if (!content) return {};

        const jsonStr = content.replace(/^```json/, "").replace(/```$/, "").trim();
        const readings = JSON.parse(jsonStr) as Record<string, string>;

        // Cache the results
        Object.entries(readings).forEach(([word, reading]) => {
            if (reading) {
                furiganaCache.set(word, reading);
            }
        });

        // Build result including previously cached items
        const result: Record<string, string> = { ...readings };
        tokens.forEach(t => {
            const cached = furiganaCache.get(t);
            if (cached && !result[t]) result[t] = cached;
        });

        return result;
    } catch (error) {
        console.error("Furigana API error:", error);
        return {};
    }
}