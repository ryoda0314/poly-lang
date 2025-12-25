import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { Database } from '@/types/supabase';
import { PHRASES } from '@/lib/data';

// Redefine Memo to match updated Database schema locally or use the generic one + extensions safely
type Memo = Database['public']['Tables']['awareness_memos']['Row'];

interface AwarenessState {
    memos: Record<string, Memo[]>; // Key: `${phraseId}-${tokenIndex}` -> List of memos
    memosByText: Record<string, Memo[]>; // Key: `text` -> List of memos
    isLoading: boolean;
    selectedToken: { phraseId: string; tokenIndex: number; text: string } | null;
    isMemoMode: boolean;

    // Actions
    fetchMemos: (userId: string, currentLanguage: string) => Promise<void>;
    selectToken: (phraseId: string, tokenIndex: number, text: string) => void;
    clearSelection: () => void;
    addMemo: (userId: string, phraseId: string, tokenIndex: number, text: string, confidence: "high" | "medium" | "low", languageCode: string, memoText?: string) => Promise<void>;
    updateMemo: (memoId: string, updates: Partial<Memo>) => Promise<void>;
    deleteMemo: (memoId: string) => Promise<void>;
    toggleMemoMode: () => void;
    setMemoMode: (mode: boolean) => void;

    // Verification
    checkCorrectionAttempts: (inputText: string) => Promise<void>;
    markVerified: (memoId: string) => Promise<void>;
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

    fetchMemos: async (userId: string, currentLanguage: string) => {
        set({ isLoading: true });
        const supabase = createClient();
        const { data, error } = await supabase
            .from('awareness_memos')
            .select('*')
            .eq('user_id', userId)
            .eq('language_code', currentLanguage)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("[fetchMemos] DB Error:", error);
            set({ isLoading: false });
            return;
        }

        console.log(`[fetchMemos] Fetched ${data?.length} memos. User: ${userId}, Lang: ${currentLanguage}`);
        if (data?.length > 0) {
            console.log("[fetchMemos] Sample memo:", data[0]);
        }

        const memoMap: Record<string, Memo[]> = {};
        const textMap: Record<string, Memo[]> = {};

        // Assert type to avoid TS inference issues with supa-client
        const memos = (data || []) as Memo[];

        // We still need PHRASES to find token text for global map, but filtering is done by DB now.
        const phrasesForLang = PHRASES[currentLanguage] || [];

        memos.forEach(m => {
            const key = `${m.phrase_id}-${m.token_index}`;
            if (!memoMap[key]) memoMap[key] = [];
            memoMap[key].push(m);

            // Populate text map for global highlighting
            let text = m.token_text;

            // Fallback to phrase lookup if token_text is missing (legacy data)
            if (!text) {
                const phrase = phrasesForLang.find(p => p.id === m.phrase_id);
                if (phrase && phrase.tokens && phrase.tokens[m.token_index]) {
                    text = phrase.tokens[m.token_index];
                }
            }

            if (text) {
                const standardizedText = text.trim().toLowerCase();
                if (!textMap[standardizedText]) textMap[standardizedText] = [];
                textMap[standardizedText].push(m);
            }
        });

        console.log(`[fetchMemos] Mapped to text: ${Object.keys(textMap).length} unique tokens.`);
        set({ memos: memoMap, memosByText: textMap, isLoading: false });
    },

    selectToken: (phraseId, tokenIndex, text) => {
        set({ selectedToken: { phraseId, tokenIndex, text } });
    },

    clearSelection: () => {
        set({ selectedToken: null });
    },

    addMemo: async (userId, phraseId, tokenIndex, text, confidence, languageCode, memoText) => {
        console.log('[addMemo] Starting...', { userId, phraseId, tokenIndex, text, confidence, languageCode, memoText });

        const supabase = createClient();
        const key = `${phraseId}-${tokenIndex}`;

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;

        const optimisticMemo: Memo = {
            id: tempId,
            user_id: userId,
            phrase_id: phraseId,
            token_index: tokenIndex,
            language_code: languageCode, // New field
            token_text: text,
            confidence: confidence,
            memo: memoText || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'unverified',
            strength: 0,
            attempted_at: null,
            verified_at: null,
            last_reviewed_at: null,
            next_review_at: null
        };

        const currentMemos = get().memos[key] || [];
        const normalizedText = text.trim().toLowerCase();
        const currentTextMemos = get().memosByText[normalizedText] || [];

        set(state => ({
            memos: {
                ...state.memos,
                [key]: [...currentMemos, optimisticMemo]
            },
            memosByText: {
                ...state.memosByText,
                [normalizedText]: [...currentTextMemos, optimisticMemo]
            }
        }));

        try {
            console.log('[addMemo] Calling supabase.insert directly...');

            const startTime = Date.now();
            const { data, error } = await supabase
                .from('awareness_memos')
                .insert({
                    user_id: userId,
                    phrase_id: phraseId,
                    token_index: tokenIndex,
                    language_code: languageCode,
                    token_text: text, // New field
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
                await fetchMemos(userId, languageCode);
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
            await fetchMemos(userId, languageCode);
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
    setMemoMode: (mode) => set({ isMemoMode: mode }),

    // --- Verification Logic ---

    // 1. Check if correction text contains any unverified tokens
    checkCorrectionAttempts: async (inputText: string) => {
        const state = get();
        const supabase = createClient();
        const normalizedInput = inputText.toLowerCase();

        // 1. Find matches
        const updates: PromiseLike<any>[] = [];
        const affectedMemoIds: string[] = [];

        // Scan all memos (inefficient but fine for <1000 items)
        // Better: iterate keys of memosByText?
        Object.entries(state.memosByText).forEach(([tokenText, memos]) => {
            // Check if token exists in input
            if (normalizedInput.includes(tokenText.toLowerCase())) {
                memos.forEach(memo => {
                    // Only transition unverified -> attempted
                    if (memo.status === 'unverified') {
                        affectedMemoIds.push(memo.id);

                        // Optimistic Update
                        state.updateMemo(memo.id, {
                            status: 'attempted',
                            attempted_at: new Date().toISOString()
                        }); // This handles local state

                        updates.push(
                            supabase
                                .from('awareness_memos')
                                .update({
                                    status: 'attempted',
                                    attempted_at: new Date().toISOString()
                                })
                                .eq('id', memo.id)
                                .then()
                        );
                    }
                });
            }
        });

        if (updates.length > 0) {
            console.log(`[checkCorrectionAttempts] Found ${updates.length} matches. Updating...`);
            await Promise.all(updates);
        }
    },

    // 2. Mark as Verified (explicit user action)
    markVerified: async (memoId: string) => {
        const state = get();
        const supabase = createClient();

        // Optimistic
        state.updateMemo(memoId, {
            status: 'verified',
            verified_at: new Date().toISOString(),
            // Per spec: verification doesn't necessarily bump strength, Review does.
            // But maybe initial verification sets strength=1? Spec says "Review Logic" handles strength.
            // "Verification" just moves it out of the blocking queue. 
        });

        const { error } = await supabase
            .from('awareness_memos')
            .update({
                status: 'verified',
                verified_at: new Date().toISOString()
            })
            .eq('id', memoId);

        if (error) console.error("Failed to mark verified:", error);
    }
}));

