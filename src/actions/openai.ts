"use server";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExampleResult {
    id: string;
    text: string;
    translation: string;
    translation_ko?: string;
}

export async function getRelatedPhrases(lang: string, token: string): Promise<ExampleResult[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set.");
        return [];
    }

    try {
        const prompt = `
        You are a language tutor.
        Target Language: ${lang}
        Word/Phrase: "${token}"
        
        Generate 5 natural, short sentence examples using this word/phrase in the target language.
        Include the Japanese and Korean translations for each.
        
        Return ONLY a raw JSON array (no markdown) of objects with "text", "translation" (Japanese), and "translation_ko" (Korean) keys.
        Example: [{"text": "...", "translation": "...", "translation_ko": "..."}]
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return [];

        // Simple cleanup if md blocks are present
        const jsonStr = content.replace(/^```json/, "").replace(/```$/, "");

        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data)) return [];

        return data.map((item: any, i: number) => ({
            id: `gen-${Date.now()}-${i}`,
            text: item.text,
            translation: item.translation,
            translation_ko: item.translation_ko,
        }));
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return [];
    }
}
