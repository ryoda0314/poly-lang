"use server";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface CorrectionResult {
    original: string;
    corrected: string;
    explanation: string;
}

export async function correctText(text: string, langName: string): Promise<CorrectionResult | null> {
    if (!text.trim()) return null;

    try {
        const prompt = `
        You are a generic language correction tool.
        Target Language: ${langName}
        User Input: "${text}"

        Task:
        1. Correct any grammatical, spelling, or natural phrasing errors in the input based on the target language.
        2. If the input is perfect, return it as is.
        3. Provide a brief, helpful explanation of the changes (or praise if correct).
        
        Return JSON object with keys: "corrected" (string) and "explanation" (string).
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = response.choices[0].message.content;
        if (!content) return null;

        const result = JSON.parse(content);
        return {
            original: text,
            corrected: result.corrected,
            explanation: result.explanation,
        };

    } catch (e) {
        console.error("Correction API Error:", e);
        return null;
    }
}
