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
    vote_count_up: number;
    vote_count_down: number;
    user_vote?: boolean | null;
}

export interface SlangVote {
    id: string;
    slang_term_id: string;
    user_id: string;
    vote: boolean;
    created_at: string;
}

interface SlangState {
    terms: SlangTerm[];
    unvotedTerms: SlangTerm[];
    isLoading: boolean;
    isLoadingUnvoted: boolean;

    fetchSlang: (languageCode: string, userId?: string) => Promise<void>;
    fetchUnvotedSlangs: (languageCode: string, userId: string) => Promise<void>;
    voteSlang: (slangId: string, userId: string, vote: boolean) => Promise<void>;
    addSlang: (term: string, definition: string, example: string, tags: string[], languageCode: string, type: 'word' | 'phrase') => Promise<void>;
    addSlangBulk: (items: Omit<SlangTerm, "id" | "created_at" | "vote_count_up" | "vote_count_down">[]) => Promise<void>;
    updateSlang: (id: string, updates: Partial<Omit<SlangTerm, "id" | "created_at">>) => Promise<void>;
    deleteSlang: (id: string) => Promise<void>;
}

export const useSlangStore = create<SlangState>((set, get) => ({
    terms: [],
    unvotedTerms: [],
    isLoading: false,
    isLoadingUnvoted: false,

    fetchSlang: async (languageCode, userId) => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data, error } = await (supabase as any)
            .from('slang_terms')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Failed to fetch slang:", error);
            set({ isLoading: false });
            return;
        }

        let terms = (data as any[]) || [];

        // Fetch user votes if userId is provided
        if (userId && terms.length > 0) {
            const termIds = terms.map(t => t.id);
            const { data: votes } = await (supabase as any)
                .from('slang_votes')
                .select('slang_term_id, vote')
                .eq('user_id', userId)
                .in('slang_term_id', termIds);

            if (votes) {
                const voteMap = new Map(votes.map((v: any) => [v.slang_term_id, v.vote]));
                terms = terms.map(t => ({
                    ...t,
                    vote_count_up: t.vote_count_up || 0,
                    vote_count_down: t.vote_count_down || 0,
                    user_vote: voteMap.has(t.id) ? voteMap.get(t.id) : null
                }));
            }
        } else {
            terms = terms.map(t => ({
                ...t,
                vote_count_up: t.vote_count_up || 0,
                vote_count_down: t.vote_count_down || 0,
                user_vote: null
            }));
        }

        set({ terms, isLoading: false });
    },

    fetchUnvotedSlangs: async (languageCode, userId) => {
        set({ isLoadingUnvoted: true });
        const supabase = createClient();

        // Fetch all slang terms for the language
        const { data: allTerms, error: termsError } = await (supabase as any)
            .from('slang_terms')
            .select('*')
            .eq('language_code', languageCode)
            .order('created_at', { ascending: false });

        if (termsError) {
            console.error("Failed to fetch slang terms:", termsError);
            set({ isLoadingUnvoted: false });
            return;
        }

        // Fetch user's existing votes
        const { data: userVotes, error: votesError } = await (supabase as any)
            .from('slang_votes')
            .select('slang_term_id')
            .eq('user_id', userId);

        if (votesError) {
            console.error("Failed to fetch user votes:", votesError);
            set({ isLoadingUnvoted: false });
            return;
        }

        const votedIds = new Set((userVotes || []).map((v: any) => v.slang_term_id));
        const unvotedTerms = (allTerms || [])
            .filter((t: any) => !votedIds.has(t.id))
            .map((t: any) => ({
                ...t,
                vote_count_up: t.vote_count_up || 0,
                vote_count_down: t.vote_count_down || 0,
                user_vote: null
            }));

        set({ unvotedTerms, isLoadingUnvoted: false });
    },

    voteSlang: async (slangId, userId, vote) => {
        const supabase = createClient();

        // Optimistic update: remove from unvotedTerms and update terms
        set(state => ({
            unvotedTerms: state.unvotedTerms.filter(t => t.id !== slangId),
            terms: state.terms.map(t => {
                if (t.id !== slangId) return t;
                const wasVotedUp = t.user_vote === true;
                const wasVotedDown = t.user_vote === false;
                let newUp = t.vote_count_up;
                let newDown = t.vote_count_down;

                if (wasVotedUp) newUp--;
                if (wasVotedDown) newDown--;
                if (vote) newUp++;
                else newDown++;

                return {
                    ...t,
                    vote_count_up: newUp,
                    vote_count_down: newDown,
                    user_vote: vote
                };
            })
        }));

        // Upsert vote
        const { error } = await (supabase as any)
            .from('slang_votes')
            .upsert({
                slang_term_id: slangId,
                user_id: userId,
                vote
            }, { onConflict: 'slang_term_id, user_id' });

        if (error) {
            console.error("Failed to vote slang:", error);
        }
    },

    addSlangBulk: async (items) => {
        const supabase = createClient();

        // Optimistic update with crypto-safe IDs
        const newTerms = items.map((item, idx) => ({
            ...item,
            id: `temp-${Date.now()}-${idx}`,
            created_at: new Date().toISOString(),
            vote_count_up: 0,
            vote_count_down: 0,
            user_vote: null
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
            created_at: new Date().toISOString(),
            vote_count_up: 0,
            vote_count_down: 0,
            user_vote: null
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
