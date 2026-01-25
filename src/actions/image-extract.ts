"use server";

import OpenAI from "openai";
import { tokenizePhrases } from "./tokenize";
import { logTokenUsage } from "@/lib/token-usage";
import { checkAndConsumeCredit } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedPhrase {
    target_text: string;
    translation: string;
    tokens?: string[];
}

export interface ImageExtractResult {
    success: boolean;
    phrases: ExtractedPhrase[];
    error?: string;
}

export async function extractPhrasesFromImage(
    imageBase64: string,
    targetLang: string,
    nativeLang: string
): Promise<ImageExtractResult> {
    if (!process.env.OPENAI_API_KEY) {
        return {
            success: false,
            phrases: [],
            error: "OpenAI API key is not configured"
        };
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are analyzing an image of a vocabulary list, flashcard, or study material.

## Task:
Extract all phrases/sentences/words from this image and provide translations.

## Target Language: ${targetLang}
## Translation Language: ${nativeLang}

## Instructions:
1. Extract all text that appears to be vocabulary items, phrases, or sentences in ${targetLang}
2. For each item, provide a translation in ${nativeLang}
3. If the image already contains translations, use those
4. If translations are not visible, generate appropriate translations
5. Clean up any OCR artifacts or formatting issues
6. Ignore page numbers, headers, footers, and other non-content text

## Output Format:
Return ONLY a raw JSON array (no markdown code blocks) of objects:
[
  { "target_text": "phrase in target language", "translation": "translation in native language" },
  ...
]

If no phrases can be extracted, return an empty array: []
`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageBase64.startsWith("data:")
                                    ? imageBase64
                                    : `data:image/jpeg;base64,${imageBase64}`,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            max_completion_tokens: 4096,
            temperature: 0.3,
        });

        // Log token usage
        if (response.usage) {
            logTokenUsage(
                null,
                "image_extract",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return {
                success: false,
                phrases: [],
                error: "No response from AI"
            };
        }

        // Clean up potential markdown formatting
        const jsonStr = content
            .replace(/^```json\s*/, "")
            .replace(/^```\s*/, "")
            .replace(/\s*```$/, "")
            .trim();

        const data = JSON.parse(jsonStr);

        if (!Array.isArray(data)) {
            return {
                success: false,
                phrases: [],
                error: "Invalid response format"
            };
        }

        // Extract phrases without tokens first
        const phrases: ExtractedPhrase[] = data.map((item: any) => ({
            target_text: item.target_text || "",
            translation: item.translation || ""
        })).filter((p: ExtractedPhrase) => p.target_text.trim() !== "");

        return {
            success: true,
            phrases
        };
    } catch (error) {
        console.error("Image extraction error:", error);
        return {
            success: false,
            phrases: [],
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

export async function extractAndTokenizePhrases(
    imageBase64: string,
    targetLang: string,
    nativeLang: string
): Promise<ImageExtractResult> {
    // Check and consume extraction credit
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            phrases: [],
            error: "User not authenticated"
        };
    }

    const creditCheck = await checkAndConsumeCredit(user.id, "extraction", supabase);
    if (!creditCheck.allowed) {
        return {
            success: false,
            phrases: [],
            error: creditCheck.error || "Insufficient extraction credits"
        };
    }

    // First extract phrases from image
    const extractResult = await extractPhrasesFromImage(imageBase64, targetLang, nativeLang);

    if (!extractResult.success || extractResult.phrases.length === 0) {
        return extractResult;
    }

    // Then tokenize all phrases
    const tokenizeInputs = extractResult.phrases.map(p => ({
        text: p.target_text,
        lang: targetLang
    }));

    const tokenized = await tokenizePhrases(tokenizeInputs);

    // Merge tokenization results
    const phrasesWithTokens = extractResult.phrases.map((phrase, index) => ({
        ...phrase,
        tokens: tokenized[index]?.tokens || []
    }));

    // Log image_extract event
    const { error: logError } = await supabase.from('learning_events').insert({
        user_id: user.id,
        language_code: targetLang,
        event_type: 'image_extract',
        xp_delta: 0,
        meta: { phrase_count: phrasesWithTokens.length }
    });
    if (logError) console.error('Failed to log learning event:', logError);

    return {
        success: true,
        phrases: phrasesWithTokens
    };
}
