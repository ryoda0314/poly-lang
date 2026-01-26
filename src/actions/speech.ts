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
import { checkAndConsumeCredit } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { logTokenUsage } from "@/lib/token-usage";

const TTS_MODEL = "gemini-2.5-pro-preview-tts";
// Audio token estimation: 1 second ≈ 25 tokens, base64 PCM 24kHz mono ≈ 64KB/s
const AUDIO_TOKENS_PER_SECOND = 25;
const BASE64_BYTES_PER_SECOND = 64000;

export async function generateSpeech(text: string, _langCode: string): Promise<{ data: string, mimeType: string } | { error: string } | null> {
    const locale = LANGUAGE_LOCALES[_langCode] ?? "en-US";
    const voiceName = "Kore";
    const cacheKey = makeCacheKey(text, locale, voiceName);

    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    // Check usage limit
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const limitCheck = await checkAndConsumeCredit(user.id, "audio", supabase);
        if (!limitCheck.allowed) {
            return { error: limitCheck.error || "Insufficient audio credits" };
        }
    }

    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    if (!project) {
        return { error: "GOOGLE_CLOUD_PROJECT is not set" };
    }

    try {
        // Initialize via Vertex AI
        // Vercel: uses GOOGLE_SERVICE_ACCOUNT_KEY env var
        // Local: uses Application Default Credentials (gcloud auth)
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const googleAuthOptions = serviceAccountKey
            ? { credentials: JSON.parse(serviceAccountKey) }
            : undefined;
        const ai = new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions });

        const response = await ai.models.generateContent({
            model: TTS_MODEL,
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

            // Log token usage for cost tracking
            const usageMeta = (response as any).usageMetadata;
            const inputTokens = usageMeta?.promptTokenCount
                ?? Math.ceil(text.length / 3);
            const outputTokens = usageMeta?.candidatesTokenCount
                ?? Math.round((part.inlineData.data.length / BASE64_BYTES_PER_SECOND) * AUDIO_TOKENS_PER_SECOND);
            logTokenUsage(
                user?.id ?? null,
                "tts",
                TTS_MODEL,
                inputTokens,
                outputTokens
            ).catch(console.error);

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
