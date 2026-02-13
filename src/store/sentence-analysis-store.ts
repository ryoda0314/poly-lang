import { create } from 'zustand';
import {
    analyzeStage1,
    analyzeStage2,
    analyzeStage3,
    getAnalysisHistory,
    type SentenceAnalysisResult,
    type HistoryEntry,
} from '@/actions/sentence-analysis';
import { useHistoryStore } from './history-store';
import { TRACKING_EVENTS } from '@/lib/tracking_constants';

export type ViewState = 'input' | 'loading' | 'result';

interface SentenceAnalysisState {
    viewState: ViewState;
    inputSentence: string;
    analysisResult: SentenceAnalysisResult | null;
    isAnalyzing: boolean;
    loadingStage: number;
    error: string | null;
    history: HistoryEntry[];
    historyLoaded: boolean;

    setInputSentence: (sentence: string) => void;
    analyze: (sentence: string) => Promise<void>;
    goBackToInput: () => void;
    reset: () => void;
    loadHistory: () => Promise<void>;
}

export const useSentenceAnalysisStore = create<SentenceAnalysisState>((set, get) => ({
    viewState: 'input',
    inputSentence: '',
    analysisResult: null,
    isAnalyzing: false,
    loadingStage: 0,
    error: null,
    history: [],
    historyLoaded: false,

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

        try {
            // Stage 1: Cache check + Main clause SVOC
            const s1 = await analyzeStage1(trimmed);

            if (s1.error) {
                set({ isAnalyzing: false, loadingStage: 0, error: s1.error, viewState: 'input' });
                return;
            }

            if (s1.cached && s1.result) {
                set({
                    analysisResult: s1.result,
                    isAnalyzing: false,
                    loadingStage: 0,
                    viewState: 'result',
                    error: null,
                });
                useHistoryStore.getState().logEvent(TRACKING_EVENTS.SENTENCE_ANALYZED, 0, {
                    sentence: trimmed.slice(0, 100),
                    cached: true,
                });
                get().loadHistory();
                return;
            }

            // Stage 2: Sub-clause expansion
            set({ loadingStage: 1 });

            let s2TokenUsage = { prompt: 0, completion: 0 };
            let stage2Data: any = { subClauses: [] };

            if (s1.hasExpandable) {
                const s2 = await analyzeStage2(trimmed, s1.stage1Data!.elements, s1.posTokens, s1.vchainResult);
                if (s2.error) {
                    set({ isAnalyzing: false, loadingStage: 0, error: s2.error, viewState: 'input' });
                    return;
                }
                stage2Data = s2.stage2Data;
                s2TokenUsage = s2.tokenUsage;
            }

            // Stage 3: Enrichment
            set({ loadingStage: 2 });

            const prevTokens = {
                prompt: (s1.tokenUsage?.prompt ?? 0) + s2TokenUsage.prompt,
                completion: (s1.tokenUsage?.completion ?? 0) + s2TokenUsage.completion,
            };

            const s3 = await analyzeStage3(trimmed, s1.stage1Data, stage2Data, s1.cacheKey!, prevTokens);

            if (s3.result) {
                set({
                    analysisResult: s3.result,
                    isAnalyzing: false,
                    loadingStage: 0,
                    viewState: 'result',
                    error: null,
                });
                useHistoryStore.getState().logEvent(TRACKING_EVENTS.SENTENCE_ANALYZED, 0, {
                    sentence: trimmed.slice(0, 100),
                    cached: false,
                });
                get().loadHistory();
            } else {
                set({ isAnalyzing: false, loadingStage: 0, error: s3.error || '解析に失敗しました', viewState: 'input' });
            }
        } catch {
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

    loadHistory: async () => {
        const { entries } = await getAnalysisHistory();
        set({ history: entries, historyLoaded: true });
    },
}));
