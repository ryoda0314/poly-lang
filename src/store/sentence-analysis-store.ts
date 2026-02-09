import { create } from 'zustand';
import {
    analyzeSentence,
    type SentenceAnalysisResult,
} from '@/actions/sentence-analysis';

export type ViewState = 'input' | 'loading' | 'result';

interface SentenceAnalysisState {
    viewState: ViewState;
    inputSentence: string;
    analysisResult: SentenceAnalysisResult | null;
    isAnalyzing: boolean;
    loadingStage: number;
    error: string | null;

    setInputSentence: (sentence: string) => void;
    analyze: (sentence: string) => Promise<void>;
    goBackToInput: () => void;
    reset: () => void;
}

export const useSentenceAnalysisStore = create<SentenceAnalysisState>((set, get) => ({
    viewState: 'input',
    inputSentence: '',
    analysisResult: null,
    isAnalyzing: false,
    loadingStage: 0,
    error: null,

    setInputSentence: (sentence: string) => set({ inputSentence: sentence }),

    analyze: async (sentence: string) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;

        set({
            isAnalyzing: true,
            error: null,
            viewState: 'loading',
            loadingStage: 0,
            inputSentence: trimmed,
        });

        const timers: ReturnType<typeof setTimeout>[] = [];
        timers.push(setTimeout(() => set({ loadingStage: 1 }), 800));
        timers.push(setTimeout(() => set({ loadingStage: 2 }), 4000));
        timers.push(setTimeout(() => set({ loadingStage: 3 }), 12000));

        try {
            const response = await analyzeSentence(trimmed);

            timers.forEach(clearTimeout);

            if (response.error) {
                set({ isAnalyzing: false, loadingStage: 0, error: response.error, viewState: 'input' });
                return;
            }

            if (response.result) {
                set({
                    analysisResult: response.result,
                    isAnalyzing: false,
                    loadingStage: 0,
                    viewState: 'result',
                    error: null,
                });
            } else {
                set({ isAnalyzing: false, loadingStage: 0, error: '解析に失敗しました', viewState: 'input' });
            }
        } catch {
            timers.forEach(clearTimeout);
            set({ isAnalyzing: false, loadingStage: 0, error: 'エラーが発生しました', viewState: 'input' });
        }
    },

    goBackToInput: () => {
        set({ viewState: 'input', error: null });
    },

    reset: () => set({
        viewState: 'input',
        inputSentence: '',
        analysisResult: null,
        error: null,
        isAnalyzing: false,
        loadingStage: 0,
    }),
}));
