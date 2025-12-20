"use server";

import { GoogleGenAI } from "@google/genai";

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

// Voices available in Gemini 2.5 Pro Preview TTS
const GEMINI_VOICES = [
    "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede",
    "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina"
];

// Helper to select voice using OpenAI
async function selectVoiceForText(text: string, langCode: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) return "Kore"; // Default fallback

    try {
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `
        Select the most appropriate voice name from this list for reading the following text in language '${langCode}':
        [${GEMINI_VOICES.join(", ")}]

        Text: "${text.substring(0, 100)}..."

        Consider gender, tone, and emotion implied by the text.
        Return ONLY the voice name (e.g., "Kore").
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 10,
        });

        const voice = response.choices[0]?.message?.content?.trim();
        if (voice && GEMINI_VOICES.includes(voice)) {
            return voice;
        }
        return "Kore"; // Fallback
    } catch (e) {
        console.error("OpenAI Voice Selection Error:", e);
        return "Kore";
    }
}

export async function generateSpeech(text: string, langCode: string): Promise<{ data: string, mimeType: string } | { error: string } | null> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return { error: "GOOGLE_API_KEY is not set in .env" };
    }

    try {
        const voiceName = await selectVoiceForText(text, langCode);

        // Initialize the new GoogleGenAI client (v1.x / @google/genai style)
        // Explicitly passing apiKey matching user .env
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro-preview-tts",
            contents: [{
                role: "user", // Optional but good practice
                parts: [{ text: `Please read the following text naturally: "${text}"` }]
            }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
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
            return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType
            };
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
