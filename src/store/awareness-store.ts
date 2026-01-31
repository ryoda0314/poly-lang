import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { Database } from '@/types/supabase';
import { PHRASES, Phrase } from '@/lib/data';
import { calculateNextReview, getNextStrength } from '@/lib/spaced-repetition';
import { useHistoryStore } from './history-store';
import { TRACKING_EVENTS } from '@/lib/tracking_constants';

// Redefine Memo to match updated Database schema locally or use the generic one + extensions safely
type Memo = Database['public']['Tables']['awareness_memos']['Row'];

// --- Word Matching Utilities ---

// Check if text contains only Latin characters (ASCII letters, numbers, spaces, punctuation)
function isLatinText(text: string): boolean {
    return /^[\x00-\x7F]*$/.test(text);
}

// Escape special regex characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extract words from Latin text for word boundary matching
function extractWords(text: string): Set<string> {
    const words = new Set<string>();
    const normalizedText = text.toLowerCase();

    // Only extract words for Latin text (used for word boundary matching)
    const matches = normalizedText.match(/\b\w+\b/g);
    if (matches) {
        matches.forEach(word => words.add(word));
    }

    return words;
}

// Check if a token matches in the input text
function tokenMatchesInText(tokenText: string, inputText: string, inputWords: Set<string>): boolean {
    const normalizedToken = tokenText.toLowerCase().trim();
    const normalizedInput = inputText.toLowerCase();

    // For Latin text (English, etc.), use word boundary matching
    if (isLatinText(normalizedToken)) {
        // For multi-word phrases, check substring
        if (normalizedToken.includes(' ')) {
            return normalizedInput.includes(normalizedToken);
        }
        // For single words, check extracted words or regex
        if (inputWords.has(normalizedToken)) {
            return true;
        }
        const regex = new RegExp(`\\b${escapeRegex(normalizedToken)}\\b`, 'i');
        return regex.test(inputText);
    }

    // For non-Latin text (Japanese, Korean, etc.), use simple includes
    return normalizedInput.includes(normalizedToken);
}

interface AwarenessState {
    memos: Record<string, Memo[]>; // Key: `${phraseId}-${tokenIndex}` -> List of memos
    memosByText: Record<string, Memo[]>; // Key: `text` -> List of memos
    isLoading: boolean;
    selectedToken: { phraseId: string; startIndex: number; endIndex: number; text: string; viewMode?: 'dictionary' | 'stats'; isRangeSelection?: boolean } | null;
    isMemoMode: boolean;
    isMultiSelectMode: boolean;

    // Actions
    fetchMemos: (userId: string, currentLanguage: string) => Promise<void>;
    selectToken: (phraseId: string, startIndex: number, endIndex: number, text: string, viewMode?: 'dictionary' | 'stats', isRangeSelection?: boolean) => void;
    clearSelection: () => void;
    addMemo: (userId: string, phraseId: string, tokenIndex: number, text: string, confidence: "high" | "medium" | "low", languageCode: string, memoText?: string, length?: number) => Promise<void>;
    updateMemo: (memoId: string, updates: Partial<Memo>) => Promise<void>;
    deleteMemo: (memoId: string) => Promise<void>;
    toggleMemoMode: () => void;
    setMemoMode: (mode: boolean) => void;
    toggleMultiSelectMode: () => void;
    setMultiSelectMode: (mode: boolean) => void;

    // Verification
    checkCorrectionAttempts: (inputText: string) => Promise<void>;
    verifyAttemptedMemosInText: (text: string) => Promise<void>;
    markVerified: (memoId: string) => Promise<void>;

    // Review
    recordReview: (memoId: string, wasUsedInOutput: boolean) => Promise<void>;
}



export const useAwarenessStore = create<AwarenessState>((set, get) => ({
    memos: {},
    memosByText: {},
    isLoading: false,
    selectedToken: null,
    isMemoMode: false,
    isMultiSelectMode: false,

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

        // Debug logging removed for security - user data should not be logged

        const memoMap: Record<string, Memo[]> = {};
        const textMap: Record<string, Memo[]> = {};

        // Assert type to avoid TS inference issues with supa-client
        const memos = (data || []) as Memo[];

        memos.forEach(m => {
            const key = `${m.phrase_id}-${m.token_index}`;
            if (!memoMap[key]) memoMap[key] = [];
            memoMap[key].push(m);

            // Populate text map for global highlighting
            let text = m.token_text;

            // Fallback to phrase lookup if token_text is missing (legacy data)
            if (!text) {
                const phrase = PHRASES.find((p: Phrase) => p.id === m.phrase_id);
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

        set({ memos: memoMap, memosByText: textMap, isLoading: false });
    },

    selectToken: (phraseId, startIndex, endIndex, text, viewMode = 'dictionary', isRangeSelection = false) => {
        set({ selectedToken: { phraseId, startIndex, endIndex, text, viewMode, isRangeSelection } });
    },

    clearSelection: () => {
        set({ selectedToken: null });
    },

    addMemo: async (userId, phraseId, tokenIndex, text, confidence, languageCode, memoText, length = 1) => {

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
            next_review_at: null,
            usage_count: 0,
            length: length
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
            const { data, error } = await supabase
                .from('awareness_memos')
                .insert({
                    user_id: userId,
                    phrase_id: phraseId,
                    token_index: tokenIndex,
                    language_code: languageCode,
                    token_text: text, // New field
                    confidence: confidence,
                    memo: memoText,
                    length: length
                })
                .select()
                .single();

            if (data) {
                useHistoryStore.getState().logEvent(TRACKING_EVENTS.MEMO_CREATED, 0, {
                    phrase_id: phraseId,
                    token_text: text,
                    confidence
                });
            }

            if (error) {
                console.error("[addMemo] Failed to add memo");
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
    toggleMultiSelectMode: () => set(state => {
        const nextMode = !state.isMultiSelectMode;
        if (!nextMode) {
            // If turning off, clear selection
            return { isMultiSelectMode: nextMode, selectedToken: null };
        }
        return { isMultiSelectMode: nextMode };
    }),
    setMultiSelectMode: (mode) => set({ isMultiSelectMode: mode }),

    // --- Verification Logic ---

    // 1. Check if correction text contains any unverified tokens
    checkCorrectionAttempts: async (inputText: string) => {
        const state = get();
        const supabase = createClient();

        // Extract words from input for efficient matching
        const inputWords = extractWords(inputText);

        // 1. Find matches
        const updates: PromiseLike<any>[] = [];
        const affectedMemoIds: string[] = [];

        // Scan all memos
        Object.entries(state.memosByText).forEach(([tokenText, memos]) => {
            // Check if token exists in input (exact word match)
            if (tokenMatchesInText(tokenText, inputText, inputWords)) {
                memos.forEach(memo => {
                    // Always increment usage count
                    const newCount = (memo.usage_count || 0) + 1;
                    const commonUpdates = { usage_count: newCount };

                    // Optimistic base update
                    state.updateMemo(memo.id, commonUpdates);

                    // Transition unverified -> attempted
                    if (memo.status === 'unverified') {
                        affectedMemoIds.push(memo.id);

                        const statusUpdates = {
                            ...commonUpdates,
                            status: 'attempted' as const,
                            attempted_at: new Date().toISOString()
                        };

                        // Optimistic Status
                        state.updateMemo(memo.id, statusUpdates);

                        updates.push(
                            supabase
                                .from('awareness_memos')
                                .update(statusUpdates)
                                .eq('id', memo.id)
                                .then()
                        );
                    }
                    // Review: If verified and used, Strength Up!
                    else if (memo.status === 'verified') {
                        // Update usage count in DB
                        updates.push(
                            supabase
                                .from('awareness_memos')
                                .update(commonUpdates)
                                .eq('id', memo.id)
                                .then()
                        );

                        // Trigger SRS update (separate call/update)
                        updates.push(state.recordReview(memo.id, true));
                    }
                    else {
                        // Just usage count update (e.g. attempted but not verified yet? Or repeated unverified usage?)
                        updates.push(
                            supabase
                                .from('awareness_memos')
                                .update(commonUpdates)
                                .eq('id', memo.id)
                                .then()
                        );
                    }
                });
            }
        });

        if (updates.length > 0) {
            await Promise.all(updates);
        }
    },

    // 2. Mark as Verified (implicit via reading/playing)
    verifyAttemptedMemosInText: async (text: string) => {
        const state = get();
        const supabase = createClient();

        // Extract words from text for efficient matching
        const textWords = extractWords(text);

        const updates: PromiseLike<any>[] = [];

        Object.entries(state.memosByText).forEach(([tokenText, memos]) => {
            if (tokenMatchesInText(tokenText, text, textWords)) {
                memos.forEach(memo => {
                    if (memo.status === 'unverified' || memo.status === 'attempted') {
                        // Optimistic
                        state.updateMemo(memo.id, {
                            status: 'verified',
                            verified_at: new Date().toISOString()
                        });

                        updates.push(
                            supabase
                                .from('awareness_memos')
                                .update({
                                    status: 'verified',
                                    verified_at: new Date().toISOString()
                                })
                                .eq('id', memo.id)
                                .then()
                        );

                        // Log Memo Verification (implicit)
                        useHistoryStore.getState().logEvent(TRACKING_EVENTS.MEMO_VERIFIED, 10, {
                            method: 'implicit_context',
                            token_text: memo.token_text,
                            memo_id: memo.id
                        });
                    }
                });
            }
        });

        if (updates.length > 0) {
            await Promise.all(updates);
        }
    },

    // 3. Mark as Verified (explicit user action)
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

        // Log Memo Verification (explicit)
        useHistoryStore.getState().logEvent(TRACKING_EVENTS.MEMO_VERIFIED, 0, {
            method: 'explicit_button',
            memo_id: memoId
        });

        const { error } = await supabase
            .from('awareness_memos')
            .update({
                status: 'verified',
                verified_at: new Date().toISOString()
            })
            .eq('id', memoId);

        if (error) console.error("Failed to mark verified:", error);
    },

    // --- Review Logic ---
    recordReview: async (memoId: string, wasUsedInOutput: boolean) => {
        const state = get();
        const supabase = createClient();

        // Find memo (inefficient lookup)
        let memo: Memo | undefined;
        for (const list of Object.values(state.memos)) {
            memo = list.find(m => m.id === memoId);
            if (memo) break;
        }

        if (!memo) {
            console.error("[recordReview] Memo not found:", memoId);
            return;
        }

        const newStrength = getNextStrength(memo.strength, wasUsedInOutput);
        const nextReview = calculateNextReview(newStrength, memo.confidence).toISOString();
        const now = new Date().toISOString();

        // Optimistic Update
        state.updateMemo(memoId, {
            strength: newStrength,
            last_reviewed_at: now,
            next_review_at: nextReview,
            // Review implies Verified if not already
            status: 'verified',
            verified_at: memo.verified_at || now
        });

        const { error } = await supabase
            .from('awareness_memos')
            .update({
                strength: newStrength,
                last_reviewed_at: now,
                next_review_at: nextReview,
                status: 'verified',
                verified_at: memo.verified_at || now
            })
            .eq('id', memoId);

        if (error) console.error("Failed to record review:", error);
    }
}));

