import { create } from 'zustand';
import {
    getNewsFeed,
    processArticle,
    getNewsHistory,
    saveNewsProgress,
} from '@/actions/news';
import type {
    NewsArticleSummary,
    ProcessedArticle,
    NewsHistoryEntry,
    NewsDifficulty,
} from '@/types/news';

export type NewsViewState = 'feed' | 'loading' | 'article' | 'history';

interface NewsState {
    // View
    viewState: NewsViewState;
    difficulty: NewsDifficulty;

    // Feed
    articles: NewsArticleSummary[];
    isLoadingFeed: boolean;

    // Article detail
    currentArticle: ProcessedArticle | null;
    isProcessing: boolean;
    loadingStage: number;
    error: string | null;

    // History
    history: NewsHistoryEntry[];
    isLoadingHistory: boolean;

    // Credit
    creditError: string | null;

    // Actions
    setDifficulty: (d: NewsDifficulty) => void;
    fetchFeed: (languageCode: string) => Promise<void>;
    handleProcessArticle: (
        sourceUrl: string,
        learningLanguage: string,
        nativeLanguage: string,
        titleHint?: string,
        descriptionHint?: string,
    ) => Promise<void>;
    submitUrl: (
        url: string,
        learningLanguage: string,
        nativeLanguage: string
    ) => Promise<void>;
    toggleVocabSaved: (index: number) => void;
    toggleGrammarSaved: (index: number) => void;
    saveProgress: () => Promise<void>;
    fetchHistory: () => Promise<void>;
    goToFeed: () => void;
    goToHistory: () => void;
    goBackFromArticle: () => void;
    clearCreditError: () => void;
    reset: () => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
    viewState: 'feed',
    difficulty: 'intermediate',
    articles: [],
    isLoadingFeed: false,
    currentArticle: null,
    isProcessing: false,
    loadingStage: 0,
    error: null,
    history: [],
    isLoadingHistory: false,
    creditError: null,

    setDifficulty: (d) => set({ difficulty: d }),

    fetchFeed: async (languageCode) => {
        set({ isLoadingFeed: true, error: null });
        try {
            const { articles } = await getNewsFeed(languageCode);
            set({ articles, isLoadingFeed: false });
        } catch {
            set({ isLoadingFeed: false, error: 'フィードの取得に失敗しました' });
        }
    },

    handleProcessArticle: async (sourceUrl, learningLanguage, nativeLanguage, titleHint?, descriptionHint?) => {
        const { difficulty } = get();
        set({ viewState: 'loading', isProcessing: true, loadingStage: 0, error: null, creditError: null });

        // Stage progression
        const stageTimer1 = setTimeout(() => set({ loadingStage: 1 }), 800);
        const stageTimer2 = setTimeout(() => set({ loadingStage: 2 }), 2500);

        try {
            const result = await processArticle(sourceUrl, difficulty, learningLanguage, nativeLanguage, titleHint, descriptionHint);

            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);

            if (result.error) {
                if (result.error.includes('クレジット') || result.error.includes('上限')) {
                    set({ creditError: result.error, viewState: 'feed', isProcessing: false, loadingStage: 0 });
                } else {
                    set({ error: result.error, viewState: 'feed', isProcessing: false, loadingStage: 0 });
                }
                return;
            }

            set({
                currentArticle: result.data || null,
                viewState: 'article',
                isProcessing: false,
                loadingStage: 3,
            });
        } catch {
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            set({ error: '処理中にエラーが発生しました', viewState: 'feed', isProcessing: false, loadingStage: 0 });
        }
    },

    submitUrl: async (url, learningLanguage, nativeLanguage) => {
        get().handleProcessArticle(url, learningLanguage, nativeLanguage);
    },

    toggleVocabSaved: (index) => {
        const article = get().currentArticle;
        if (!article) return;
        const vocabulary = [...article.vocabulary];
        vocabulary[index] = { ...vocabulary[index], saved: !vocabulary[index].saved };
        set({ currentArticle: { ...article, vocabulary } });
    },

    toggleGrammarSaved: (index) => {
        const article = get().currentArticle;
        if (!article) return;
        const grammarPatterns = [...article.grammarPatterns];
        grammarPatterns[index] = { ...grammarPatterns[index], saved: !grammarPatterns[index].saved };
        set({ currentArticle: { ...article, grammarPatterns } });
    },

    saveProgress: async () => {
        const article = get().currentArticle;
        if (!article) return;
        const savedVocab = article.vocabulary.filter(v => v.saved);
        const savedGrammar = article.grammarPatterns.filter(g => g.saved);
        await saveNewsProgress(article.articleId, article.difficulty, savedVocab, savedGrammar);
    },

    fetchHistory: async () => {
        set({ isLoadingHistory: true });
        try {
            const history = await getNewsHistory();
            set({ history, isLoadingHistory: false });
        } catch {
            set({ isLoadingHistory: false });
        }
    },

    goToFeed: () => set({ viewState: 'feed', error: null }),
    goToHistory: () => {
        set({ viewState: 'history' });
        get().fetchHistory();
    },
    goBackFromArticle: () => {
        // Save progress before leaving
        get().saveProgress();
        set({ viewState: 'feed', currentArticle: null });
    },
    clearCreditError: () => set({ creditError: null }),
    reset: () => set({
        viewState: 'feed',
        articles: [],
        currentArticle: null,
        isProcessing: false,
        loadingStage: 0,
        error: null,
        history: [],
        creditError: null,
    }),
}));
