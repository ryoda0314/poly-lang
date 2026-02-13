import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { useHistoryStore } from './history-store';
import { TRACKING_EVENTS } from '@/lib/tracking_constants';

export interface SlangTerm {
    id: string;
    term: string;
    definition: string;
    language_code: string;
    created_at: string;
    vote_count_up: number;
    vote_count_down: number;
    user_vote?: boolean | null;
    status?: 'pending' | 'approved' | 'rejected';
}

export interface SlangVote {
    id: string;
    slang_term_id: string;
    user_id: string;
    vote: boolean;
    age_group?: string;
    gender?: string;
    created_at: string;
}

export type AgeGroup = '10s' | '20s' | '30s' | '40s' | '50s' | '60plus';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

interface SlangState {
    terms: SlangTerm[];
    unvotedTerms: SlangTerm[];
    isLoading: boolean;
    isLoadingUnvoted: boolean;

    fetchSlang: (languageCode: string, userId?: string, statusFilter?: string) => Promise<void>;
    fetchUnvotedSlangs: (languageCode: string, userId: string) => Promise<void>;
    voteSlang: (slangId: string, userId: string, vote: boolean, demographics?: { ageGroup: string; gender: string }) => Promise<void>;
    addSlang: (term: string, definition: string, languageCode: string) => Promise<void>;
    addSlangBulk: (items: Omit<SlangTerm, "id" | "created_at" | "vote_count_up" | "vote_count_down">[]) => Promise<void>;
    updateSlang: (id: string, updates: Partial<Omit<SlangTerm, "id" | "created_at">>) => Promise<void>;
    deleteSlang: (id: string) => Promise<void>;
    deleteSlangBulk: (ids: string[]) => Promise<void>;
    suggestSlang: (term: string, definition: string, languageCode: string) => Promise<boolean>;
    updateSlangStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

export const useSlangStore = create<SlangState>((set, get) => ({
    terms: [],
    unvotedTerms: [],
    isLoading: false,
    isLoadingUnvoted: false,

    fetchSlang: async (languageCode, userId, statusFilter) => {
        set({ isLoading: true });
        const supabase = createClient();

        // Fetch all rows with pagination (Supabase default limit is 1000)
        let allData: any[] = [];
        const PAGE_SIZE = 1000;
        let from = 0;
        while (true) {
            let query = (supabase as any)
                .from('slang_terms')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + PAGE_SIZE - 1);

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Failed to fetch slang:", error);
                set({ isLoading: false });
                return;
            }

            allData = allData.concat(data || []);
            if (!data || data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }

        let terms = allData;

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

        // Fetch all approved slang terms for the language
        const { data: allTerms, error: termsError } = await (supabase as any)
            .from('slang_terms')
            .select('*')
            .eq('language_code', languageCode)
            .eq('status', 'approved')
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
        const unvoted = (allTerms || [])
            .filter((t: any) => !votedIds.has(t.id))
            .map((t: any) => ({
                ...t,
                vote_count_up: t.vote_count_up || 0,
                vote_count_down: t.vote_count_down || 0,
                user_vote: null
            }));

        // Shuffle helper (Fisher-Yates)
        const shuffle = (arr: SlangTerm[]): SlangTerm[] => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        // Prioritize terms with fewer votes (newly approved suggestions), then randomize
        const fresh = unvoted.filter((t: any) => t.vote_count_up + t.vote_count_down === 0);
        const rest = unvoted.filter((t: any) => t.vote_count_up + t.vote_count_down > 0);
        const unvotedTerms = [...shuffle(fresh), ...shuffle(rest)];

        set({ unvotedTerms, isLoadingUnvoted: false });
    },

    voteSlang: async (slangId, userId, vote, demographics) => {
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

        // Insert vote with demographics
        const { error } = await (supabase as any)
            .from('slang_votes')
            .insert({
                slang_term_id: slangId,
                user_id: userId,
                vote,
                age_group: demographics?.ageGroup || null,
                gender: demographics?.gender || null,
            });

        if (error) {
            console.error("Failed to vote slang:", error);
        }

        // Log slang vote event
        useHistoryStore.getState().logEvent(TRACKING_EVENTS.SLANG_VOTED, 0, {
            slang_id: slangId,
            vote,
        });
    },

    addSlangBulk: async (items) => {
        const supabase = createClient();

        // Clean items and deduplicate by (term, language_code) — last one wins
        const deduped = new Map<string, { term: string; definition: string; language_code: string }>();
        for (const item of items) {
            deduped.set(`${item.term}\0${item.language_code}`, {
                term: item.term,
                definition: item.definition,
                language_code: item.language_code,
            });
        }
        const cleanItems = [...deduped.values()];

        // Optimistic update with temp IDs
        const newTerms = cleanItems.map((item, idx) => ({
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
            .upsert(cleanItems, { onConflict: 'term,language_code' })
            .select();

        if (error) {
            console.error("Failed to bulk add slang:", error.message || error.code || JSON.stringify(error));
        } else if (data) {
            // Refresh list to get real IDs and merged updates
            get().fetchSlang(items[0]?.language_code || 'en');
        }
    },

    addSlang: async (term: string, definition: string, languageCode: string) => {
        const supabase = createClient();

        // Optimistic
        const tempId = `temp-${Date.now()}`;
        const newTerm: SlangTerm = {
            id: tempId,
            term,
            definition,
            language_code: languageCode,
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
                language_code: languageCode,
            }, { onConflict: 'term,language_code' })
            .select()
            .single();

        if (error) {
            console.error("Failed to add slang:", error);
        } else if (data) {
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

        // Optimistic update
        set(state => ({
            terms: state.terms.filter(t => t.id !== id)
        }));

        // Skip temp IDs (not yet in database)
        if (id.startsWith('temp-')) return;

        const { error } = await (supabase as any)
            .from('slang_terms')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to delete slang:", error);
            // Re-fetch on error
            get().fetchSlang('en');
        }
    },

    deleteSlangBulk: async (ids) => {
        if (ids.length === 0) return;

        const supabase = createClient();

        // Filter out temp IDs (not yet in database)
        const realIds = ids.filter(id => !id.startsWith('temp-'));

        // Optimistic update
        set(state => ({
            terms: state.terms.filter(t => !ids.includes(t.id))
        }));

        if (realIds.length > 0) {
            const { error } = await (supabase as any)
                .from('slang_terms')
                .delete()
                .in('id', realIds);

            if (error) {
                console.error("Failed to bulk delete slang:", error);
                // Re-fetch to restore state on error
                get().fetchSlang('en');
            }
        }
    },

    suggestSlang: async (term, definition, languageCode) => {
        const supabase = createClient();

        const { error } = await (supabase as any)
            .from('slang_terms')
            .insert({
                term,
                definition,
                language_code: languageCode,
                status: 'pending',
            });

        if (error) {
            console.error("Failed to suggest slang:", error);
            return false;
        }
        return true;
    },

    updateSlangStatus: async (id, status) => {
        const supabase = createClient();

        set(state => ({
            terms: state.terms.map(t => t.id === id ? { ...t, status } : t)
        }));

        const { error } = await (supabase as any)
            .from('slang_terms')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error("Failed to update slang status:", error);
            get().fetchSlang('en');
        }
    }
}));
