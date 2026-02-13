import { create } from 'zustand';
import type { LongText, LongTextSentence, UserLongTextProgress, LongTextWithSentences } from '@/types/long-text';
import {
    getLongTexts,
    getLongTextWithSentences,
    getUserProgress,
    getAllUserProgress,
    updateProgress as updateProgressAction,
} from '@/actions/long-text';
import { useHistoryStore } from './history-store';
import { TRACKING_EVENTS } from '@/lib/tracking_constants';

interface LongTextState {
    // List view state
    texts: LongText[];
    progressMap: Record<string, UserLongTextProgress>;
    isLoadingTexts: boolean;

    // Reader view state
    currentText: LongTextWithSentences | null;
    currentSentenceIndex: number;
    currentProgress: UserLongTextProgress | null;
    isLoadingText: boolean;

    // Actions - List
    fetchTexts: (languageCode: string) => Promise<void>;

    // Actions - Reader
    loadText: (textId: string) => Promise<void>;
    goToNextSentence: () => void;
    goToPrevSentence: () => void;
    jumpToSentence: (index: number) => void;
    saveProgress: () => Promise<void>;
    markSentenceCompleted: (index: number) => void;

    // Actions - Reset
    clearCurrentText: () => void;
}

export const useLongTextStore = create<LongTextState>((set, get) => ({
    // Initial state
    texts: [],
    progressMap: {},
    isLoadingTexts: false,

    currentText: null,
    currentSentenceIndex: 0,
    currentProgress: null,
    isLoadingText: false,

    // Fetch all texts for a language
    fetchTexts: async (languageCode: string) => {
        set({ isLoadingTexts: true });

        try {
            const [texts, progressMap] = await Promise.all([
                getLongTexts(languageCode),
                getAllUserProgress(languageCode),
            ]);

            set({ texts, progressMap });
        } catch (error) {
            console.error('Failed to fetch texts:', error);
        } finally {
            set({ isLoadingTexts: false });
        }
    },

    // Load a single text with sentences
    loadText: async (textId: string) => {
        set({ isLoadingText: true, currentText: null, currentSentenceIndex: 0 });

        try {
            const [textData, progress] = await Promise.all([
                getLongTextWithSentences(textId),
                getUserProgress(textId),
            ]);

            if (textData) {
                const startIndex = progress?.current_sentence || 0;
                set({
                    currentText: textData,
                    currentProgress: progress,
                    currentSentenceIndex: startIndex,
                });
            }
        } catch (error) {
            console.error('Failed to load text:', error);
        } finally {
            set({ isLoadingText: false });
        }
    },

    // Navigation
    goToNextSentence: () => {
        const { currentText, currentSentenceIndex } = get();
        if (!currentText) return;

        const maxIndex = currentText.sentences.length - 1;
        if (currentSentenceIndex < maxIndex) {
            set({ currentSentenceIndex: currentSentenceIndex + 1 });
            get().saveProgress();
        }
    },

    goToPrevSentence: () => {
        const { currentSentenceIndex } = get();
        if (currentSentenceIndex > 0) {
            set({ currentSentenceIndex: currentSentenceIndex - 1 });
            get().saveProgress();
        }
    },

    jumpToSentence: (index: number) => {
        const { currentText } = get();
        if (!currentText) return;

        const maxIndex = currentText.sentences.length - 1;
        const safeIndex = Math.max(0, Math.min(index, maxIndex));
        set({ currentSentenceIndex: safeIndex });
        get().saveProgress();
    },

    // Save progress to server
    saveProgress: async () => {
        const { currentText, currentSentenceIndex, currentProgress } = get();
        if (!currentText) return;

        try {
            await updateProgressAction(
                currentText.id,
                currentSentenceIndex,
                currentProgress?.completed_sentences
            );
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    },

    // Mark a sentence as completed
    markSentenceCompleted: (index: number) => {
        const { currentProgress, currentText } = get();
        if (!currentText) return;

        const currentCompleted = currentProgress?.completed_sentences || [];
        if (!currentCompleted.includes(index)) {
            const newCompleted = [...currentCompleted, index];
            set({
                currentProgress: currentProgress
                    ? { ...currentProgress, completed_sentences: newCompleted }
                    : {
                        id: '',
                        user_id: '',
                        long_text_id: currentText.id,
                        current_sentence: index,
                        completed_sentences: newCompleted,
                        started_at: new Date().toISOString(),
                        last_accessed_at: new Date().toISOString(),
                    },
            });

            // Save to server
            updateProgressAction(currentText.id, index, newCompleted);

            // Log sentence completed event
            useHistoryStore.getState().logEvent(TRACKING_EVENTS.SENTENCE_COMPLETED, 0, {
                text_id: currentText.id,
                sentence_index: index,
                total_completed: newCompleted.length,
                total_sentences: currentText.sentences.length,
            });
        }
    },

    // Clear current text (for cleanup on unmount)
    clearCurrentText: () => {
        set({
            currentText: null,
            currentSentenceIndex: 0,
            currentProgress: null,
        });
    },
}));
