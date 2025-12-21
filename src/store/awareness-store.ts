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
    isMemoMode: boolean; // New state

    // Actions
    fetchMemos: (userId: string) => Promise<void>;
    selectToken: (phraseId: string, tokenIndex: number, text: string) => void;
    clearSelection: () => void;
    addMemo: (userId: string, phraseId: string, tokenIndex: number, text: string, confidence: "high" | "medium" | "low", memoText?: string) => Promise<void>;
    updateMemo: (memoId: string, updates: Partial<Memo>) => Promise<void>;
    deleteMemo: (memoId: string) => Promise<void>;
    toggleMemoMode: () => void;
    setMemoMode: (mode: boolean) => void;
}

// Helper to find text for a token
const findTokenText = (phraseId: string, tokenIndex: number): string | null => {
    // Search all languages
    for (const lang of Object.keys(PHRASES)) {
        const phrases = PHRASES[lang];
        const phrase = phrases.find(p => p.id === phraseId);
        if (phrase) {
            if (phrase.tokens && phrase.tokens[tokenIndex]) {
                return phrase.tokens[tokenIndex];
            }
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
    isMemoMode: false,

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
        console.log('[addMemo] Starting...', { userId, phraseId, tokenIndex, text, confidence, memoText });

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

        try {
            console.log('[addMemo] Calling supabase.insert directly...');
            console.log('[addMemo] Insert payload:', {
                user_id: userId,
                phrase_id: phraseId,
                token_index: tokenIndex,
                confidence: confidence,
                memo: memoText
            });

            const startTime = Date.now();
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

            const elapsed = Date.now() - startTime;
            console.log(`[addMemo] Supabase responded in ${elapsed}ms:`, { data, error });

            if (error) {
                console.error("[addMemo] Failed to add memo:", error);
                console.error("[addMemo] Error details:", JSON.stringify(error, null, 2));
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
        } catch (e) {
            console.error('[addMemo] Exception caught:', e);
            // Refetch on exception
            const { fetchMemos } = get();
            await fetchMemos(userId);
        }
    },

    updateMemo: async (memoId, updates) => {
        const supabase = createClient();

        // Helper to update state
        const updateState = (id: string, newMemo: Partial<Memo>) => {
            const state = get();
            const newMemos = { ...state.memos };
            const newMemosByText = { ...state.memosByText };

            // Inefficient scan but robust for now
            Object.keys(newMemos).forEach(key => {
                newMemos[key] = newMemos[key].map(m => m.id === id ? { ...m, ...newMemo } : m);
            });
            Object.keys(newMemosByText).forEach(key => {
                newMemosByText[key] = newMemosByText[key].map(m => m.id === id ? { ...m, ...newMemo } : m);
            });

            set({ memos: newMemos, memosByText: newMemosByText });
        };

        // Optimistic
        updateState(memoId, updates);

        const { error } = await supabase
            .from('awareness_memos')
            .update(updates)
            .eq('id', memoId);

        if (error) {
            console.error("Failed to update memo:", error);
            // Revert? (Not implemented for MVP speed, assume success)
        }
    },

    deleteMemo: async (memoId) => {
        const supabase = createClient();

        // Optimistic Delete
        const state = get();
        const newMemos = { ...state.memos };
        const newMemosByText = { ...state.memosByText };

        Object.keys(newMemos).forEach(key => {
            newMemos[key] = newMemos[key].filter(m => m.id !== memoId);
            if (newMemos[key].length === 0) delete newMemos[key];
        });
        Object.keys(newMemosByText).forEach(key => {
            newMemosByText[key] = newMemosByText[key].filter(m => m.id !== memoId);
            if (newMemosByText[key].length === 0) delete newMemosByText[key];
        });

        set({ memos: newMemos, memosByText: newMemosByText });

        const { error } = await supabase
            .from('awareness_memos')
            .delete()
            .eq('id', memoId);

        if (error) {
            console.error("Failed to delete memo:", error);
            // Revert?
        }
    },

    toggleMemoMode: () => set(state => ({ isMemoMode: !state.isMemoMode })),
    setMemoMode: (mode) => set({ isMemoMode: mode })
}));
