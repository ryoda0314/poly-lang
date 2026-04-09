import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';

export interface SlangTerm {
    id: string;
    term: string;
    definition: string;
    example: string;
    language_code: string;
    tags: string[];
    type: 'word' | 'phrase';
    created_at: string;
}

interface SlangState {
    terms: SlangTerm[];
    isLoading: boolean;

    fetchSlang: (languageCode: string) => Promise<void>;
    addSlang: (term: string, definition: string, example: string, tags: string[], languageCode: string, type: 'word' | 'phrase') => Promise<void>;
    addSlangBulk: (items: Omit<SlangTerm, "id" | "created_at">[]) => Promise<void>;
    updateSlang: (id: string, updates: Partial<Omit<SlangTerm, "id" | "created_at">>) => Promise<void>;
    deleteSlang: (id: string) => Promise<void>;
}

export const useSlangStore = create<SlangState>((set, get) => ({
    terms: [],
    isLoading: false,

    fetchSlang: async (languageCode) => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data, error } = await (supabase as any)
            .from('slang_terms')
            .select('*')
            // .eq('language_code', languageCode) // Allow filtering if needed, or get all
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Failed to fetch slang:", error);
        } else {
            set({ terms: (data as any[]) || [] });
        }
        set({ isLoading: false });
    },

    addSlangBulk: async (items) => {
        const supabase = createClient();

        // Optimistic update
        const newTerms = items.map(item => ({
            ...item,
            id: `temp-${Date.now()}-${Math.random()}`,
            created_at: new Date().toISOString()
        }));

        set(state => ({
            terms: [...newTerms, ...state.terms]
        }));

        const { data, error } = await (supabase as any)
            .from('slang_terms')
            .upsert(items, { onConflict: 'term, language_code' })
            .select();

        if (error) {
            console.error("Failed to bulk add slang:", error);
        } else if (data) {
            // Refresh list to get real IDs and merged updates
            get().fetchSlang(items[0]?.language_code || 'en');
        }
    },

    addSlang: async (term, definition, example, tags, languageCode, type) => {
        const supabase = createClient();

        // Optimistic
        const tempId = `temp-${Date.now()}`;
        const newTerm: SlangTerm = {
            id: tempId,
            term,
            definition,
            example,
            language_code: languageCode,
            tags,
            type,
            created_at: new Date().toISOString()
        };

        set(state => ({
            terms: [newTerm, ...state.terms]
        }));

        const { data, error } = await (supabase as any)
            .from('slang_terms')
            .upsert({
                term,
                definition,
                example,
                language_code: languageCode,
                tags,
                type
            }, { onConflict: 'term, language_code' })
            .select()
            .single();

        if (error) {
            console.error("Failed to add slang:", error);
            // Revert?
        } else if (data) {
            // Replace temp with real or just refetch
            get().fetchSlang(languageCode);
        }
    },

    updateSlang: async (id, updates) => {
        const supabase = createClient();

        set(state => ({
            terms: state.terms.map(t => t.id === id ? { ...t, ...updates } : t)
        }));

        const { error } = await (supabase as any)
            .from('slang_terms')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error("Failed to update slang:", error);
            // Revert on error? For now assume success.
        }
    },

    deleteSlang: async (id) => {
        const supabase = createClient();

        set(state => ({
            terms: state.terms.filter(t => t.id !== id)
        }));

        const { error } = await (supabase as any)
            .from('slang_terms')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to delete slang:", error);
        }
    }
}));
