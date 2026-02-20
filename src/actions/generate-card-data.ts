"use server";

import OpenAI from "openai";
import { LANGUAGES } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface CardData {
    targetText: string;
    translation: string;
    reading: string;
}

interface GenerateCardDataResult {
    success: boolean;
    cards?: CardData[];
    error?: string;
}

// Get language-specific reading field name
const getReadingFieldName = (langCode: string): string => {
    const names: Record<string, string> = {
        zh: "pinyin",
        ja: "furigana/hiragana reading",
        ko: "romanization",
        en: "IPA pronunciation",
        fr: "IPA pronunciation",
        es: "IPA pronunciation",
        de: "IPA pronunciation",
        ru: "romanization (transliteration)",
        vi: "tone marks",
    };
    return names[langCode] || "pronunciation";
};

export async function generateCardData(
    cards: { targetText: string; translation: string; reading: string }[],
    targetLang: string,
    nativeLang: string,
    options: {
        generateReading: boolean;
        generateTranslation: boolean;
    }
): Promise<GenerateCardDataResult> {
    if (!process.env.OPENAI_API_KEY) {
        return { success: false, error: "API key not configured" };
    }

    // Check if any card needs generation
    const cardsNeedingGeneration = cards.filter(card => {
        const needsTranslation = options.generateTranslation && !card.translation.trim();
        const needsReading = options.generateReading && !card.reading.trim();
        return needsTranslation || needsReading;
    });

    if (cardsNeedingGeneration.length === 0) {
        // No generation needed, return original cards
        return { success: true, cards };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
    const nativeLangName = LANGUAGES.find(l => l.code === nativeLang)?.name || nativeLang;
    const readingFieldName = getReadingFieldName(targetLang);

    try {
        const prompt = `
You are a language learning assistant. Generate missing data for flashcards.

Target Language: ${targetLangName} (code: ${targetLang})
Native Language: ${nativeLangName} (code: ${nativeLang})
Reading Field Type: ${readingFieldName}

For each card below, fill in the missing fields:
${options.generateTranslation ? `- "translation": Translate the target text to ${nativeLangName}. Keep it natural and concise.` : ''}
${options.generateReading ? `- "reading": Add ${readingFieldName} for the target text.` : ''}

Input cards (JSON):
${JSON.stringify(cards.map(c => ({
    targetText: c.targetText,
    translation: c.translation || null,
    reading: c.reading || null
})), null, 2)}

Rules:
1. Only fill in fields that are null or empty
2. Keep existing non-empty values unchanged
3. For reading/pronunciation:
   - Chinese: Use pinyin with tone marks (e.g., nǐ hǎo)
   - Japanese: Use hiragana for kanji readings
   - Korean: Use romanization
   - European languages: Use IPA if applicable
4. Translations should be natural, not literal

Return ONLY a raw JSON array with all cards (including those that didn't need changes):
[
  { "targetText": "...", "translation": "...", "reading": "..." },
  ...
]
`;

        const response = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return { success: false, error: "No response from AI" };
        }

        // Parse response
        const jsonStr = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        const generatedCards = JSON.parse(jsonStr);

        if (!Array.isArray(generatedCards)) {
            return { success: false, error: "Invalid response format" };
        }

        return {
            success: true,
            cards: generatedCards.map((card: any) => ({
                targetText: card.targetText || "",
                translation: card.translation || "",
                reading: card.reading || "",
            }))
        };
    } catch (error) {
        console.error("Card data generation error:", error);
        return { success: false, error: "Failed to generate card data" };
    }
}
