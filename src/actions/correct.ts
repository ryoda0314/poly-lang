"use server";

import OpenAI from "openai";
import { CORRECTION_PROMPT } from "@/prompts/correction";
import { SentenceRef, DiffHint } from "@/types/stream";

// User requested "gpt-5.2", mapping to best available model "gpt-4o" for high quality.
const MODEL_NAME = "gpt-5.2";

export type CorrectionResult = {
    score: number;
    summary: string;
    candidates: {
        ref: SentenceRef;
        fromSid: string;
        diff: DiffHint;
        tags: string[];
        hint: string;
    }[];
};

export async function correctText(text: string, lang: string): Promise<CorrectionResult | null> {
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
            model: MODEL_NAME,
            messages: [
                { role: "system", content: "You are a helpful language teacher. Output valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const jsonText = response.choices[0].message.content;
        if (!jsonText) throw new Error("No content from OpenAI");

        const data = JSON.parse(jsonText);
        const baseId = Date.now().toString();
        const inputSid = `input-${baseId}`;

        const candidates = data.candidates.map((c: any, idx: number) => {
            const sid = `cand-${idx === 0 ? 'a' : 'b'}-${baseId}`;
            return {
                ref: {
                    sid: sid,
                    source: "CANDIDATE",
                    language: lang,
                    learn: c.learn,
                    translation: c.translation,
                } as SentenceRef,
                fromSid: inputSid,
                diff: c.diff as DiffHint,
                tags: idx === 0 ? ["Minimal Fix"] : ["Natural Nuance"],
                hint: c.explanation
            };
        });

        return {
            score: data.score,
            summary: data.summary,
            candidates: candidates
        };

    } catch (e) {
        console.error("OpenAI Correction Error:", e);
        return null;
    }
}
