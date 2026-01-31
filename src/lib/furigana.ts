"use client";

import { getFuriganaReadings } from "@/actions/furigana";

// Client-side cache
const clientCache = new Map<string, string>();

/**
 * Check if a character is a kanji
 */
export function isKanji(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

/**
 * Check if a string contains kanji characters
 */
export function containsKanji(text: string): boolean {
    for (const char of text) {
        if (isKanji(char)) return true;
    }
    return false;
}

/**
 * Get furigana for a single token (uses client cache)
 */
export function getCachedFurigana(text: string): string | undefined {
    return clientCache.get(text);
}

/**
 * Fetch furigana readings for multiple tokens from server
 * Updates client cache and returns the readings
 */
export async function fetchFuriganaForTokens(
    tokens: string[]
): Promise<Map<string, string>> {
    // Filter tokens that contain kanji
    const kanjiTokens = tokens.filter(t => containsKanji(t));

    if (kanjiTokens.length === 0) {
        return new Map();
    }

    // Check which tokens are not in cache
    const uncachedTokens = kanjiTokens.filter(t => !clientCache.has(t));

    // If all are cached, return from cache
    if (uncachedTokens.length === 0) {
        const result = new Map<string, string>();
        kanjiTokens.forEach(t => {
            const cached = clientCache.get(t);
            if (cached) result.set(t, cached);
        });
        return result;
    }

    try {
        // Fetch from server
        const readings = await getFuriganaReadings(uncachedTokens);

        // Update client cache
        Object.entries(readings).forEach(([word, reading]) => {
            if (reading) {
                clientCache.set(word, reading);
            }
        });

        // Build result map
        const result = new Map<string, string>();
        kanjiTokens.forEach(t => {
            const reading = clientCache.get(t) || readings[t];
            if (reading) result.set(t, reading);
        });

        return result;
    } catch (error) {
        console.error("Failed to fetch furigana:", error);
        return new Map();
    }
}

/**
 * Get furigana (uses cache, returns empty if not cached)
 */
export function getFurigana(text: string): string {
    return clientCache.get(text) || "";
}

/**
 * Preload is no longer needed (no heavy dictionary)
 */
export async function preloadFurigana(): Promise<void> {
    // No-op - server-side processing now
}