import { create } from 'zustand';
import {
    lookupExpression,
    exploreVerb,
    getRecentPVSearches,
    type ExpressionEntry,
    type VerbExplorerItem,
    type RecentPVSearch,
} from '@/actions/phrasal-verbs';

export type ViewState = 'search' | 'loading' | 'detail' | 'verb-list';
export type SearchMode = 'expression' | 'verb';

interface PhrasalVerbState {
    // View state
    viewState: ViewState;
    previousViewState: ViewState | null;
    searchMode: SearchMode;

    // Search
    searchQuery: string;
    recentSearches: RecentPVSearch[];

    // Expression detail
    currentEntry: ExpressionEntry | null;

    // Verb explorer result
    verbResult: { verb: string; expressions: VerbExplorerItem[] } | null;

    // Loading states
    isSearching: boolean;
    loadingStage: number;
    error: string | null;

    // Actions
    setSearchMode: (mode: SearchMode) => void;
    searchExpression: (expression: string, targetLang: string, nativeLang: string) => Promise<void>;
    searchVerb: (verb: string, targetLang: string, nativeLang: string) => Promise<void>;
    selectExpression: (expression: string, targetLang: string, nativeLang: string) => void;
    fetchRecentSearches: (targetLang?: string) => Promise<void>;
    goBack: () => void;
    goToSearch: () => void;
    reset: () => void;
}

export const usePhrasalVerbStore = create<PhrasalVerbState>((set, get) => ({
    // Initial state
    viewState: 'search',
    previousViewState: null,
    searchMode: 'expression',
    searchQuery: '',
    recentSearches: [],
    currentEntry: null,
    verbResult: null,
    isSearching: false,
    loadingStage: 0,
    error: null,

    setSearchMode: (mode: SearchMode) => set({ searchMode: mode }),

    searchExpression: async (expression: string, targetLang: string, nativeLang: string) => {
        const trimmed = expression.trim();
        if (!trimmed) return;

        set({
            isSearching: true,
            error: null,
            viewState: 'loading',
            loadingStage: 0,
            searchQuery: trimmed,
            previousViewState: get().viewState,
        });

        // Time-based stage progression
        const timers: ReturnType<typeof setTimeout>[] = [];
        timers.push(setTimeout(() => set({ loadingStage: 1 }), 800));
        timers.push(setTimeout(() => set({ loadingStage: 2 }), 3000));

        try {
            const result = await lookupExpression(trimmed, targetLang, nativeLang);

            timers.forEach(clearTimeout);

            if (result.error) {
                set({ isSearching: false, loadingStage: 0, error: result.error, viewState: 'search' });
                return;
            }

            if (result.entry) {
                set({
                    currentEntry: result.entry,
                    isSearching: false,
                    loadingStage: 0,
                    viewState: 'detail',
                    error: null,
                });
                get().fetchRecentSearches(targetLang);
            } else {
                set({ isSearching: false, loadingStage: 0, error: '表現が見つかりませんでした', viewState: 'search' });
            }
        } catch {
            timers.forEach(clearTimeout);
            set({ isSearching: false, loadingStage: 0, error: 'エラーが発生しました', viewState: 'search' });
        }
    },

    searchVerb: async (verb: string, targetLang: string, nativeLang: string) => {
        const trimmed = verb.trim();
        if (!trimmed) return;

        set({
            isSearching: true,
            error: null,
            viewState: 'loading',
            loadingStage: 0,
            searchQuery: trimmed,
            previousViewState: get().viewState,
        });

        const timers: ReturnType<typeof setTimeout>[] = [];
        timers.push(setTimeout(() => set({ loadingStage: 1 }), 800));
        timers.push(setTimeout(() => set({ loadingStage: 2 }), 3000));

        try {
            const result = await exploreVerb(trimmed, targetLang, nativeLang);

            timers.forEach(clearTimeout);

            if (result.error) {
                set({ isSearching: false, loadingStage: 0, error: result.error, viewState: 'search' });
                return;
            }

            set({
                verbResult: { verb: result.verb, expressions: result.expressions },
                isSearching: false,
                loadingStage: 0,
                viewState: 'verb-list',
                error: null,
            });
            get().fetchRecentSearches(targetLang);
        } catch {
            timers.forEach(clearTimeout);
            set({ isSearching: false, loadingStage: 0, error: 'エラーが発生しました', viewState: 'search' });
        }
    },

    selectExpression: (expression: string, targetLang: string, nativeLang: string) => {
        get().searchExpression(expression, targetLang, nativeLang);
    },

    fetchRecentSearches: async (targetLang?: string) => {
        const searches = await getRecentPVSearches(targetLang);
        set({ recentSearches: searches });
    },

    goBack: () => {
        const prev = get().previousViewState;
        if (prev === 'verb-list' && get().verbResult) {
            set({ viewState: 'verb-list', previousViewState: null });
        } else {
            set({ viewState: 'search', previousViewState: null, error: null });
        }
    },

    goToSearch: () => {
        set({ viewState: 'search', error: null, previousViewState: null });
    },

    reset: () => set({
        viewState: 'search',
        previousViewState: null,
        searchQuery: '',
        currentEntry: null,
        verbResult: null,
        error: null,
        isSearching: false,
        loadingStage: 0,
    }),
}));
