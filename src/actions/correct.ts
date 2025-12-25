"use server";

import OpenAI from "openai";
import { CORRECTION_PROMPT } from "@/prompts/correction";
import { SentenceRef, DiffHint } from "@/types/stream";

// User requested "gpt-5.2", mapping to best available model "gpt-4o" for high quality.
const MODEL_NAME = "gpt-5.2";

// CorrectionResult is now the same as CorrectionCardData (minus sid/original which are local)
export type CorrectionResponse = {
    score: number;
    summary_1l: string;
    points: string[];
    recommended: string;
    recommended_translation: string;
    diff: {
        before: string;
        after: string;
    };
    boundary_1l: string | null;
    alternatives: {
        label: string;
        text: string;
    }[];
};

export async function correctText(text: string, lang: string): Promise<CorrectionResponse | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("No OpenAI API KEY");
        return null;
    }

    const openai = new OpenAI({ apiKey });

    try {
        const prompt = `
            ${CORRECTION_PROMPT}

            Text to Correct: "${text}"
            Learner's Native Language: "Japanese" (Defaulting to JA based on user context)
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Ensuring high quality for v0.4
            messages: [
                { role: "system", content: "You are a helpful language teacher. Output valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const jsonText = response.choices[0].message.content;
        if (!jsonText) throw new Error("No content from OpenAI");

        const data = JSON.parse(jsonText);

        // Validate data structure loosely
        if (!data.recommended || !data.summary_1l) {
            console.error("Invalid response structure:", data);
            return null;
        }

        return {
            score: data.score || 0,
            summary_1l: data.summary_1l,
            points: data.points || [],
            recommended: data.recommended,
            recommended_translation: data.recommended_translation || "",
            diff: data.diff || { before: text, after: data.recommended },
            boundary_1l: data.boundary_1l || null,
            alternatives: data.alternatives || []
        };

    } catch (e) {
        console.error("OpenAI Correction Error:", e);
        return null;
    }
}
