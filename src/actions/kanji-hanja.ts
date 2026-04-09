"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";
import { containsKanji } from "@/lib/furigana";

// ============================================
// Types
// ============================================

export interface KanjiHanjaMapping {
    kanji: string;
    hanja: string;
    koreanReading: string;
    hanjaMeaning: string;
    wordType: 'character' | 'compound';
    additionalReadings?: string[];
    usageExamples?: { japanese: string; korean: string; meaning?: string }[];
    confidence: 'high' | 'medium' | 'low';
}

interface KanjiHanjaDBRow {
    id: string;
    kanji: string;
    hanja: string;
    korean_reading: string;
    hanja_meaning: string | null;
    word_type: 'character' | 'compound';
    additional_readings: string[] | null;
    usage_examples: { japanese: string; korean: string; meaning?: string }[] | null;
    source: 'openai' | 'manual';
    confidence: 'high' | 'medium' | 'low' | null;
    created_at: string;
}

// ============================================
// Memory Cache
// ============================================

const memoryCache = new Map<string, KanjiHanjaMapping>();

// ============================================
// Helper Functions
// ============================================

function dbRowToMapping(row: KanjiHanjaDBRow): KanjiHanjaMapping {
    return {
        kanji: row.kanji,
        hanja: row.hanja,
        koreanReading: row.korean_reading,
        hanjaMeaning: row.hanja_meaning || '',
        wordType: row.word_type,
        additionalReadings: row.additional_readings || undefined,
        usageExamples: row.usage_examples || undefined,
        confidence: row.confidence || 'medium'
    };
}

function buildCharacterPrompt(kanji: string): string {
    return `You are a Japanese-Korean linguistics expert. Provide the Korean hanja equivalent for the Japanese kanji character: "${kanji}"

Return a JSON object with this exact structure:
{
    "hanja": "Korean hanja character (usually same as Japanese)",
    "korean_reading": "Korean pronunciation in Hangul (e.g., '전')",
    "hanja_meaning": "훈음 format - meaning + reading (e.g., '번개 전')",
    "additional_readings": ["array of alternative Korean readings if any, otherwise empty array"],
    "usage_notes": "Brief note about common usage (optional)",
    "confidence": "high|medium|low"
}

Important:
- hanja_meaning should be in the format: "[Korean meaning] [reading]" (e.g., "번개 전")
- If multiple readings exist, put the most common in korean_reading and others in additional_readings
- Set confidence to "high" if certain, "medium" if mostly certain, "low" if uncertain`;
}

function buildCompoundPrompt(kanji: string): string {
    return `You are a Japanese-Korean linguistics expert. Provide the Korean hanja equivalent for the Japanese compound word (熟語): "${kanji}"

Return a JSON object with this exact structure:
{
    "hanja": "Korean hanja compound (e.g., '電話')",
    "korean_reading": "Korean pronunciation in Hangul (e.g., '전화')",
    "hanja_meaning": "Breakdown each hanja with 훈음 format (e.g., '電(번개 전) + 話(말씀 화)')",
    "usage_examples": [
        {"japanese": "example Japanese sentence", "korean": "Korean translation using 한자어", "meaning": "English meaning (optional)"}
    ],
    "additional_readings": ["alternative readings if any, otherwise empty array"],
    "confidence": "high|medium|low"
}

Important:
- hanja_meaning should break down each character with 훈음
- Provide 1-3 usage examples showing the 한자어 in natural Korean sentences
- Set confidence based on how certain you are about the mapping`;
}

// ============================================
// Core Functions
// ============================================

/**
 * Three-tier lookup: memory cache → DB → OpenAI
 */
export async function lookupKanjiHanja(
    kanji: string,
    wordType: 'character' | 'compound'
): Promise<KanjiHanjaMapping | null> {
    // Validate input
    if (!kanji || !containsKanji(kanji)) {
        console.error("Invalid input: no kanji detected in", kanji);
        return null;
    }

    // Tier 1: Memory cache
    const cacheKey = `${kanji}:${wordType}`;
    if (memoryCache.has(cacheKey)) {
        console.log(`[KanjiHanja] Memory cache hit for ${kanji}`);
        return memoryCache.get(cacheKey)!;
    }

    // Tier 2: Database cache
    try {
        const supabase = await createClient();
        const { data: cached, error } = await supabase
            .from('kanji_hanja_mappings')
            .select('*')
            .eq('kanji', kanji)
            .eq('word_type', wordType)
            .single();

        if (!error && cached) {
            console.log(`[KanjiHanja] DB cache hit for ${kanji}`);
            const mapping = dbRowToMapping(cached as KanjiHanjaDBRow);
            memoryCache.set(cacheKey, mapping);
            return mapping;
        }
    } catch (error) {
        console.error(`[KanjiHanja] DB lookup error for ${kanji}:`, error);
    }

    // Tier 3: Generate via OpenAI
    console.log(`[KanjiHanja] Cache miss, generating via OpenAI for ${kanji}`);
    return await generateKanjiHanjaMapping(kanji, wordType);
}

/**
 * Generate kanji-hanja mapping using OpenAI
 */
async function generateKanjiHanjaMapping(
    kanji: string,
    wordType: 'character' | 'compound'
): Promise<KanjiHanjaMapping | null> {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("[KanjiHanja] Not authenticated:", authError);
        return null;
    }

    // Check and consume credits
    try {
        const limitCheck = await checkAndConsumeCredit(user.id, 'kanji_hanja', supabase);
        if (!limitCheck.allowed) {
            console.error("[KanjiHanja] Credit limit reached");
            throw new Error('Credit limit reached for kanji_hanja lookups');
        }
    } catch (error) {
        console.error("[KanjiHanja] Credit check error:", error);
        return null;
    }

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = wordType === 'character'
        ? buildCharacterPrompt(kanji)
        : buildCompoundPrompt(kanji);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a Japanese-Korean linguistics expert specializing in kanji/hanja correspondences. Always respond with valid JSON."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        });

        // Log token usage
        if (response.usage) {
            await logTokenUsage(
                user.id,
                'kanji_hanja',
                'gpt-5-mini',
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(err => console.error("[KanjiHanja] Token logging error:", err));
        }

        // Parse response
        const content = response.choices[0].message.content;
        if (!content) {
            console.error("[KanjiHanja] Empty response from OpenAI");
            return null;
        }

        const result = JSON.parse(content);

        // Create mapping object
        const mapping: KanjiHanjaMapping = {
            kanji,
            hanja: result.hanja || kanji, // Fallback to input if missing
            koreanReading: result.korean_reading || '',
            hanjaMeaning: result.hanja_meaning || '',
            wordType,
            additionalReadings: result.additional_readings || [],
            usageExamples: result.usage_examples || [],
            confidence: result.confidence || 'medium'
        };

        // Store in database for caching
        try {
            await supabase.from('kanji_hanja_mappings').insert({
                kanji,
                hanja: mapping.hanja,
                korean_reading: mapping.koreanReading,
                hanja_meaning: mapping.hanjaMeaning,
                word_type: wordType,
                additional_readings: mapping.additionalReadings,
                usage_examples: mapping.usageExamples,
                source: 'openai',
                confidence: mapping.confidence
            });
        } catch (insertError) {
            console.error("[KanjiHanja] Failed to cache in DB:", insertError);
            // Continue anyway - user still gets the mapping
        }

        // Store in memory cache
        const cacheKey = `${kanji}:${wordType}`;
        memoryCache.set(cacheKey, mapping);

        console.log(`[KanjiHanja] Successfully generated mapping for ${kanji}`);
        return mapping;

    } catch (error: any) {
        console.error("[KanjiHanja] OpenAI API error:", error?.message, error?.status);
        return null;
    }
}

/**
 * Batch lookup for multiple kanji
 */
export async function batchLookupKanjiHanja(
    kanjiList: { text: string; type: 'character' | 'compound' }[]
): Promise<Map<string, KanjiHanjaMapping>> {
    const results = new Map<string, KanjiHanjaMapping>();

    // Process sequentially to avoid rate limits
    for (const { text, type } of kanjiList) {
        const mapping = await lookupKanjiHanja(text, type);
        if (mapping) {
            results.set(text, mapping);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
}

/**
 * Get cached mappings only (no API calls)
 */
export async function getCachedMappings(
    kanjiList: string[],
    wordType: 'character' | 'compound'
): Promise<Map<string, KanjiHanjaMapping>> {
    const results = new Map<string, KanjiHanjaMapping>();
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('kanji_hanja_mappings')
            .select('*')
            .in('kanji', kanjiList)
            .eq('word_type', wordType);

        if (!error && data) {
            data.forEach((row: any) => {
                const mapping = dbRowToMapping(row as KanjiHanjaDBRow);
                results.set(row.kanji, mapping);
            });
        }
    } catch (error) {
        console.error("[KanjiHanja] Batch lookup error:", error);
    }

    return results;
}
