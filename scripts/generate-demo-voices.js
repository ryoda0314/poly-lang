/**
 * Generate demo voice samples for shop trial feature
 * 30 voices × 2 modes (normal/slow) = 60 files
 *
 * Usage: node scripts/generate-demo-voices.js
 *
 * Uses Vertex AI authentication (same as production)
 * Requires: GOOGLE_CLOUD_PROJECT, GOOGLE_SERVICE_ACCOUNT_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local using dotenv
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { GoogleGenAI } = require('@google/genai');

// Demo text for samples
const DEMO_TEXT = "Learning a new language opens doors to amazing opportunities.";

// All 30 TTS voices
const TTS_VOICES = [
    // Female (14)
    "Achernar", "Aoede", "Autonoe", "Callirrhoe", "Despina", "Erinome", "Gacrux",
    "Kore", "Laomedeia", "Leda", "Pulcherrima", "Sulafat", "Vindemiatrix", "Zephyr",
    // Male (16)
    "Achird", "Algenib", "Algieba", "Alnilam", "Charon", "Enceladus", "Fenrir",
    "Iapetus", "Orus", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar",
    "Umbriel", "Zubenelgenubi"
];

const OUTPUT_DIR = path.resolve(__dirname, '../public/samples/voices');
const TTS_MODEL = "gemini-2.5-pro-preview-tts";

// Ensure output directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Initialize Vertex AI client
function initAI() {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    let serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!project) {
        throw new Error("GOOGLE_CLOUD_PROJECT not set in .env.local");
    }

    let googleAuthOptions;
    if (serviceAccountKey) {
        // Handle escaped newlines in the JSON string
        serviceAccountKey = serviceAccountKey.replace(/\\n/g, '\n');
        try {
            googleAuthOptions = { credentials: JSON.parse(serviceAccountKey) };
        } catch (e) {
            console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:", e.message);
            console.log("Falling back to Application Default Credentials...");
            googleAuthOptions = undefined;
        }
    }

    return new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions });
}

// Generate speech using Vertex AI TTS
async function generateSpeech(ai, text, voiceName, learnerMode) {
    const prompt = learnerMode
        ? `Read the following text slowly and clearly for a language learner: "${text}"`
        : text;

    const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                languageCode: "en-US",
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    });

    const candidates = response.candidates ?? response.response?.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned");
    }

    const part = candidates[0]?.content?.parts?.[0];
    if (part?.inlineData?.mimeType?.startsWith("audio")) {
        return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
        };
    }

    throw new Error("No audio data in response");
}

// Save audio file
function saveAudio(base64Data, filePath) {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
}

// Main generation loop
async function main() {
    console.log(`Generating demo voice samples (Vertex AI)...`);
    console.log(`Text: "${DEMO_TEXT}"`);
    console.log(`Voices: ${TTS_VOICES.length}`);
    console.log(`Modes: normal, slow`);
    console.log(`Total files: ${TTS_VOICES.length * 2}`);
    console.log(`Output: ${OUTPUT_DIR}\n`);

    const ai = initAI();
    console.log(`✅ Vertex AI initialized\n`);

    let success = 0;
    let failed = 0;

    for (const voice of TTS_VOICES) {
        const voiceDir = path.join(OUTPUT_DIR, voice);
        ensureDir(voiceDir);

        for (const mode of ['normal', 'slow']) {
            const learnerMode = mode === 'slow';
            const filePath = path.join(voiceDir, `${mode}.mp3`);

            // Skip if already exists
            if (fs.existsSync(filePath)) {
                console.log(`⏭️  Skip ${voice}/${mode}.mp3 (exists)`);
                success++;
                continue;
            }

            try {
                console.log(`🔊 Generating ${voice}/${mode}.mp3...`);
                const result = await generateSpeech(ai, DEMO_TEXT, voice, learnerMode);
                saveAudio(result.data, filePath);
                console.log(`✅ Saved ${voice}/${mode}.mp3`);
                success++;

                // Rate limiting: wait 500ms between requests
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                console.error(`❌ Failed ${voice}/${mode}.mp3:`, e.message);
                failed++;
            }
        }
    }

    console.log(`\n📊 Results: ${success} success, ${failed} failed`);
}

main().catch(console.error);
