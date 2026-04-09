"use server";

import OpenAI from "openai";
import { SLANG_EXTRACTION_PROMPT } from "@/prompts/slang-extraction";
import { SlangTerm } from "@/store/slang-store";

export type ExtractedSlang = Omit<SlangTerm, "id" | "created_at" | "vote_count_up" | "vote_count_down" | "user_vote">;

export async function extractSlangFromText(
    text: string,
    languageCode?: string
): Promise<ExtractedSlang[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("No OpenAI API KEY");
        return null;
    }

    const openai = new OpenAI({ apiKey });

    // 言語指定がある場合はプロンプトに追加
    const languageInstruction = languageCode
        ? `\n\n**IMPORTANT**: All extracted terms MUST have "language_code": "${languageCode}". Do not infer the language - use "${languageCode}" for all terms.`
        : "";

    try {
        const response = await openai.responses.create({
            model: "gpt-5.2",
            input: [
                { role: "developer", content: SLANG_EXTRACTION_PROMPT + languageInstruction },
                { role: "user", content: text },
            ],
            text: { format: { type: "json_object" } },
        });

        const outputText = response.output_text;
        if (!outputText) return null;

        const parsed = JSON.parse(outputText);
        let terms = parsed.terms ?? [];

        // 言語指定がある場合、確実に上書き
        if (languageCode) {
            terms = terms.map((t: ExtractedSlang) => ({ ...t, language_code: languageCode }));
        }

        return terms;
    } catch (error) {
        console.error("Extraction error:", error);
        return null;
    }
}
