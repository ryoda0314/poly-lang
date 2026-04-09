"use server";

import { GoogleGenAI } from "@google/genai";
import { LANGUAGE_LOCALES } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

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

// Storage cache configuration
const BUCKET = "tts-audio";

function sha256Hex(text: string): string {
    return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function getStoragePath(text: string, langCode: string, voiceName: string): string {
    const hash = sha256Hex(text);
    return `${voiceName}/${langCode}/${hash}.wav`;
}

// Convert PCM16 to WAV format
function pcm16ToWav(pcmBytes: Uint8Array, sampleRate: number, channels: number = 1): Uint8Array {
    const bitsPerSample = 16;
    const blockAlign = (channels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmBytes.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
        for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);
    new Uint8Array(buffer, 44).set(pcmBytes);

    return new Uint8Array(buffer);
}

function parseSampleRate(mimeType: string): number {
    const match = mimeType.match(/(?:^|;)\s*rate=(\d+)/i);
    const rate = match ? Number(match[1]) : NaN;
    return Number.isFinite(rate) && rate > 0 ? rate : 24000;
}

async function uploadToStorage(
    text: string,
    langCode: string,
    voiceName: string,
    base64Data: string,
    mimeType: string
): Promise<void> {
    try {
        const supabase = await createAdminClient();
        const path = getStoragePath(text, langCode, voiceName);

        // Convert base64 to bytes
        const binary = Buffer.from(base64Data, "base64");
        const pcmBytes = new Uint8Array(binary);

        // Convert PCM to WAV if needed
        const isPcm = mimeType.toLowerCase().includes("pcm") || mimeType.toLowerCase().startsWith("audio/l16");
        const audioBytes = isPcm ? pcm16ToWav(pcmBytes, parseSampleRate(mimeType)) : pcmBytes;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, audioBytes as Uint8Array, {
                contentType: "audio/wav",
                upsert: true,
            });

        if (error) {
            console.error("Failed to upload TTS to storage:", error.message);
        }
    } catch (err) {
        console.error("Error uploading TTS to storage:", err);
    }
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

export async function generateSpeech(text: string, _langCode: string, _voiceName?: string, _learnerMode?: boolean): Promise<{ data: string, mimeType: string } | { error: string } | null> {
    const locale = LANGUAGE_LOCALES[_langCode] ?? "en-US";
    const voiceName = _voiceName || "Kore";
    const learnerMode = _learnerMode ?? false;
    const cacheKey = makeCacheKey(text, locale, voiceName + (learnerMode ? ":learner" : ""));

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
        console.error("[TTS] GOOGLE_CLOUD_PROJECT is not set");
        return { error: "GOOGLE_CLOUD_PROJECT is not set" };
    }

    try {
        console.log(`[TTS] Generating speech: text length=${text.length}, locale=${locale}, voice=${voiceName}, learnerMode=${learnerMode}`);
        // Initialize via Vertex AI
        // Vercel: uses GOOGLE_SERVICE_ACCOUNT_KEY env var (can be JSON or Base64-encoded JSON)
        // Local: uses Application Default Credentials (gcloud auth)
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        let googleAuthOptions;
        if (serviceAccountKey) {
            try {
                // Try Base64 decode first (safer for multiline JSON)
                const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
                googleAuthOptions = { credentials: JSON.parse(decoded) };
                console.log('[TTS] Using Base64-decoded service account key');
            } catch {
                // Fallback to direct JSON parse with escaped newlines
                try {
                    googleAuthOptions = { credentials: JSON.parse(serviceAccountKey.replace(/\\n/g, '\n')) };
                    console.log('[TTS] Using JSON-parsed service account key');
                } catch (e) {
                    console.error('[TTS] Failed to parse service account key:', e);
                    return { error: "Invalid service account key format" };
                }
            }
        }
        const ai = new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions });
        console.log(`[TTS] GoogleGenAI initialized with project=${project}, location=${location}`);

        const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{
                role: "user", // Optional but good practice
                parts: [{ text: learnerMode ? `Read the following text slowly and clearly for a language learner: "${text}"` : text }]
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
            console.error("[TTS] Gemini SDK: No candidates returned", JSON.stringify(response, null, 2));
            return { error: "No audio candidates returned" };
        }

        const part = candidates[0]?.content?.parts?.[0];
        console.log(`[TTS] Response part structure:`, {
            hasPart: !!part,
            hasInlineData: !!part?.inlineData,
            mimeType: part?.inlineData?.mimeType,
            dataLength: part?.inlineData?.data?.length
        });

        if (part?.inlineData?.mimeType?.startsWith("audio")) {
            const result = {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType
            };
            putIntoCache(cacheKey, result);

            // Upload to Supabase Storage for global caching (fire-and-forget)
            const storageVoice = learnerMode ? `${voiceName}-learner` : voiceName;
            uploadToStorage(text, _langCode, storageVoice, result.data, result.mimeType).catch(console.error);

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
        return { error: "Speech generation failed" };

    } catch (error: unknown) {
        console.error("[TTS] Speech Generation SDK Error:", error);
        if (error instanceof Error) {
            console.error("[TTS] Error details:", error.message, error.stack);
        }
        return { error: "Speech generation failed" };
    }
}

const CLEANUP_MAX_AGE_DAYS = 30;

/**
 * Clean up old TTS audio files from Supabase Storage.
 * Deletes files older than CLEANUP_MAX_AGE_DAYS.
 * Should be called from an admin endpoint or cron job.
 */
export async function cleanupOldTTSFiles(): Promise<{ deleted: number; errors: number }> {
    const supabase = await createAdminClient();
    const cutoffDate = new Date(Date.now() - CLEANUP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    let deleted = 0;
    let errors = 0;

    // List all voice folders (Kore, Kore-learner, etc.)
    const { data: voiceFolders, error: voiceError } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 100 });

    if (voiceError) {
        console.error("Failed to list voice folders:", voiceError.message);
        return { deleted: 0, errors: 1 };
    }

    for (const voiceFolder of voiceFolders || []) {
        if (!voiceFolder.name) continue;

        // List language folders within each voice
        const { data: langFolders, error: langError } = await supabase.storage
            .from(BUCKET)
            .list(voiceFolder.name, { limit: 100 });

        if (langError) {
            errors++;
            continue;
        }

        for (const langFolder of langFolders || []) {
            if (!langFolder.name) continue;

            const folderPath = `${voiceFolder.name}/${langFolder.name}`;

            // List files in batches
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data: files, error: listError } = await supabase.storage
                    .from(BUCKET)
                    .list(folderPath, { limit: batchSize, offset });

                if (listError) {
                    errors++;
                    break;
                }

                if (!files || files.length === 0) {
                    hasMore = false;
                    break;
                }

                // Find files older than cutoff
                const oldFiles = files.filter(file => {
                    if (!file.created_at) return false;
                    return new Date(file.created_at) < cutoffDate;
                });

                if (oldFiles.length > 0) {
                    const filePaths = oldFiles.map(f => `${folderPath}/${f.name}`);
                    const { error: deleteError } = await supabase.storage
                        .from(BUCKET)
                        .remove(filePaths);

                    if (deleteError) {
                        errors++;
                    } else {
                        deleted += oldFiles.length;
                    }
                }

                offset += batchSize;
                hasMore = files.length === batchSize;
            }
        }
    }

    console.log(`TTS cleanup complete: ${deleted} files deleted, ${errors} errors`);
    return { deleted, errors };
}
