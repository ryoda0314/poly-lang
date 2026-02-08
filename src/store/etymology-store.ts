import { create } from 'zustand';
import {
    lookupEtymology,
    searchWordParts,
    getWordPartOrigins,
    getRecentSearches,
    getWordsForPart,
    type EtymologyEntry,
    type WordPart,
    type RecentSearch,
    type PartDetailWord,
} from '@/actions/etymology';

export type ViewState = 'search' | 'loading' | 'result' | 'parts-library' | 'part-detail';

interface EtymologyState {
    // View state
    viewState: ViewState;
    previousViewState: ViewState | null;

    // Search
    searchQuery: string;
    recentSearches: RecentSearch[];
    targetLanguage: string;

    // Current word detail
    currentEntry: EtymologyEntry | null;

    // Parts library
    wordParts: WordPart[];
    partOrigins: string[];
    partsFilter: { type: string; origin: string; search: string };

    // Part detail
    selectedPart: WordPart | null;
    partDetailWords: PartDetailWord[];
    isLoadingPartDetail: boolean;

    // Loading states
    isSearching: boolean;
    isLoadingParts: boolean;
    loadingStage: number;
    error: string | null;

    // Actions
    setSearchQuery: (query: string) => void;
    setTargetLanguage: (lang: string) => void;
    searchWord: (word: string, targetLang: string, nativeLang: string) => Promise<void>;
    fetchWordParts: (filter?: { type?: string; origin?: string; search?: string }) => Promise<void>;
    fetchRecentSearches: (targetLang?: string) => Promise<void>;
    selectRelatedWord: (word: string, targetLang: string, nativeLang: string) => void;
    goToPartsLibrary: (partFilter?: { type?: string }) => void;
    goToPartDetail: (part: WordPart) => void;
    goToSearch: () => void;
    goBackFromResult: () => void;
    reset: () => void;
}

export const useEtymologyStore = create<EtymologyState>((set, get) => ({
    // Initial state
    viewState: 'search',
    previousViewState: null,
    searchQuery: '',
    recentSearches: [],
    targetLanguage: 'en',
    currentEntry: null,
    wordParts: [],
    partOrigins: [],
    partsFilter: { type: 'all', origin: 'all', search: '' },
    selectedPart: null,
    partDetailWords: [],
    isLoadingPartDetail: false,
    isSearching: false,
    isLoadingParts: false,
    loadingStage: 0,
    error: null,

    setSearchQuery: (query: string) => set({ searchQuery: query }),

    setTargetLanguage: (lang: string) => set({ targetLanguage: lang }),

    searchWord: async (word: string, targetLang: string, nativeLang: string) => {
        const trimmed = word.trim();
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
        timers.push(setTimeout(() => set({ loadingStage: 3 }), 12000));

        try {
            const result = await lookupEtymology(trimmed, targetLang, nativeLang);

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
                    viewState: 'result',
                    error: null,
                });

                // Refresh recent searches in background
                get().fetchRecentSearches(targetLang);
            } else {
                set({ isSearching: false, loadingStage: 0, error: 'Word not found', viewState: 'search' });
            }
        } catch {
            timers.forEach(clearTimeout);
            set({ isSearching: false, loadingStage: 0, error: 'エラーが発生しました', viewState: 'search' });
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
        getWordPartOrigins().then((origins) => set({ partOrigins: origins }));
    },

    goToPartDetail: async (part: WordPart) => {
        set({
            viewState: 'part-detail',
            selectedPart: part,
            isLoadingPartDetail: true,
            partDetailWords: [],
        });

        const words = await getWordsForPart(part.part, part.examples || undefined);
        set({ partDetailWords: words, isLoadingPartDetail: false });
    },

    goToSearch: () => {
        set({ viewState: 'search', error: null, previousViewState: null });
    },

    goBackFromResult: () => {
        const prev = get().previousViewState;
        if (prev === 'part-detail') {
            set({ viewState: 'part-detail', previousViewState: null });
        } else if (prev === 'parts-library') {
            set({ viewState: 'parts-library', previousViewState: null });
        } else {
            set({ viewState: 'search', previousViewState: null, error: null });
        }
    },

    reset: () => set({
        viewState: 'search',
        previousViewState: null,
        searchQuery: '',
        currentEntry: null,
        selectedPart: null,
        partDetailWords: [],
        error: null,
        isSearching: false,
        loadingStage: 0,
    }),
}));
