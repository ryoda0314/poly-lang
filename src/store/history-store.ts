import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { Database } from '@/types/supabase';

type LearningEvent = Database['public']['Tables']['learning_events']['Row'];

interface HistoryState {
    events: LearningEvent[];
    isLoading: boolean;

    fetchHistory: (userId: string, languageCode: string) => Promise<void>;
    savePhrase: (userId: string, languageCode: string, text: string, translation: string, tokens?: string[]) => Promise<void>;
    logEvent: (eventType: string, xp?: number, meta?: any) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    events: [],
    isLoading: false,

    fetchHistory: async (userId, languageCode) => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data, error } = await supabase
            .from('learning_events')
            .select('*')
            .eq('user_id', userId)
            .eq('language_code', languageCode)
            .in('event_type', ['saved_phrase']) // focused on saved phrases for now
            .order('occurred_at', { ascending: false });

        if (error) {
            console.error("Failed to fetch history:", error);
        } else {
            set({ events: data || [] });
        }
        set({ isLoading: false });
    },

    savePhrase: async (userId, languageCode, text, translation, tokens = []) => {
        const supabase = createClient();

        // Optimistic update? Maybe not needed for history list unless displayed immediately

        const { error } = await supabase
            .from('learning_events')
            .insert({
                user_id: userId,
                language_code: languageCode,
                event_type: 'saved_phrase',
                xp_delta: 0, // Saving doesn't necessarily give XP? Maybe small amount?
                occurred_at: new Date().toISOString(),
                meta: {
                    text,
                    translation,
                    source: 'correction',
                    tokens: tokens.length > 0 ? tokens : undefined
                }
            });

        if (error) {
            console.error("Failed to save phrase to history:", error);
            throw error;
        }

        // Refresh history if active
        // get().fetchHistory(userId, languageCode);
    },

    logEvent: async (eventType, xp = 0, meta = {}) => {
        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_type: eventType, xp, meta })
            });
        } catch (e) {
            console.error("Failed to log event:", e);
        }
    }
}));
