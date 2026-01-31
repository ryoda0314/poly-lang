"use client";

import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

// Singleton instance
let kuroshiroInstance: Kuroshiro | null = null;
let initializationPromise: Promise<Kuroshiro | null> | null = null;
let initFailed = false;

/**
 * Get or initialize the kuroshiro instance
 * Uses singleton pattern to avoid multiple initializations
 */
async function getKuroshiro(): Promise<Kuroshiro | null> {
    if (initFailed) return null;
    if (kuroshiroInstance) return kuroshiroInstance;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        try {
            const kuroshiro = new Kuroshiro();
            await kuroshiro.init(new KuromojiAnalyzer());
            kuroshiroInstance = kuroshiro;
            return kuroshiro;
        } catch (error) {
            console.error("Failed to initialize kuroshiro:", error);
            initFailed = true;
            return null;
        }
    })();

    return initializationPromise;
}

/**
 * Check if a character is a kanji
 */
export function isKanji(char: string): boolean {
    const code = char.charCodeAt(0);
    // CJK Unified Ideographs and Extension A
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

// Cache for furigana readings to avoid repeated API calls
const furiganaCache = new Map<string, string>();

/**
 * Get furigana (hiragana reading) for a Japanese text
 * Returns empty string if no kanji or initialization failed
 */
export async function getFurigana(text: string): Promise<string> {
    if (!text || !containsKanji(text)) return "";

    // Check cache first
    const cached = furiganaCache.get(text);
    if (cached !== undefined) return cached;

    const kuroshiro = await getKuroshiro();
    if (!kuroshiro) return "";

    try {
        const reading = await kuroshiro.convert(text, {
            to: "hiragana",
            mode: "normal"
        });

        // Only cache and return if reading is different from original
        if (reading !== text) {
            furiganaCache.set(text, reading);
            return reading;
        }
        furiganaCache.set(text, "");
        return "";
    } catch (error) {
        console.error("Failed to get furigana:", error);
        return "";
    }
}

/**
 * Get furigana map for each kanji segment in a sentence
 * Returns a map of start position -> { text: kanji, reading: hiragana }
 */
export interface FuriganaSegment {
    text: string;
    reading: string;
    start: number;
    end: number;
}

export async function getFuriganaSegments(text: string): Promise<FuriganaSegment[]> {
    if (!text || !containsKanji(text)) return [];

    const kuroshiro = await getKuroshiro();
    if (!kuroshiro) return [];

    try {
        // Get furigana with ruby tags
        const result = await kuroshiro.convert(text, {
            to: "hiragana",
            mode: "furigana"
        });

        // Parse ruby tags: <ruby>kanji<rp>(</rp><rt>reading</rt><rp>)</rp></ruby>
        const segments: FuriganaSegment[] = [];
        const rubyRegex = /<ruby>([^<]+)<rp>\(<\/rp><rt>([^<]+)<\/rt><rp>\)<\/rp><\/ruby>/g;

        let match;
        let processedText = "";
        let lastIndex = 0;

        while ((match = rubyRegex.exec(result)) !== null) {
            // Add text before this ruby tag
            const beforeRuby = result.substring(lastIndex, match.index);
            // Remove any HTML tags from beforeRuby
            const cleanBefore = beforeRuby.replace(/<[^>]*>/g, "");
            processedText += cleanBefore;

            const kanji = match[1];
            const reading = match[2];
            const start = processedText.length;

            segments.push({
                text: kanji,
                reading: reading,
                start: start,
                end: start + kanji.length
            });

            processedText += kanji;
            lastIndex = match.index + match[0].length;
        }

        return segments;
    } catch (error) {
        console.error("Failed to get furigana segments:", error);
        return [];
    }
}

/**
 * Initialize kuroshiro in the background
 * Call this early to pre-load the analyzer
 */
export async function preloadFurigana(): Promise<void> {
    await getKuroshiro();
}

/**
 * Check if kuroshiro is ready
 */
export function isFuriganaReady(): boolean {
    return kuroshiroInstance !== null;
}
