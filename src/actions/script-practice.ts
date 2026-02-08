"use server";

import OpenAI from "openai";
import { checkAndConsumeCredit } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface ScriptExercise {
    type: "recognition" | "reading" | "fill_blank";
    question: string;
    questionTranslation: string;
    character: string;
    correctAnswer: string;
    options: string[];
    explanation: string;
    explanationTranslation: string;
}

interface GenerateResult {
    exercises?: ScriptExercise[];
    error?: string;
}

const NATIVE_LANG_NAMES: Record<string, string> = {
    ja: "Japanese", ko: "Korean", en: "English", zh: "Chinese",
    fr: "French", de: "German", es: "Spanish", ru: "Russian", vi: "Vietnamese",
};

export async function generateScriptExercises(
    scriptSetId: string,
    scriptName: string,
    targetLang: string,
    nativeLang: string,
    weakCharacters: string[],
    masteredCharacters: string[],
    exerciseCount: number = 8,
): Promise<GenerateResult> {
    if (!process.env.OPENAI_API_KEY) {
        return { error: "OpenAI API key not configured" };
    }

    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    // 2. Credit check
    const limitCheck = await checkAndConsumeCredit(user.id, "script", supabase);
    if (!limitCheck.allowed) {
        return { error: limitCheck.error || "Insufficient credits" };
    }

    // 3. Generate exercises with AI
    const nativeName = NATIVE_LANG_NAMES[nativeLang] || "Japanese";
    const prompt = `Generate ${exerciseCount} multiple-choice exercises for learning ${scriptName} script characters.
The learner's native language is ${nativeName}.

Characters the learner is WEAK on (focus exercises here): ${weakCharacters.join(", ") || "none"}
Characters the learner has MASTERED (include a few for reinforcement): ${masteredCharacters.join(", ") || "none"}

Generate a mix of exercise types:
- "recognition": Show a character, ask what sound/reading it represents (4 options)
- "reading": Show a word using the script, ask which character represents a specific sound
- "fill_blank": Show a word with one character missing, ask which character fits

Return JSON:
{
  "exercises": [
    {
      "type": "recognition" | "reading" | "fill_blank",
      "question": "question text in ${nativeName}",
      "questionTranslation": "question in target language for context",
      "character": "the featured character",
      "correctAnswer": "the correct option",
      "options": ["option1", "option2", "option3", "option4"],
      "explanation": "brief explanation in ${nativeName}",
      "explanationTranslation": "explanation in target language"
    }
  ]
}

IMPORTANT:
- Always include exactly 4 options per exercise
- correctAnswer must be one of the options
- Focus 70% of exercises on weak characters
- Questions and explanations should be in ${nativeName}
- Make distractors plausible (similar-looking or similar-sounding characters)`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a language education expert specializing in script/character learning. Always respond with valid JSON." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000,
        });

        const usage = response.usage;
        if (usage) {
            await logTokenUsage(
                user.id,
                "script_practice",
                "gpt-4o-mini",
                usage.prompt_tokens,
                usage.completion_tokens,
            );
        }

        const content = response.choices[0]?.message?.content;
        if (!content) return { error: "No response from AI" };

        const parsed = JSON.parse(content);
        const exercises: ScriptExercise[] = parsed.exercises || [];

        // Save session
        await (supabase as any).from("script_practice_sessions").insert({
            user_id: user.id,
            script_set_id: scriptSetId,
            language_code: targetLang,
            practice_type: "mixed",
            character_count: exercises.length,
            generated_exercises: parsed,
        });

        return { exercises };
    } catch (e: any) {
        console.error("Script practice generation error:", e);
        return { error: "Failed to generate exercises" };
    }
}
