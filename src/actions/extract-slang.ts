"use server";

import OpenAI from "openai";
import { SLANG_EXTRACTION_PROMPT } from "@/prompts/slang-extraction";
import { SlangTerm } from "@/store/slang-store";

export type ExtractedSlang = Omit<SlangTerm, "id" | "created_at">;

export async function extractSlangFromText(
    text: string
): Promise<ExtractedSlang[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("No OpenAI API KEY");
        return null;
    }

    const openai = new OpenAI({ apiKey });

    try {
        const response = await openai.responses.create({
            model: "gpt-5.2",
            input: [
                { role: "system", content: SLANG_EXTRACTION_PROMPT },
                { role: "user", content: text },
            ],
            // JSON mode（=必ずJSONで返す）
            text: { format: { type: "json_object" } },
            max_output_tokens: 4096,
        });

        const outputText = response.output_text;
        if (!outputText) return null;

        const parsed = JSON.parse(outputText);
        return parsed.terms ?? [];
    } catch (error) {
        console.error("Extraction error:", error);
        return null;
    }
}
