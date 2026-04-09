"use server";

import { GoogleGenAI } from "@google/genai";
import { LANGUAGE_LOCALES } from "@/lib/data";

const TTS_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 1 day
const TTS_CACHE_MAX_ENTRIES = 10000;

type CacheValue = {
    data: string;
    mimeType: string;
    expiresAt: number;
};

const ttsCache = new Map<string, CacheValue>();

function makeCacheKey(text: string, locale: string, voiceName: string) {
    return `${locale}::${voiceName}::${text}`;
}

function getFromCache(key: string): { data: string; mimeType: string } | null {
    const hit = ttsCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
        ttsCache.delete(key);
        return null;
    }
    return { data: hit.data, mimeType: hit.mimeType };
}

function putIntoCache(key: string, value: { data: string; mimeType: string }) {
    if (ttsCache.size >= TTS_CACHE_MAX_ENTRIES) {
        const oldestKey = ttsCache.keys().next().value;
        if (oldestKey) ttsCache.delete(oldestKey);
    }
    ttsCache.set(key, { ...value, expiresAt: Date.now() + TTS_CACHE_TTL_MS });
}

type GeminiInlineData = {
    mimeType?: string;
    data: string;
};

type GeminiPart = {
    inlineData?: GeminiInlineData;
};

type GeminiCandidate = {
    content?: {
        parts?: GeminiPart[];
    };
};

type GeminiGenerateContentResponseLike = {
    candidates?: GeminiCandidate[];
    response?: {
        candidates?: GeminiCandidate[];
    };
};
export async function generateSpeech(text: string, _langCode: string): Promise<{ data: string, mimeType: string } | { error: string } | null> {
    const locale = LANGUAGE_LOCALES[_langCode] ?? "en-US";
    const voiceName = "Kore";
    const cacheKey = makeCacheKey(text, locale, voiceName);

    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return { error: "GOOGLE_API_KEY is not set" };
    }

    try {
        // Initialize the new GoogleGenAI client (v1.x / @google/genai style)
        // Explicitly passing apiKey from runtime env
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{
                role: "user", // Optional but good practice
                parts: [{ text: `Read the following text clearly for a language learner: "${text}"` }]
            }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    languageCode: locale,
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceName
                        }
                    }
                }
            }
        });

        // The SDK response object usually wraps the raw response.
        // We look for candidates -> content -> parts -> inlineData
        // Check both 'response' and 'response.candidates' depending on SDK version normalization
        const responseLike = response as unknown as GeminiGenerateContentResponseLike;
        const candidates = responseLike.candidates ?? responseLike.response?.candidates;

        if (!candidates || candidates.length === 0) {
            console.error("Gemini SDK: No candidates returned", JSON.stringify(response, null, 2));
            return { error: "No audio candidates returned" };
        }

        const part = candidates[0]?.content?.parts?.[0];

        if (part?.inlineData?.mimeType?.startsWith("audio")) {
            const result = {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType
            };
            putIntoCache(cacheKey, result);
            return result;
        }

        // Fallback or inspection
        console.error("Gemini SDK Unexpected Structure:", JSON.stringify(response, null, 2));
        return { error: "Unexpected response structure from Gemini SDK" };

    } catch (error: unknown) {
        console.error("Speech Generation SDK Error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Gemini SDK Error: ${message}` };
    }
}
