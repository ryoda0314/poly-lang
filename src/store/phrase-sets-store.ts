import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { Database } from '@/types/supabase';

type PhraseSet = Database['public']['Tables']['phrase_sets']['Row'];
type PhraseSetItem = Database['public']['Tables']['phrase_set_items']['Row'];

export interface NewPhraseInput {
    target_text: string;
    translation: string;
    tokens?: string[];
    category_id?: string;
}

interface PhraseSetState {
    phraseSets: PhraseSet[];
    currentSetId: string | 'builtin';
    currentSetPhrases: PhraseSetItem[];
    isLoading: boolean;
    isLoadingPhrases: boolean;

    fetchPhraseSets: (userId: string, languageCode: string) => Promise<void>;
    fetchSetPhrases: (setId: string) => Promise<void>;
    setCurrentSet: (setId: string | 'builtin') => void;
    createPhraseSet: (
        userId: string,
        languageCode: string,
        name: string,
        options?: { description?: string; color?: string; icon?: string }
    ) => Promise<PhraseSet | null>;
    updatePhraseSet: (
        setId: string,
        updates: { name?: string; description?: string; color?: string; icon?: string }
    ) => Promise<void>;
    deletePhraseSet: (setId: string) => Promise<void>;
    addPhrases: (setId: string, phrases: NewPhraseInput[]) => Promise<void>;
    updatePhrase: (phraseId: string, updates: Partial<NewPhraseInput>) => Promise<void>;
    deletePhrase: (phraseId: string) => Promise<void>;
    clearCurrentSet: () => void;
}

export const usePhraseSetStore = create<PhraseSetState>((set, get) => ({
    phraseSets: [],
    currentSetId: 'builtin',
    currentSetPhrases: [],
    isLoading: false,
    isLoadingPhrases: false,

    fetchPhraseSets: async (userId, languageCode) => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data, error } = await supabase
            .from('phrase_sets')
            .select('*')
            .eq('user_id', userId)
            .eq('language_code', languageCode)
            .order('position', { ascending: true });

        if (error) {
            console.error("Failed to fetch phrase sets:", error);
        } else {
            set({ phraseSets: data || [] });
        }
        set({ isLoading: false });
    },

    fetchSetPhrases: async (setId) => {
        set({ isLoadingPhrases: true });
        const supabase = createClient();

        const { data, error } = await supabase
            .from('phrase_set_items')
            .select('*')
            .eq('phrase_set_id', setId)
            .order('position', { ascending: true });

        if (error) {
            console.error("Failed to fetch phrases:", error);
        } else {
            set({ currentSetPhrases: data || [] });
        }
        set({ isLoadingPhrases: false });
    },

    setCurrentSet: (setId) => {
        set({ currentSetId: setId, currentSetPhrases: [] });
        if (setId !== 'builtin') {
            get().fetchSetPhrases(setId);
        }
    },

    createPhraseSet: async (userId, languageCode, name, options = {}) => {
        const supabase = createClient();
        const { phraseSets } = get();
        const maxPosition = phraseSets.length > 0
            ? Math.max(...phraseSets.map(s => s.position))
            : -1;

        const { data, error } = await supabase
            .from('phrase_sets')
            .insert({
                user_id: userId,
                language_code: languageCode,
                name,
                description: options.description || null,
                color: options.color || null,
                icon: options.icon || null,
                position: maxPosition + 1
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create phrase set:", error);
            return null;
        }

        set({ phraseSets: [...phraseSets, data] });
        return data;
    },

    updatePhraseSet: async (setId, updates) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('phrase_sets')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', setId);

        if (error) {
            console.error("Failed to update phrase set:", error);
            return;
        }

        const { phraseSets } = get();
        set({
            phraseSets: phraseSets.map(s =>
                s.id === setId ? { ...s, ...updates } : s
            )
        });
    },

    deletePhraseSet: async (setId) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('phrase_sets')
            .delete()
            .eq('id', setId);

        if (error) {
            console.error("Failed to delete phrase set:", error);
            return;
        }

        const { phraseSets, currentSetId } = get();
        set({
            phraseSets: phraseSets.filter(s => s.id !== setId),
            currentSetId: currentSetId === setId ? 'builtin' : currentSetId,
            currentSetPhrases: currentSetId === setId ? [] : get().currentSetPhrases
        });
    },

    addPhrases: async (setId, phrases) => {
        const supabase = createClient();
        const { currentSetPhrases } = get();
        const maxPosition = currentSetPhrases.length > 0
            ? Math.max(...currentSetPhrases.map(p => p.position))
            : -1;

        const insertData = phrases.map((phrase, index) => ({
            phrase_set_id: setId,
            target_text: phrase.target_text,
            translation: phrase.translation,
            tokens: phrase.tokens || null,
            category_id: phrase.category_id || null,
            position: maxPosition + 1 + index
        }));

        const { data, error } = await supabase
            .from('phrase_set_items')
            .insert(insertData)
            .select();

        if (error) {
            console.error("Failed to add phrases:", error);
            return;
        }

        if (data) {
            set({ currentSetPhrases: [...currentSetPhrases, ...data] });

            // Update phrase_count in local state
            const { phraseSets } = get();
            set({
                phraseSets: phraseSets.map(s =>
                    s.id === setId
                        ? { ...s, phrase_count: s.phrase_count + data.length }
                        : s
                )
            });
        }
    },

    updatePhrase: async (phraseId, updates) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('phrase_set_items')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', phraseId);

        if (error) {
            console.error("Failed to update phrase:", error);
            return;
        }

        const { currentSetPhrases } = get();
        set({
            currentSetPhrases: currentSetPhrases.map(p =>
                p.id === phraseId ? { ...p, ...updates } : p
            )
        });
    },

    deletePhrase: async (phraseId) => {
        const supabase = createClient();
        const { currentSetPhrases, phraseSets, currentSetId } = get();

        const phraseToDelete = currentSetPhrases.find(p => p.id === phraseId);
        if (!phraseToDelete) return;

        const { error } = await supabase
            .from('phrase_set_items')
            .delete()
            .eq('id', phraseId);

        if (error) {
            console.error("Failed to delete phrase:", error);
            return;
        }

        set({
            currentSetPhrases: currentSetPhrases.filter(p => p.id !== phraseId),
            phraseSets: phraseSets.map(s =>
                s.id === currentSetId
                    ? { ...s, phrase_count: Math.max(0, s.phrase_count - 1) }
                    : s
            )
        });
    },

    clearCurrentSet: () => {
        set({ currentSetId: 'builtin', currentSetPhrases: [] });
    }
}));
