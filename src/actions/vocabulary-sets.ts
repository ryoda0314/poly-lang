"use server";

import { createClient } from "@/lib/supabase/server";

export interface VocabularySet {
    id: string;
    name: string;
    description?: string;
    wordCount: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Get vocabulary sets for a language
 */
export async function getVocabularySets(
    languageCode: string
): Promise<{ sets: VocabularySet[]; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { sets: [], error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from('vocabulary_sets')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_code', languageCode)
        .order('updated_at', { ascending: false });

    if (error) {
        return { sets: [], error: error.message };
    }

    const sets: VocabularySet[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        wordCount: row.word_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));

    return { sets };
}

/**
 * Create a new vocabulary set
 */
export async function createVocabularySet(
    name: string,
    languageCode: string,
    description?: string
): Promise<{ success: boolean; setId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from('vocabulary_sets')
        .insert({
            user_id: user.id,
            name,
            language_code: languageCode,
            description: description || null,
        })
        .select('id')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, setId: data.id };
}

/**
 * Update vocabulary set
 */
export async function updateVocabularySet(
    setId: string,
    name?: string,
    description?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { error } = await supabase
        .from('vocabulary_sets')
        .update(updates)
        .eq('id', setId)
        .eq('user_id', user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Delete vocabulary set
 */
export async function deleteVocabularySet(
    setId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from('vocabulary_sets')
        .delete()
        .eq('id', setId)
        .eq('user_id', user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
