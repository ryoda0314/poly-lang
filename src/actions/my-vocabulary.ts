"use server";

import { createClient } from "@/lib/supabase/server";

export interface VocabWord {
    id: string;
    targetText: string;
    translation: string;
    reading?: string;
    sourceTopic?: string;
    missCount: number;
    correctCount: number;
    masteryLevel: number;
    createdAt: string;
}

export interface SaveVocabInput {
    targetText: string;
    translation: string;
    reading?: string;
}

/**
 * Save words to My Vocabulary
 */
export async function saveToMyVocabulary(
    words: SaveVocabInput[],
    languageCode: string,
    setId?: string,
    sourceTopic?: string
): Promise<{ success: boolean; savedCount: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, savedCount: 0, error: "Not authenticated" };
    }

    // Prepare data for upsert
    const vocabData = words.map(word => ({
        user_id: user.id,
        language_code: languageCode,
        target_text: word.targetText,
        translation: word.translation,
        reading: word.reading || null,
        set_id: setId || null,
        source_topic: sourceTopic || null,
    }));

    // Upsert to handle duplicates
    const { data, error } = await supabase
        .from('user_vocabulary')
        .upsert(vocabData, {
            onConflict: 'user_id,language_code,target_text',
            ignoreDuplicates: false
        })
        .select('id');

    if (error) {
        console.error("Failed to save vocabulary:", error);
        return { success: false, savedCount: 0, error: error.message };
    }

    return { success: true, savedCount: data?.length || 0 };
}

/**
 * Get My Vocabulary with pagination
 */
export async function getMyVocabulary(
    languageCode: string,
    options?: {
        limit?: number;
        offset?: number;
        sortBy?: 'created_at' | 'mastery_level' | 'miss_count';
        sortOrder?: 'asc' | 'desc';
        topic?: string;
        setId?: string;
    }
): Promise<{ words: VocabWord[]; total: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { words: [], total: 0, error: "Not authenticated" };
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';

    let query = supabase
        .from('user_vocabulary')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('language_code', languageCode);

    if (options?.topic) {
        query = query.eq('source_topic', options.topic);
    }

    if (options?.setId) {
        query = query.eq('set_id', options.setId);
    }

    query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
        console.error("Failed to fetch vocabulary:", error);
        return { words: [], total: 0, error: error.message };
    }

    const words: VocabWord[] = (data || []).map(row => ({
        id: row.id,
        targetText: row.target_text,
        translation: row.translation,
        reading: row.reading || undefined,
        sourceTopic: row.source_topic || undefined,
        missCount: row.miss_count ?? 0,
        correctCount: row.correct_count ?? 0,
        masteryLevel: row.mastery_level ?? 0,
        createdAt: row.created_at || '',
    }));

    return { words, total: count || 0 };
}

/**
 * Get unique topics from user's vocabulary
 */
export async function getVocabularyTopics(
    languageCode: string
): Promise<{ topics: string[]; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { topics: [], error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from('user_vocabulary')
        .select('source_topic')
        .eq('user_id', user.id)
        .eq('language_code', languageCode)
        .not('source_topic', 'is', null);

    if (error) {
        return { topics: [], error: error.message };
    }

    // Get unique topics
    const topics = [...new Set(data?.map(row => row.source_topic).filter(Boolean))] as string[];
    return { topics };
}

/**
 * Update vocabulary stats after learning
 */
export async function updateVocabStats(
    wordId: string,
    correct: boolean
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get current stats
    const { data: current, error: fetchError } = await supabase
        .from('user_vocabulary')
        .select('miss_count, correct_count, mastery_level')
        .eq('id', wordId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !current) {
        return { success: false, error: "Word not found" };
    }

    // Calculate new mastery level (0-5)
    const newCorrectCount = correct ? (current.correct_count ?? 0) + 1 : (current.correct_count ?? 0);
    const newMissCount = correct ? (current.miss_count ?? 0) : (current.miss_count ?? 0) + 1;
    const totalAttempts = newCorrectCount + newMissCount;
    const accuracy = totalAttempts > 0 ? newCorrectCount / totalAttempts : 0;

    // Mastery level based on accuracy and total attempts
    let masteryLevel = 0;
    if (totalAttempts >= 3) {
        if (accuracy >= 0.9) masteryLevel = 5;
        else if (accuracy >= 0.8) masteryLevel = 4;
        else if (accuracy >= 0.7) masteryLevel = 3;
        else if (accuracy >= 0.5) masteryLevel = 2;
        else if (accuracy >= 0.3) masteryLevel = 1;
    }

    const { error: updateError } = await supabase
        .from('user_vocabulary')
        .update({
            miss_count: newMissCount,
            correct_count: newCorrectCount,
            mastery_level: masteryLevel,
            updated_at: new Date().toISOString()
        })
        .eq('id', wordId)
        .eq('user_id', user.id);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true };
}

/**
 * Delete words from vocabulary
 */
export async function deleteFromVocabulary(
    wordIds: string[]
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, deletedCount: 0, error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from('user_vocabulary')
        .delete()
        .in('id', wordIds)
        .eq('user_id', user.id)
        .select('id');

    if (error) {
        return { success: false, deletedCount: 0, error: error.message };
    }

    return { success: true, deletedCount: data?.length || 0 };
}

/**
 * Get vocabulary count
 */
export async function getVocabularyCount(
    languageCode: string
): Promise<{ count: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { count: 0, error: "Not authenticated" };
    }

    const { count, error } = await supabase
        .from('user_vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('language_code', languageCode);

    if (error) {
        return { count: 0, error: error.message };
    }

    return { count: count || 0 };
}
