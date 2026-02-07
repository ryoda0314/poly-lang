"use server";

import OpenAI from "openai";
import { LANGUAGES } from "@/lib/data";
import { checkAndConsumeCredit } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedPattern {
    id: string;
    patternTemplate: string;
    exampleSentence: string;
    translation: string;
    category: string;
}

export interface GenerateGrammarResult {
    success: boolean;
    sessionId?: string;
    patterns?: GeneratedPattern[];
    error?: string;
}

/**
 * Generate grammar patterns for diagnostic using AI
 */
export async function generateGrammarPatterns(
    targetLang: string,
    nativeLang: string,
    category?: string,
    patternCount: number = 15
): Promise<GenerateGrammarResult> {
    if (!process.env.OPENAI_API_KEY) {
        return { success: false, error: "OpenAI API key not configured" };
    }

    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // 2. Credit check
    const limitCheck = await checkAndConsumeCredit(user.id, "explorer", supabase);
    if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.error || "Insufficient credits" };
    }

    // 3. Fetch existing patterns to avoid duplicates
    const { data: existingPatterns } = await (supabase as any)
        .from('grammar_patterns')
        .select('pattern_template')
        .eq('user_id', user.id)
        .eq('language_code', targetLang);

    const existingTemplates: string[] = (existingPatterns || []).map((p: any) => p.pattern_template);

    // 4. Build AI prompt
    const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
    const nativeLangName = LANGUAGES.find(l => l.code === nativeLang)?.name || nativeLang;

    const prompt = buildGrammarPrompt(targetLangName, nativeLangName, patternCount, category, existingTemplates);

    try {
        // 5. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
            response_format: { type: "json_object" },
        });

        // 5. Log token usage
        if (response.usage) {
            logTokenUsage(
                user.id,
                "grammar_diagnostic",
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

        const patterns = parseGeneratedPatterns(content);

        if (!patterns || patterns.length === 0) {
            return { success: false, error: "Failed to generate grammar patterns" };
        }

        // 7. Save session to database
        // Note: cast needed until Supabase types are regenerated after migration
        const { data: session, error: sessionError } = await (supabase as any)
            .from('grammar_diagnostic_sessions')
            .insert({
                user_id: user.id,
                language_code: targetLang,
                native_language: nativeLang,
                category: category || null,
                total_patterns: patterns.length,
                generated_patterns: JSON.parse(JSON.stringify(patterns)),
            })
            .select('id')
            .single();

        if (sessionError) {
            console.error("Failed to save session:", sessionError);
            return { success: true, patterns };
        }

        return {
            success: true,
            sessionId: session.id,
            patterns
        };
    } catch (error: any) {
        console.error("Grammar pattern generation error:", error);
        return { success: false, error: error.message || "Generation failed" };
    }
}

/**
 * Update session with diagnostic results
 */
export async function saveDiagnosticResults(
    sessionId: string,
    knownCount: number,
    unknownCount: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await (supabase as any)
        .from('grammar_diagnostic_sessions')
        .update({
            known_count: knownCount,
            unknown_count: unknownCount,
            completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

    if (error) {
        console.error("Failed to save diagnostic results:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Save diagnostic patterns (both known and unknown) to the grammar_patterns table
 */
export async function saveDiagnosticPatterns(
    knownPatterns: GeneratedPattern[],
    unknownPatterns: GeneratedPattern[],
    languageCode: string,
    sessionId?: string
): Promise<{ success: boolean; savedCount?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const toRow = (p: GeneratedPattern, status: string) => ({
        user_id: user.id,
        language_code: languageCode,
        pattern_template: p.patternTemplate,
        example_sentence: p.exampleSentence,
        translation: p.translation,
        category: p.category,
        status,
        session_id: sessionId || null,
    });

    const rows = [
        ...unknownPatterns.map(p => toRow(p, 'to_learn')),
        ...knownPatterns.map(p => toRow(p, 'known')),
    ];

    const { data, error } = await (supabase as any)
        .from('grammar_patterns')
        .upsert(rows, { onConflict: 'user_id,language_code,pattern_template' })
        .select('id');

    if (error) {
        console.error("Failed to save grammar patterns:", error);
        return { success: false, error: error.message };
    }

    return { success: true, savedCount: data?.length || 0 };
}

function buildGrammarPrompt(
    targetLangName: string,
    nativeLangName: string,
    patternCount: number,
    category?: string,
    excludePatterns?: string[]
): string {
    const categoryInstruction = category
        ? `Focus specifically on patterns related to: ${category}`
        : `Cover a diverse mix of categories: requesting, refusing/declining, expressing feelings, hypothetical/conditional, suggestions/advice, explaining reasons, comparing, expressing opinions, softening statements, and more.`;

    const excludeInstruction = excludePatterns && excludePatterns.length > 0
        ? `\n7. IMPORTANT: Do NOT include any of these patterns the user already knows:\n${excludePatterns.map(p => `   - ${p}`).join('\n')}`
        : '';

    return `You are an expert in ${targetLangName} daily conversation grammar patterns.

Generate ${patternCount} common grammar patterns (sentence structures/構文) used in everyday ${targetLangName} conversation.

Requirements:
1. Focus on practical sentence structures that expand expressive range
2. Patterns should be ones a learner might not know but would find very useful
3. Include the pattern template (with a placeholder like 〜), a natural example sentence, and an explanation
4. Explanations must be in ${nativeLangName}
5. ${categoryInstruction}
6. Order from more common/useful to less common${excludeInstruction}

Return a JSON object with this exact structure:
{
  "patterns": [
    {
      "patternTemplate": "The grammar pattern template in ${targetLangName} (e.g. 〜てもいいですか？)",
      "exampleSentence": "A natural example sentence using this pattern in ${targetLangName}",
      "translation": "What this pattern means and when to use it, explained in ${nativeLangName}",
      "category": "Category name in ${nativeLangName} (e.g. 許可を求める, お願い, 断る)"
    }
  ]
}

Generate exactly ${patternCount} patterns. Only return JSON, no other text.`;
}

function parseGeneratedPatterns(content: string): GeneratedPattern[] {
    try {
        const parsed = JSON.parse(content);
        const patterns = parsed.patterns || parsed;

        if (!Array.isArray(patterns)) {
            console.error("Parsed content is not an array:", parsed);
            return [];
        }

        return patterns.map((p: any, index: number) => ({
            id: `pattern-${Date.now()}-${index}`,
            patternTemplate: p.patternTemplate || p.pattern_template || '',
            exampleSentence: p.exampleSentence || p.example_sentence || '',
            translation: p.translation || p.explanation || '',
            category: p.category || '',
        })).filter((p: GeneratedPattern) => p.patternTemplate && p.translation);
    } catch (error) {
        console.error("Failed to parse generated patterns:", error, content);
        return [];
    }
}
