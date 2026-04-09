/**
 * Batch TTS Generation Script
 *
 * Generates audio for all unique phrases across all languages using Gemini Pro TTS,
 * applies fade-out + silence padding, and uploads WAV files to Supabase Storage.
 *
 * Usage:
 *   node scripts/generate-tts-batch.mjs [--lang en] [--dry-run] [--concurrency 1] [--delay 4000] [--retries 3]
 *
 * Requires:
 *   - .env.local with GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION
 *   - gcloud auth application-default login (or GOOGLE_SERVICE_ACCOUNT_KEY)
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// ENV
// ---------------------------------------------------------------------------
function loadEnv() {
    const envPath = resolve(__dirname, "../.env.local");
    if (!existsSync(envPath)) {
        console.error(".env.local not found");
        process.exit(1);
    }
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        if (!line || line.startsWith("#")) continue;
        const idx = line.indexOf("=");
        if (idx < 0) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}
loadEnv();

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const TTS_MODEL = "gemini-2.5-pro-preview-tts";
const VOICE_NAME = "Kore";
const BUCKET_NAME = "tts-audio";
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const FADE_MS = 200;
const PADDING_MS = 300;

const LANGUAGE_LOCALES = {
    en: "en-US", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
    fr: "fr-FR", es: "es-ES", de: "de-DE", ru: "ru-RU", vi: "vi-VN",
};

// ---------------------------------------------------------------------------
// CLI ARGS
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}
const filterLang = getArg("lang"); // e.g. "ja"
const dryRun = args.includes("--dry-run");
const concurrency = Number(getArg("concurrency")) || 1;
const delayMs = Number(getArg("delay")) || 4000; // ms between requests
const maxRetries = Number(getArg("retries")) || 3;

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------
const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
if (!project) { console.error("GOOGLE_CLOUD_PROJECT not set"); process.exit(1); }

const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const googleAuthOptions = serviceAccountKey
    ? { credentials: JSON.parse(serviceAccountKey) }
    : undefined;
const ai = new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("SUPABASE env vars not set");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function hashText(text) {
    return createHash("sha256").update(text, "utf8").digest("hex");
}

function storagePath(lang, text) {
    return `${VOICE_NAME}/${lang}/${hashText(text)}.wav`;
}

/** Decode base64 (handles URL-safe variants) to Uint8Array */
function base64ToBytes(b64) {
    const cleaned = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const padLen = cleaned.length % 4;
    const padded = padLen === 0 ? cleaned : cleaned + "=".repeat(4 - padLen);
    return Uint8Array.from(Buffer.from(padded, "base64"));
}

/** Apply a linear fade-out to the last `ms` milliseconds of PCM16 LE data */
function applyFadeOut(pcmBytes, sampleRate, ms) {
    const fadeSamples = Math.floor((sampleRate * ms) / 1000);
    const totalSamples = Math.floor(pcmBytes.length / 2);
    const startSample = Math.max(0, totalSamples - fadeSamples);
    const view = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);

    for (let i = startSample; i < totalSamples; i++) {
        const progress = (i - startSample) / fadeSamples; // 0→1
        const gain = 1 - progress; // 1→0
        const offset = i * 2;
        const sample = view.getInt16(offset, true);
        view.setInt16(offset, Math.round(sample * gain), true);
    }
    return pcmBytes;
}

/** Append silence (zero bytes) to PCM data */
function addSilencePadding(pcmBytes, sampleRate, ms) {
    const silenceBytes = Math.floor((sampleRate * ms) / 1000) * 2; // 16-bit = 2 bytes/sample
    const result = new Uint8Array(pcmBytes.length + silenceBytes);
    result.set(pcmBytes, 0);
    // rest is already zeroed (silence)
    return result;
}

/** Convert PCM16 LE mono to WAV */
function pcm16ToWav(pcmBytes, sampleRate, channels) {
    const bitsPerSample = 16;
    const blockAlign = (channels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmBytes.length;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const write = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };

    write(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    write(36, "data");
    view.setUint32(40, dataSize, true);
    new Uint8Array(buffer, 44).set(pcmBytes);

    return new Uint8Array(buffer);
}

/** Parse sample rate from mimeType like "audio/l16;rate=24000" */
function parseSampleRate(mimeType) {
    const match = mimeType.match(/rate=(\d+)/i);
    return match ? Number(match[1]) : SAMPLE_RATE;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Call generateTts with retry + exponential backoff for transient errors */
async function generateTtsWithRetry(text, langCode) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await generateTts(text, langCode);
        } catch (err) {
            const msg = err.message || "";
            const isRetryable =
                msg.includes("429") ||
                msg.includes("RESOURCE_EXHAUSTED") ||
                msg.includes("fetch failed") ||
                msg.includes("ECONNRESET") ||
                msg.includes("ETIMEDOUT") ||
                msg.includes("socket hang up") ||
                msg.includes("503");
            if (isRetryable && attempt < maxRetries) {
                const backoff = delayMs * Math.pow(2, attempt); // 4s, 8s, 16s...
                console.log(`  RETRY (${msg.slice(0, 40)}...) — waiting ${(backoff / 1000).toFixed(0)}s [${attempt + 1}/${maxRetries}]`);
                await sleep(backoff);
                continue;
            }
            throw err;
        }
    }
}

// ---------------------------------------------------------------------------
// TTS GENERATION
// ---------------------------------------------------------------------------
async function generateTts(text, langCode) {
    const locale = LANGUAGE_LOCALES[langCode] || "en-US";

    const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                languageCode: locale,
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: VOICE_NAME },
                },
            },
        },
    });

    const candidates = response.candidates ?? response.response?.candidates;
    if (!candidates?.length) throw new Error("No candidates returned");

    const part = candidates[0]?.content?.parts?.[0];
    if (!part?.inlineData?.mimeType?.startsWith("audio")) {
        throw new Error("Unexpected response structure");
    }

    return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
}

// ---------------------------------------------------------------------------
// PROCESS ONE PHRASE
// ---------------------------------------------------------------------------
async function processPhrase(lang, text, index, total) {
    const path = storagePath(lang, text);
    const label = `[${index + 1}/${total}] ${lang}: ${text.slice(0, 30)}${text.length > 30 ? "..." : ""}`;

    // Check if already exists in storage
    const { data: existing } = await supabase.storage.from(BUCKET_NAME).download(path);
    if (existing) {
        console.log(`  SKIP ${label}`);
        return { status: "skipped" };
    }

    if (dryRun) {
        console.log(`  DRY  ${label} → ${path}`);
        return { status: "dry" };
    }

    try {
        // Generate TTS (with retry for rate limits)
        const result = await generateTtsWithRetry(text, lang);
        const sampleRate = parseSampleRate(result.mimeType);

        // Decode → fade-out → silence → WAV
        let pcm = base64ToBytes(result.data);
        pcm = applyFadeOut(pcm, sampleRate, FADE_MS);
        pcm = addSilencePadding(pcm, sampleRate, PADDING_MS);
        const wav = pcm16ToWav(pcm, sampleRate, CHANNELS);

        // Upload to Supabase Storage
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, wav, {
                contentType: "audio/wav",
                upsert: false,
            });

        if (error) throw new Error(`Upload failed: ${error.message}`);

        console.log(`  OK   ${label} (${(wav.length / 1024).toFixed(1)} KB)`);

        // Rate limit: wait between requests
        await sleep(delayMs);

        return { status: "ok", size: wav.length };
    } catch (err) {
        console.error(`  FAIL ${label}: ${err.message}`);
        return { status: "error", error: err.message };
    }
}

// ---------------------------------------------------------------------------
// CONCURRENCY POOL
// ---------------------------------------------------------------------------
async function runWithConcurrency(tasks, limit) {
    const results = [];
    let idx = 0;

    async function worker() {
        while (idx < tasks.length) {
            const i = idx++;
            results[i] = await tasks[i]();
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
    return results;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
    console.log("=== Batch TTS Generation ===");
    console.log(`Model: ${TTS_MODEL}`);
    console.log(`Voice: ${VOICE_NAME}`);
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Concurrency: ${concurrency}`);
    console.log(`Delay: ${delayMs}ms between requests`);
    console.log(`Max retries on 429: ${maxRetries}`);
    console.log(`Filter lang: ${filterLang || "all"}`);
    console.log(`Dry run: ${dryRun}`);
    console.log();

    // Ensure bucket exists
    if (!dryRun) {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === BUCKET_NAME);
        if (!exists) {
            console.log(`Creating bucket: ${BUCKET_NAME}`);
            const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
                allowedMimeTypes: ["audio/wav"],
                fileSizeLimit: "5MB",
            });
            if (error) {
                console.error("Failed to create bucket:", error.message);
                process.exit(1);
            }
        }
    }

    // Load phrases
    const phrasesPath = resolve(__dirname, "unique-phrases.json");
    const phrasesData = JSON.parse(readFileSync(phrasesPath, "utf8"));
    const langs = Object.keys(LANGUAGE_LOCALES).filter((l) => !filterLang || l === filterLang);

    // Build task list
    const tasks = [];
    for (const lang of langs) {
        const texts = phrasesData[lang] || [];
        for (const text of texts) {
            tasks.push({ lang, text });
        }
    }

    console.log(`Total phrases to process: ${tasks.length}`);
    console.log();

    // Execute
    const startTime = Date.now();
    const taskFns = tasks.map((t, i) => () => processPhrase(t.lang, t.text, i, tasks.length));
    const results = await runWithConcurrency(taskFns, concurrency);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const counts = { ok: 0, skipped: 0, error: 0, dry: 0 };
    let totalSize = 0;
    for (const r of results) {
        counts[r.status] = (counts[r.status] || 0) + 1;
        if (r.size) totalSize += r.size;
    }

    console.log();
    console.log("=== Summary ===");
    console.log(`Time: ${elapsed}s`);
    console.log(`Generated: ${counts.ok}`);
    console.log(`Skipped (existing): ${counts.skipped}`);
    console.log(`Errors: ${counts.error}`);
    if (dryRun) console.log(`Dry run: ${counts.dry}`);
    console.log(`Total uploaded: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Save error log if any
    const errors = results.filter((r) => r.status === "error");
    if (errors.length > 0) {
        const logPath = resolve(__dirname, "tts-errors.json");
        const errorEntries = tasks
            .map((t, i) => (results[i].status === "error" ? { ...t, error: results[i].error } : null))
            .filter(Boolean);
        writeFileSync(logPath, JSON.stringify(errorEntries, null, 2));
        console.log(`Error log saved to: ${logPath}`);
    }
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});