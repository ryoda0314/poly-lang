"use server";

import OpenAI from "openai";
import { LANGUAGES } from "@/lib/data";
import { checkAndConsumeCredit } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedWord {
    id: string;
    targetText: string;
    translation: string;
    reading?: string;
}

export interface GenerateVocabResult {
    success: boolean;
    sessionId?: string;
    words?: GeneratedWord[];
    error?: string;
}

export interface SessionResult {
    wordId: string;
    targetText: string;
    translation: string;
    correct: boolean;
    missCount: number;
}

/**
 * Generate vocabulary set based on a topic using AI
 */
export async function generateVocabularySet(
    topic: string,
    targetLang: string,
    nativeLang: string,
    wordCount: number = 10
): Promise<GenerateVocabResult> {
    if (!process.env.OPENAI_API_KEY) {
        return { success: false, error: "OpenAI API key not configured" };
    }

    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // 2. Credit check (use 'explorer' credit type)
    const limitCheck = await checkAndConsumeCredit(user.id, "explorer", supabase);
    if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.error || "Insufficient credits" };
    }

    // 3. Build AI prompt
    const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
    const nativeLangName = LANGUAGES.find(l => l.code === nativeLang)?.name || nativeLang;

    const needsReading = ['ja', 'zh', 'ko'].includes(targetLang);

    const prompt = buildVocabGenerationPrompt(
        topic,
        targetLangName,
        nativeLangName,
        targetLang,
        wordCount,
        needsReading
    );

    try {
        // 4. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        // 5. Log token usage
        if (response.usage) {
            logTokenUsage(
                user.id,
                "vocab_generator",
                "gpt-4o-mini",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            );
        }

        // 6. Parse response
        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return { success: false, error: "Empty response from AI" };
        }

        const words = parseGeneratedWords(content);

        if (!words || words.length === 0) {
            return { success: false, error: "Failed to generate vocabulary" };
        }

        // 7. Save session to database
        const { data: session, error: sessionError } = await supabase
            .from('vocab_generation_sessions')
            .insert({
                user_id: user.id,
                language_code: targetLang,
                topic,
                word_count: words.length,
                generated_words: words,
            })
            .select('id')
            .single();

        if (sessionError) {
            console.error("Failed to save session:", sessionError);
            // Still return the words even if session save fails
            return {
                success: true,
                words
            };
        }

        return {
            success: true,
            sessionId: session.id,
            words
        };
    } catch (error: any) {
        console.error("Vocabulary generation error:", error);
        return { success: false, error: error.message || "Generation failed" };
    }
}

/**
 * Save learning session results
 */
export async function saveSessionResults(
    sessionId: string,
    results: SessionResult[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from('vocab_generation_sessions')
        .update({
            session_results: results,
            completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

    if (error) {
        console.error("Failed to save session results:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

function buildVocabGenerationPrompt(
    topic: string,
    targetLangName: string,
    nativeLangName: string,
    targetLangCode: string,
    wordCount: number,
    needsReading: boolean
): string {
    const readingInstruction = needsReading
        ? `- "reading": The romanized reading (e.g., Pinyin for Chinese, Romaji for Japanese, Romanization for Korean)`
        : '';

    const readingExample = needsReading
        ? `, "reading": "ninjin"`
        : '';

    return `You are a language learning vocabulary generator.

Generate ${wordCount} ${targetLangName} vocabulary words about the topic: "${topic}"

Requirements:
1. Generate common, useful words related to the topic
2. Words should be appropriate for language learners
3. Include a mix of difficulty levels if possible
4. Translations must be in ${nativeLangName}

Return a JSON object with this exact structure:
{
  "words": [
    {
      "targetText": "The word in ${targetLangName}",
      "translation": "Translation in ${nativeLangName}"${readingExample}
    }
  ]
}

${readingInstruction ? `Reading field requirements:\n${readingInstruction}` : ''}

Example for topic "vegetables" (Japanese to English):
{
  "words": [
    { "targetText": "にんじん", "translation": "carrot"${needsReading ? ', "reading": "ninjin"' : ''} },
    { "targetText": "トマト", "translation": "tomato"${needsReading ? ', "reading": "tomato"' : ''} }
  ]
}

Generate exactly ${wordCount} words. Only return the JSON, no other text.`;
}

/**
 * Determine appropriate genre/topic name for vocabulary
 */
export async function determineGenreName(
    prompt: string,
    existingGenres: string[]
): Promise<{ genre: string; error?: string }> {
    if (!process.env.OPENAI_API_KEY) {
        return { genre: "その他", error: "OpenAI API key not configured" };
    }

    const systemPrompt = `You are a genre classifier for vocabulary learning.
Given a user's vocabulary generation prompt and a list of existing genre names, determine the most appropriate genre.

Rules:
1. If an existing genre fits well, return that genre name exactly
2. If no existing genre fits, create a short, clear new genre name (2-4 words max)
3. Use simple, descriptive genre names in Japanese (e.g., "動物", "食べ物", "ビジネス", "日常会話")
4. Return ONLY the genre name, nothing else`;

    const userPrompt = `Prompt: "${prompt}"
Existing genres: ${existingGenres.length > 0 ? existingGenres.join(', ') : 'None'}

What genre name should be used?`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 20,
        });

        const genre = response.choices[0]?.message?.content?.trim();

        if (!genre) {
            return { genre: "その他" };
        }

        return { genre };
    } catch (error: any) {
        console.error("Genre determination error:", error);
        return { genre: "その他", error: error.message };
    }
}

function parseGeneratedWords(content: string): GeneratedWord[] {
    try {
        const parsed = JSON.parse(content);
        const words = parsed.words || parsed;

        if (!Array.isArray(words)) {
            console.error("Parsed content is not an array:", parsed);
            return [];
        }

        return words.map((word: any, index: number) => ({
            id: `word-${Date.now()}-${index}`,
            targetText: word.targetText || word.target_text || word.word || '',
            translation: word.translation || word.meaning || '',
            reading: word.reading || word.pinyin || word.romaji || undefined,
        })).filter((w: GeneratedWord) => w.targetText && w.translation);
    } catch (error) {
        console.error("Failed to parse generated words:", error, content);
        return [];
    }
}
