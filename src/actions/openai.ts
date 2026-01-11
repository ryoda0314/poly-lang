"use server";

import OpenAI from "openai";
import { LANGUAGES } from "@/lib/data";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExampleResult {
    id: string;
    text: string;
    translation: string;
    translation_ko?: string;
    gender_variants?: {
        male: { targetText: string };
        female: { targetText: string };
    };
}

export async function getRelatedPhrases(
    lang: string,
    token: string,
    gender: "male" | "female",
    nativeLangCode: string = 'ja' // Default to JA if not provided to avoid break
): Promise<ExampleResult[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set.");
        return [];
    }

    const nativeLangName = LANGUAGES.find(l => l.code === nativeLangCode)?.name || "Japanese";

    try {
        const prompt = `
        You are a language tutor.
        Target Language: ${lang}
        Word/Phrase: "${token}"
        Speaker Gender: ${gender}
        Learner's Native Language: ${nativeLangName}
        
        Generate 5 natural, short sentence examples using this word/phrase in the target language.
        Include the ${nativeLangName} translation for each.
        
        IMPORTANT: The speaker is ${gender}. Ensure that all first-person sentences ("I...") and self-references use the correct grammatical gender forms (e.g. adjectives, past participles) for a ${gender} speaker.
        PRIORITIZE first-person sentences to demonstrate this gender agreement where applicable.
        
        Return ONLY a raw JSON array (no markdown) of objects.
        Format:
        [
          {
            "text": "...", 
            "translation": "... (${nativeLangName} meaning)", 
            "translation_ko": "... (Optional Korean meaning if native language is NOT Korean, otherwise same)"
          }
        ]
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
