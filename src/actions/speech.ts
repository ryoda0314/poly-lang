"use server";

import { GoogleGenAI } from "@google/genai";
import { LANGUAGES, LANGUAGE_LOCALES } from "@/lib/data";

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

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return { error: "GOOGLE_API_KEY is not set" };
    }

    try {
        const voiceName = "Kore";

        // Initialize the new GoogleGenAI client (v1.x / @google/genai style)
        // Explicitly passing apiKey from runtime env
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{
                role: "user", // Optional but good practice
                parts: [{ text: `Please read the following text naturally: "${text}"` }]
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
