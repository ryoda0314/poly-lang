import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { Database } from '@/types/supabase';
import { PHRASES } from '@/lib/data';

type Memo = Database['public']['Tables']['awareness_memos']['Row'];

interface AwarenessState {
    memos: Record<string, Memo[]>; // Key: `${phraseId}-${tokenIndex}` -> List of memos
    memosByText: Record<string, Memo[]>; // Key: `text` -> List of memos
    isLoading: boolean;
    selectedToken: { phraseId: string; tokenIndex: number; text: string } | null;

    // Actions
    fetchMemos: (userId: string) => Promise<void>;
    selectToken: (phraseId: string, tokenIndex: number, text: string) => void;
    clearSelection: () => void;
    addMemo: (userId: string, phraseId: string, tokenIndex: number, text: string, confidence: "high" | "medium" | "low", memoText?: string) => Promise<void>;
}

// Helper to find text for a token
const findTokenText = (phraseId: string, tokenIndex: number): string | null => {
    // Search all languages
    for (const lang of Object.keys(PHRASES)) {
        const phrases = PHRASES[lang];
        const phrase = phrases.find(p => p.id === phraseId);
        if (phrase) {
            // Re-tokenize or assume tokens exist?
            // PHRASES has `tokens` array? Let's check data.ts from previous context or view_file result
            // Viewing data.ts showed PHRASES structure?
            // "phrase.tokens" is commonly used in components.
            if (phrase.tokens && phrase.tokens[tokenIndex]) {
                return phrase.tokens[tokenIndex];
            }
            // If tokens are not pre-split in data, we might have an issue.
            // But TokenizedSentence receives `tokens` prop from `phrase.tokens`.
            return null;
        }
    }
    return null;
}

export const useAwarenessStore = create<AwarenessState>((set, get) => ({
    memos: {},
    memosByText: {},
    isLoading: false,
    selectedToken: null,

    fetchMemos: async (userId: string) => {
        set({ isLoading: true });
        const supabase = createClient();
        const { data, error } = await supabase
            .from('awareness_memos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            set({ isLoading: false });
            return;
        }

        const memoMap: Record<string, Memo[]> = {};
        const textMap: Record<string, Memo[]> = {};

        // Assert type to avoid TS inference issues with supa-client
        const memos = (data || []) as Memo[];

        memos.forEach(m => {
            const key = `${m.phrase_id}-${m.token_index}`;
            if (!memoMap[key]) memoMap[key] = [];
            memoMap[key].push(m);

            // Populate text map for global highlighting
            const text = findTokenText(m.phrase_id, m.token_index);
            // If we found text, map it. We normalize to lowercase for broader matching? 
            // Or exact match? Let's try exact match first.
            if (text) {
                const standardizedText = text.trim();
                if (!textMap[standardizedText]) textMap[standardizedText] = [];
                textMap[standardizedText].push(m);
            }
        });

        set({ memos: memoMap, memosByText: textMap, isLoading: false });
    },

    selectToken: (phraseId, tokenIndex, text) => {
        set({ selectedToken: { phraseId, tokenIndex, text } });
    },

    clearSelection: () => {
        set({ selectedToken: null });
    },

    addMemo: async (userId, phraseId, tokenIndex, text, confidence, memoText) => {
        const supabase = createClient();
        const key = `${phraseId}-${tokenIndex}`;

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;

        const optimisticMemo: Memo = {
            id: tempId,
            user_id: userId,
            phrase_id: phraseId,
            token_index: tokenIndex,
            confidence: confidence, // explicit assignment
            memo: memoText || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const currentMemos = get().memos[key] || [];
        const currentTextMemos = get().memosByText[text] || [];

        set(state => ({
            memos: {
                ...state.memos,
                [key]: [...currentMemos, optimisticMemo]
            },
            memosByText: {
                ...state.memosByText,
                [text]: [...currentTextMemos, optimisticMemo]
            }
        }));

        const { data, error } = await supabase
            .from('awareness_memos')
            .insert({
                user_id: userId,
                phrase_id: phraseId,
                token_index: tokenIndex,
                confidence: confidence,
                memo: memoText
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to add memo:", error);
            // Revert state (complex without immutable history, but simple pop works for now)
            // Just refetch for safety?
            const { fetchMemos } = get();
            await fetchMemos(userId);
        } else if (data) {
            // Replace temp ID with real one? 
            // Actually, just refetching or swapping is safer.
            // Swapping logic:
            const returnedMemo = data as Memo;
            set(state => {
                const newMemos = (state.memos[key] || []).map(m => m.id === tempId ? returnedMemo : m);
                const newTextMemos = (state.memosByText[text] || []).map(m => m.id === tempId ? returnedMemo : m);
                return {
                    memos: { ...state.memos, [key]: newMemos },
                    memosByText: { ...state.memosByText, [text]: newTextMemos }
                };
            });
        }
    }
}));
