import { create } from 'zustand';
import {
    lookupEtymology,
    searchWordParts,
    getRecentSearches,
    type EtymologyEntry,
    type WordPart,
    type RecentSearch,
} from '@/actions/etymology';

export type ViewState = 'search' | 'loading' | 'result' | 'parts-library';

interface EtymologyState {
    // View state
    viewState: ViewState;

    // Search
    searchQuery: string;
    recentSearches: RecentSearch[];
    targetLanguage: string;

    // Current word detail
    currentEntry: EtymologyEntry | null;

    // Parts library
    wordParts: WordPart[];
    partsFilter: { type: string; origin: string; search: string };

    // Loading states
    isSearching: boolean;
    isLoadingParts: boolean;
    error: string | null;

    // Actions
    setSearchQuery: (query: string) => void;
    setTargetLanguage: (lang: string) => void;
    searchWord: (word: string, targetLang: string, nativeLang: string) => Promise<void>;
    fetchWordParts: (filter?: { type?: string; origin?: string; search?: string }) => Promise<void>;
    fetchRecentSearches: (targetLang?: string) => Promise<void>;
    selectRelatedWord: (word: string, targetLang: string, nativeLang: string) => void;
    goToPartsLibrary: (partFilter?: { type?: string }) => void;
    goToSearch: () => void;
    reset: () => void;
}

export const useEtymologyStore = create<EtymologyState>((set, get) => ({
    // Initial state
    viewState: 'search',
    searchQuery: '',
    recentSearches: [],
    targetLanguage: 'en',
    currentEntry: null,
    wordParts: [],
    partsFilter: { type: 'all', origin: 'all', search: '' },
    isSearching: false,
    isLoadingParts: false,
    error: null,

    setSearchQuery: (query: string) => set({ searchQuery: query }),

    setTargetLanguage: (lang: string) => set({ targetLanguage: lang }),

    searchWord: async (word: string, targetLang: string, nativeLang: string) => {
        const trimmed = word.trim();
        if (!trimmed) return;

        set({ isSearching: true, error: null, viewState: 'loading', searchQuery: trimmed });

        const result = await lookupEtymology(trimmed, targetLang, nativeLang);

        if (result.error) {
            set({ isSearching: false, error: result.error, viewState: 'search' });
            return;
        }

        if (result.entry) {
            set({
                currentEntry: result.entry,
                isSearching: false,
                viewState: 'result',
                error: null,
            });

            // Refresh recent searches in background
            get().fetchRecentSearches(targetLang);
        } else {
            set({ isSearching: false, error: 'Word not found', viewState: 'search' });
        }
    },

    fetchWordParts: async (filter) => {
        set({ isLoadingParts: true });

        const f = filter || get().partsFilter;
        if (filter) {
            set({
                partsFilter: {
                    type: filter.type || get().partsFilter.type,
                    origin: filter.origin || get().partsFilter.origin,
                    search: filter.search ?? get().partsFilter.search,
                },
            });
        }

        const parts = await searchWordParts(f.search || undefined, f.type, f.origin);
        set({ wordParts: parts, isLoadingParts: false });
    },

    fetchRecentSearches: async (targetLang?: string) => {
        const searches = await getRecentSearches(targetLang);
        set({ recentSearches: searches });
    },

    selectRelatedWord: (word: string, targetLang: string, nativeLang: string) => {
        get().searchWord(word, targetLang, nativeLang);
    },

    goToPartsLibrary: (partFilter) => {
        set({
            viewState: 'parts-library',
            partsFilter: {
                type: partFilter?.type || 'all',
                origin: 'all',
                search: '',
            },
        });
        get().fetchWordParts({
            type: partFilter?.type || 'all',
            origin: 'all',
            search: '',
        });
    },

    goToSearch: () => {
        set({ viewState: 'search', error: null });
    },

    reset: () => set({
        viewState: 'search',
        searchQuery: '',
        currentEntry: null,
        error: null,
        isSearching: false,
    }),
}));
