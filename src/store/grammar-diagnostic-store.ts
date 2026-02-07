import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';

export interface GrammarPattern {
    id: string;
    user_id: string;
    language_code: string;
    pattern_template: string;
    example_sentence: string;
    translation: string;
    category: string;
    status: 'to_learn' | 'learning' | 'mastered';
    session_id: string | null;
    created_at: string;
    updated_at: string;
}

interface GrammarDiagnosticState {
    patterns: GrammarPattern[];
    isLoading: boolean;

    fetchPatterns: (userId: string, languageCode: string) => Promise<void>;
    updatePatternStatus: (id: string, status: GrammarPattern['status']) => Promise<void>;
    deletePattern: (id: string) => Promise<void>;
}

export const useGrammarDiagnosticStore = create<GrammarDiagnosticState>((set, get) => ({
    patterns: [],
    isLoading: false,

    fetchPatterns: async (userId, languageCode) => {
        set({ isLoading: true });
        // Note: cast needed until Supabase types are regenerated after migration
        const supabase = createClient() as any;

        const { data, error } = await supabase
            .from('grammar_patterns')
            .select('*')
            .eq('user_id', userId)
            .eq('language_code', languageCode)
            .neq('status', 'known')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Failed to fetch grammar patterns:", error);
            set({ isLoading: false });
            return;
        }

        set({ patterns: (data || []) as GrammarPattern[], isLoading: false });
    },

    updatePatternStatus: async (id, status) => {
        const supabase = createClient() as any;

        // Optimistic update
        set(state => ({
            patterns: state.patterns.map(p =>
                p.id === id ? { ...p, status, updated_at: new Date().toISOString() } : p
            )
        }));

        const { error } = await supabase
            .from('grammar_patterns')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error("Failed to update pattern status:", error);
        }
    },

    deletePattern: async (id) => {
        const supabase = createClient() as any;

        // Optimistic delete
        set(state => ({
            patterns: state.patterns.filter(p => p.id !== id)
        }));

        const { error } = await supabase
            .from('grammar_patterns')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to delete grammar pattern:", error);
        }
    },
}));
