import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI(); // uses OPENAI_API_KEY from env

export async function POST(req: Request) {
    try {
        const { text, nativeLanguage = "ja" } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Missing text' }, { status: 400 });
        }

        const explanationTarget = nativeLanguage === "ko" ? "Korean" : "Japanese";

        const completion = await openai.chat.completions.create({
            model: "gpt-5.2", // or gpt-3.5-turbo
            messages: [
                {
                    role: "system",
                    content: `You are a helpful language tutor. Correct the user's sentence to be natural and grammatically correct.
                    Return the response in JSON format with the following structure:
                    {
                        "original": "user input",
                        "corrected": "corrected sentence",
                        "explanation": "Short explanation of the correction in ${explanationTarget}",
                        "diffs": [
                            { "type": "match" | "substitution" | "insertion" | "deletion", "text": "word", "correction": "corrected word if substitution" }
                        ]
                    }
                    
                    For "diffs", break down the sentence into words or chunks and label them.
                    `
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from OpenAI");

        const result = JSON.parse(content);
        return NextResponse.json(result);

    } catch (e: any) {
        console.error('Correction API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
