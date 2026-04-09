"use server";

import { createClient } from "@/lib/supabase/server";
import type { LongText, LongTextSentence, UserLongTextProgress, LongTextWithSentences } from "@/types/long-text";

type SupabaseClientAny = Awaited<ReturnType<typeof createClient>> & { from: (table: string) => any };

/**
 * Get all accessible long texts for a language (published + user's own)
 */
export async function getLongTexts(languageCode: string): Promise<LongText[]> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    // Get published texts and user's own texts
    const { data, error } = await supabase
        .from('long_texts')
        .select('*')
        .eq('language_code', languageCode)
        .or(`is_published.eq.true,user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
        .order('created_at', { ascending: false }) as { data: LongText[] | null; error: any };

    if (error) {
        console.error('Failed to fetch long texts:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a single long text with its sentences (published or user's own)
 */
export async function getLongTextWithSentences(textId: string): Promise<LongTextWithSentences | null> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the long text (published or user's own - RLS handles this)
    const { data: longText, error: textError } = await supabase
        .from('long_texts')
        .select('*')
        .eq('id', textId)
        .single() as { data: LongText | null; error: any };

    if (textError || !longText) {
        console.error('Failed to fetch long text:', textError);
        return null;
    }

    // Fetch sentences
    const { data: sentences, error: sentencesError } = await supabase
        .from('long_text_sentences')
        .select('*')
        .eq('long_text_id', textId)
        .order('position', { ascending: true }) as { data: LongTextSentence[] | null; error: any };

    if (sentencesError) {
        console.error('Failed to fetch sentences:', sentencesError);
        return null;
    }

    return {
        ...longText,
        sentences: sentences || [],
    };
}

/**
 * Get user's progress for a long text
 */
export async function getUserProgress(textId: string): Promise<UserLongTextProgress | null> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_long_text_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('long_text_id', textId)
        .single() as { data: UserLongTextProgress | null; error: any };

    if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch progress:', error);
    }

    return data;
}

/**
 * Get all progress for a user (for showing on list page)
 */
export async function getAllUserProgress(languageCode: string): Promise<Record<string, UserLongTextProgress>> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return {};

    // Get text IDs for the language first
    const { data: texts } = await supabase
        .from('long_texts')
        .select('id')
        .eq('language_code', languageCode)
        .eq('is_published', true) as { data: { id: string }[] | null };

    if (!texts || texts.length === 0) return {};

    const textIds = texts.map(t => t.id);

    const { data, error } = await supabase
        .from('user_long_text_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('long_text_id', textIds) as { data: UserLongTextProgress[] | null; error: any };

    if (error) {
        console.error('Failed to fetch all progress:', error);
        return {};
    }

    const progressMap: Record<string, UserLongTextProgress> = {};
    (data || []).forEach(p => {
        progressMap[p.long_text_id] = p;
    });

    return progressMap;
}

/**
 * Update or create user progress
 */
export async function updateProgress(
    textId: string,
    currentSentence: number,
    completedSentences?: number[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const now = new Date().toISOString();

    // Try to get existing progress
    const { data: existing } = await supabase
        .from('user_long_text_progress')
        .select('id, completed_sentences')
        .eq('user_id', user.id)
        .eq('long_text_id', textId)
        .single() as { data: { id: string; completed_sentences: number[] } | null };

    if (existing) {
        // Update existing
        const mergedCompleted = completedSentences
            ? [...new Set([...(existing.completed_sentences || []), ...completedSentences])]
            : existing.completed_sentences;

        const { error } = await supabase
            .from('user_long_text_progress')
            .update({
                current_sentence: currentSentence,
                completed_sentences: mergedCompleted,
                last_accessed_at: now,
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Failed to update progress:', error);
            return { success: false, error: 'Failed to update progress' };
        }
    } else {
        // Create new
        const { error } = await supabase
            .from('user_long_text_progress')
            .insert({
                user_id: user.id,
                long_text_id: textId,
                current_sentence: currentSentence,
                completed_sentences: completedSentences || [],
                started_at: now,
                last_accessed_at: now,
            });

        if (error) {
            console.error('Failed to create progress:', error);
            return { success: false, error: 'Failed to create progress' };
        }
    }

    return { success: true };
}

/**
 * Mark a long text as completed
 */
export async function markTextCompleted(textId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const now = new Date().toISOString();

    const { error } = await supabase
        .from('user_long_text_progress')
        .update({
            completed_at: now,
            last_accessed_at: now,
        })
        .eq('user_id', user.id)
        .eq('long_text_id', textId);

    if (error) {
        console.error('Failed to mark as completed:', error);
        return { success: false, error: 'Failed to mark as completed' };
    }

    return { success: true };
}

/**
 * Update tokens for a sentence (called after tokenization)
 */
export async function updateSentenceTokens(
    sentenceId: string,
    tokens: string[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;

    const { error } = await supabase
        .from('long_text_sentences')
        .update({ tokens })
        .eq('id', sentenceId);

    if (error) {
        console.error('Failed to update sentence tokens:', error);
        return { success: false, error: 'Failed to update tokens' };
    }

    return { success: true };
}

/**
 * Split text into sentences based on language
 */
function splitIntoSentences(text: string, languageCode: string): string[] {
    // Normalize whitespace and line breaks
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    let sentences: string[];

    if (languageCode === 'ja' || languageCode === 'zh') {
        // Japanese/Chinese: Split on 。！？ and newlines
        sentences = normalized.split(/(?<=[。！？\n])/);
    } else if (languageCode === 'ko') {
        // Korean: Split on . ! ? and newlines
        sentences = normalized.split(/(?<=[.!?\n])/);
    } else {
        // Western languages: Split on . ! ? followed by space or newline
        sentences = normalized.split(/(?<=[.!?])\s+|(?<=\n)/);
    }

    // Clean up and filter empty sentences
    return sentences
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/**
 * Create a new long text with sentences
 */
export async function createLongText(
    title: string,
    fullText: string,
    languageCode: string,
    options?: {
        titleTranslation?: string;
        difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
        category?: string;
    }
): Promise<{ success: boolean; textId?: string; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // Split text into sentences
    const sentences = splitIntoSentences(fullText, languageCode);

    if (sentences.length === 0) {
        return { success: false, error: "No sentences found in text" };
    }

    // Create the long text entry
    const { data: longText, error: textError } = await supabase
        .from('long_texts')
        .insert({
            user_id: user.id,
            title,
            title_translation: options?.titleTranslation,
            language_code: languageCode,
            difficulty_level: options?.difficultyLevel,
            category: options?.category,
            full_text: fullText,
            sentence_count: sentences.length,
            is_published: false, // User's own texts are not published by default
        })
        .select('id')
        .single() as { data: { id: string } | null; error: any };

    if (textError || !longText) {
        console.error('Failed to create long text:', textError);
        return { success: false, error: 'Failed to create long text' };
    }

    // Create sentence entries
    const sentenceInserts = sentences.map((text, index) => ({
        long_text_id: longText.id,
        position: index,
        text,
    }));

    const { error: sentencesError } = await supabase
        .from('long_text_sentences')
        .insert(sentenceInserts);

    if (sentencesError) {
        console.error('Failed to create sentences:', sentencesError);
        // Try to clean up the long text
        await supabase.from('long_texts').delete().eq('id', longText.id);
        return { success: false, error: 'Failed to create sentences' };
    }

    return { success: true, textId: longText.id };
}

/**
 * Delete a long text (user can only delete their own)
 */
export async function deleteLongText(textId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
        .from('long_texts')
        .delete()
        .eq('id', textId)
        .eq('user_id', user.id); // RLS also enforces this

    if (error) {
        console.error('Failed to delete long text:', error);
        return { success: false, error: 'Failed to delete long text' };
    }

    return { success: true };
}
