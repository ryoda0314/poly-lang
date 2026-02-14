import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { Database } from '@/types/supabase';

type PhraseCollection = Database['public']['Tables']['phrase_collections']['Row'];
type LearningEvent = Database['public']['Tables']['learning_events']['Row'];

interface CollectionsState {
    collections: PhraseCollection[];
    phrasesByCollection: Record<string, LearningEvent[]>;
    uncategorizedPhrases: LearningEvent[];
    isLoading: boolean;

    fetchCollections: (userId: string, languageCode: string) => Promise<void>;
    fetchAllPhrases: (userId: string, languageCode: string) => Promise<void>;
    createCollection: (
        userId: string,
        languageCode: string,
        name: string,
        options?: { color?: string; icon?: string }
    ) => Promise<PhraseCollection | null>;
    updateCollection: (
        collectionId: string,
        updates: { name?: string; color?: string; icon?: string }
    ) => Promise<void>;
    deleteCollection: (collectionId: string) => Promise<void>;
    savePhraseToCollection: (
        userId: string,
        languageCode: string,
        text: string,
        translation: string,
        collectionId: string | null,
        tokens?: string[]
    ) => Promise<void>;
    movePhraseToCollection: (phraseId: string, collectionId: string | null) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
    collections: [],
    phrasesByCollection: {},
    uncategorizedPhrases: [],
    isLoading: false,

    fetchCollections: async (userId, languageCode) => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data, error } = await supabase
            .from('phrase_collections')
            .select('*')
            .eq('user_id', userId)
            .eq('language_code', languageCode)
            .order('position', { ascending: true });

        if (error) {
            console.error("Failed to fetch collections:", error);
        } else {
            set({ collections: data || [] });
        }
        set({ isLoading: false });
    },

    fetchAllPhrases: async (userId, languageCode) => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data, error } = await supabase
            .from('learning_events')
            .select('*')
            .eq('user_id', userId)
            .eq('language_code', languageCode)
            .eq('event_type', 'saved_phrase')
            .order('occurred_at', { ascending: false });

        if (error) {
            console.error("Failed to fetch phrases:", error);
            set({ isLoading: false });
            return;
        }

        const phrases = data || [];
        const byCollection: Record<string, LearningEvent[]> = {};
        const uncategorized: LearningEvent[] = [];

        for (const phrase of phrases) {
            if (phrase.collection_id) {
                if (!byCollection[phrase.collection_id]) {
                    byCollection[phrase.collection_id] = [];
                }
                byCollection[phrase.collection_id].push(phrase);
            } else {
                uncategorized.push(phrase);
            }
        }

        set({
            phrasesByCollection: byCollection,
            uncategorizedPhrases: uncategorized,
            isLoading: false
        });
    },

    createCollection: async (userId, languageCode, name, options = {}) => {
        const supabase = createClient();
        const { collections } = get();
        const maxPosition = collections.length > 0
            ? Math.max(...collections.map(c => c.position ?? 0))
            : -1;

        const { data, error } = await supabase
            .from('phrase_collections')
            .insert({
                user_id: userId,
                language_code: languageCode,
                name,
                color: options.color || null,
                icon: options.icon || null,
                position: maxPosition + 1
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create collection:", error);
            return null;
        }

        set({ collections: [...collections, data] });
        return data;
    },

    updateCollection: async (collectionId, updates) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('phrase_collections')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', collectionId);

        if (error) {
            console.error("Failed to update collection:", error);
            return;
        }

        const { collections } = get();
        set({
            collections: collections.map(c =>
                c.id === collectionId ? { ...c, ...updates } : c
            )
        });
    },

    deleteCollection: async (collectionId) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('phrase_collections')
            .delete()
            .eq('id', collectionId);

        if (error) {
            console.error("Failed to delete collection:", error);
            return;
        }

        const { collections, phrasesByCollection, uncategorizedPhrases } = get();
        const deletedPhrases = phrasesByCollection[collectionId] || [];
        const newByCollection = { ...phrasesByCollection };
        delete newByCollection[collectionId];

        set({
            collections: collections.filter(c => c.id !== collectionId),
            phrasesByCollection: newByCollection,
            uncategorizedPhrases: [...uncategorizedPhrases, ...deletedPhrases]
        });
    },

    savePhraseToCollection: async (userId, languageCode, text, translation, collectionId, tokens = []) => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('learning_events')
            .insert({
                user_id: userId,
                language_code: languageCode,
                event_type: 'saved_phrase',
                xp_delta: 0,
                occurred_at: new Date().toISOString(),
                collection_id: collectionId,
                meta: {
                    text,
                    translation,
                    source: 'correction',
                    tokens: tokens.length > 0 ? tokens : undefined
                }
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to save phrase:", error);
            throw error;
        }

        if (data) {
            const { phrasesByCollection, uncategorizedPhrases } = get();
            if (collectionId) {
                const existing = phrasesByCollection[collectionId] || [];
                set({
                    phrasesByCollection: {
                        ...phrasesByCollection,
                        [collectionId]: [data, ...existing]
                    }
                });
            } else {
                set({ uncategorizedPhrases: [data, ...uncategorizedPhrases] });
            }
        }
    },

    movePhraseToCollection: async (phraseId, collectionId) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('learning_events')
            .update({ collection_id: collectionId })
            .eq('id', phraseId);

        if (error) {
            console.error("Failed to move phrase:", error);
        }
    }
}));
