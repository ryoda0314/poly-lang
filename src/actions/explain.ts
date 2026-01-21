"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExplanationResult {
    items: {
        token: string;
        meaning: string; // Meaning in native language
        grammar: string; // Grammatical role/explanation
    }[];
    nuance: string; // Overall nuance explanation
    error?: string;
}

export async function explainPhraseElements(text: string, targetLang: string, nativeLang: string): Promise<ExplanationResult | null> {
    if (!text.trim()) return null;

    // Check usage limit
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const limitCheck = await checkAndConsumeCredit(user.id, "explanation", supabase);
        if (!limitCheck.allowed) {
            console.warn("Insufficient explanation credits");
            return {
                items: [],
                nuance: "",
                error: limitCheck.error || "Insufficient explanation credits"
            };
        }
    }

    try {
        const prompt = `
        You are a linguistics expert teacher.
        Target Language: ${targetLang}
        Learner's Native Language: ${nativeLang}
        Phrase to Explain: "${text}"

        Task:
        1. Break down the phrase into meaningful elements (words or short phrases).
        2. For each element, provide:
           - "token": The original text segment
           - "meaning": Meaning in ${nativeLang}
           - "grammar": Brief grammatical role (e.g., "Verb (Past)", "Particle", "Noun") in ${nativeLang} or simple English.
        3. Provide a brief overall "nuance" explanation in ${nativeLang}.

        Return JSON object with keys: "items" (array) and "nuance" (string).
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Updated to a valid model name
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = response.choices[0].message.content;
        if (!content) return null;

        const result = JSON.parse(content);
        return {
            items: result.items || [],
            nuance: result.nuance || "",
        };

    } catch (e) {
        console.error("Explanation API Error:", e);
        return null;
    }
}
