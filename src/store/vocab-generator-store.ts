import { create } from 'zustand';
import { generateVocabularySet, saveSessionResults, determineGenreName, GeneratedWord, SessionResult } from '@/actions/generate-vocabulary';
import { saveToMyVocabulary, getVocabularyTopics } from '@/actions/my-vocabulary';

export type ViewState = 'input' | 'generating' | 'preview' | 'learning' | 'results';

export interface LearningWord extends GeneratedWord {
    missCount: number;
    isCorrect?: boolean;
}

interface VocabGeneratorState {
    // View state
    viewState: ViewState;

    // Generation
    topic: string;
    wordCount: number;
    isGenerating: boolean;
    generatedWords: LearningWord[];
    sessionId: string | null;
    error: string | null;

    // Learning session
    currentIndex: number;
    knownWords: LearningWord[];
    reviewWords: LearningWord[];

    // Actions
    setTopic: (topic: string) => void;
    setWordCount: (count: number) => void;
    generateVocabulary: (targetLang: string, nativeLang: string) => Promise<boolean>;
    startLearning: () => void;
    recordSwipe: (direction: 'left' | 'right') => void;
    retryMissedWords: () => void;
    finishSession: () => Promise<SessionResult[]>;
    saveWords: (wordIds: string[], languageCode: string) => Promise<{ success: boolean; savedCount: number }>;
    reset: () => void;
}

export const useVocabGeneratorStore = create<VocabGeneratorState>((set, get) => ({
    // Initial state
    viewState: 'input',
    topic: '',
    wordCount: 10,
    isGenerating: false,
    generatedWords: [],
    sessionId: null,
    error: null,
    currentIndex: 0,
    knownWords: [],
    reviewWords: [],

    setTopic: (topic) => set({ topic }),

    setWordCount: (count) => set({ wordCount: count }),

    generateVocabulary: async (targetLang, nativeLang) => {
        const { topic, wordCount } = get();

        if (!topic.trim()) {
            set({ error: 'トピックを入力してください' });
            return false;
        }

        set({ isGenerating: true, error: null, viewState: 'generating' });

        try {
            const result = await generateVocabularySet(topic, targetLang, nativeLang, wordCount);

            if (!result.success || !result.words) {
                set({
                    isGenerating: false,
                    error: result.error || '単語の生成に失敗しました',
                    viewState: 'input'
                });
                return false;
            }

            const learningWords: LearningWord[] = result.words.map(w => ({
                ...w,
                missCount: 0,
            }));

            set({
                isGenerating: false,
                generatedWords: learningWords,
                sessionId: result.sessionId || null,
                viewState: 'preview'
            });

            return true;
        } catch (error: any) {
            set({
                isGenerating: false,
                error: error.message || '生成エラー',
                viewState: 'input'
            });
            return false;
        }
    },

    startLearning: () => {
        const { generatedWords } = get();

        // Shuffle words
        const shuffled = [...generatedWords].sort(() => Math.random() - 0.5);

        set({
            generatedWords: shuffled,
            currentIndex: 0,
            knownWords: [],
            reviewWords: [],
            viewState: 'learning'
        });
    },

    recordSwipe: (direction) => {
        const { generatedWords, currentIndex, knownWords, reviewWords } = get();
        const currentWord = generatedWords[currentIndex];

        if (!currentWord) return;

        if (direction === 'right') {
            // Known - correct answer
            set({
                knownWords: [...knownWords, { ...currentWord, isCorrect: true }],
                currentIndex: currentIndex + 1
            });
        } else {
            // Review - incorrect answer, increment miss count
            const updatedWord = {
                ...currentWord,
                missCount: currentWord.missCount + 1,
                isCorrect: false
            };
            set({
                reviewWords: [...reviewWords, updatedWord],
                currentIndex: currentIndex + 1
            });
        }

    },

    retryMissedWords: () => {
        const { reviewWords } = get();

        if (reviewWords.length === 0) return;

        // Shuffle missed words for retry
        const shuffled = [...reviewWords].sort(() => Math.random() - 0.5);

        set({
            generatedWords: shuffled,
            currentIndex: 0,
            knownWords: [],
            reviewWords: [],
            viewState: 'learning'
        });
    },

    finishSession: async () => {
        const { knownWords, reviewWords, sessionId, generatedWords } = get();

        // Combine all results
        const allWords = [...knownWords, ...reviewWords];

        // Create results map to get final state of each word
        const resultsMap = new Map<string, SessionResult>();

        // First, add all original words with default state
        generatedWords.forEach(word => {
            resultsMap.set(word.id, {
                wordId: word.id,
                targetText: word.targetText,
                translation: word.translation,
                correct: false,
                missCount: 0
            });
        });

        // Update with actual results
        allWords.forEach(word => {
            const existing = resultsMap.get(word.id);
            if (existing) {
                resultsMap.set(word.id, {
                    ...existing,
                    correct: word.isCorrect || false,
                    missCount: word.missCount
                });
            }
        });

        const results = Array.from(resultsMap.values());

        // Save to database if we have a session
        if (sessionId) {
            await saveSessionResults(sessionId, results);
        }

        // Transition to results view
        set({ viewState: 'results' });

        return results;
    },

    saveWords: async (wordIds, languageCode) => {
        const { generatedWords, topic } = get();

        const wordsToSave = generatedWords
            .filter(w => wordIds.includes(w.id))
            .map(w => ({
                targetText: w.targetText,
                translation: w.translation,
                reading: w.reading,
            }));

        if (wordsToSave.length === 0) {
            return { success: false, savedCount: 0 };
        }

        // Get existing genres
        const { topics: existingGenres } = await getVocabularyTopics(languageCode);

        // Determine appropriate genre using AI
        const { genre } = await determineGenreName(topic, existingGenres);

        const result = await saveToMyVocabulary(wordsToSave, languageCode, genre);
        return result;
    },

    reset: () => set({
        viewState: 'input',
        topic: '',
        isGenerating: false,
        generatedWords: [],
        sessionId: null,
        error: null,
        currentIndex: 0,
        knownWords: [],
        reviewWords: [],
    }),
}));
