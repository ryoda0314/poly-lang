import { create } from 'zustand';
import { createClient } from '@/lib/supa-client';
import { loadScriptSet, type ScriptSet, type ScriptCharacter } from '@/data/scripts';

// ─── Types ───

export type PracticeMode = 'recognition' | 'reading' | 'mixed';
export type CharacterFilter = 'all' | 'new' | 'due' | 'weak';
export type CharacterStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface CharacterProgress {
    id: string;
    character_id: string;
    script_set_id: string;
    status: CharacterStatus;
    strength: number;
    ease_factor: number;
    interval_days: number;
    review_count: number;
    correct_count: number;
    incorrect_count: number;
    last_reviewed_at: string | null;
    next_review_at: string | null;
}

export interface AIExercise {
    type: 'recognition' | 'reading' | 'fill_blank';
    question: string;
    questionTranslation: string;
    character: string;
    correctAnswer: string;
    options: string[];
    explanation: string;
    explanationTranslation: string;
}

// ─── Store ───

interface ScriptLearningState {
    // Script selection
    selectedScriptId: string | null;
    loadedScript: ScriptSet | null;
    isLoadingScript: boolean;

    // Practice config
    practiceMode: PracticeMode;
    characterFilter: CharacterFilter;
    practiceCount: number;
    selectedLessonSetId: string | null;

    // Practice session
    practiceCharacters: ScriptCharacter[];
    currentIndex: number;
    knownCharacters: ScriptCharacter[];
    unknownCharacters: ScriptCharacter[];
    sessionId: string | null;

    // AI exercises
    aiExercises: AIExercise[] | null;
    aiCurrentIndex: number;
    aiAnswers: { correct: boolean; exerciseIndex: number }[];
    isGenerating: boolean;

    // Progress data
    progressMap: Record<string, CharacterProgress>;
    isLoadingProgress: boolean;

    // Character detail modal
    selectedCharacter: ScriptCharacter | null;
    showCharacterDetail: boolean;

    // Error
    error: string | null;

    // Actions
    loadScript: (scriptId: string, userId: string) => Promise<void>;
    setPracticeMode: (mode: PracticeMode) => void;
    setCharacterFilter: (filter: CharacterFilter) => void;
    setPracticeCount: (count: number) => void;
    setLessonSet: (id: string | null) => void;
    startLessonPractice: (characterIds: string[]) => boolean;

    startPractice: () => boolean;
    handleSwipe: (direction: 'left' | 'right') => void;

    setAIExercises: (exercises: AIExercise[]) => void;
    answerAIExercise: (correct: boolean) => void;

    fetchProgress: (userId: string, scriptSetId: string) => Promise<void>;
    saveResults: (userId: string, languageCode: string) => Promise<void>;

    openCharacterDetail: (character: ScriptCharacter) => void;
    closeCharacterDetail: () => void;

    resetForNextFlashPhase: () => void;
    resetPractice: () => void;
    reset: () => void;
}

export const useScriptLearningStore = create<ScriptLearningState>((set, get) => ({
    // Initial state
    selectedScriptId: null,
    loadedScript: null,
    isLoadingScript: false,

    practiceMode: 'recognition',
    characterFilter: 'all',
    practiceCount: 20,
    selectedLessonSetId: null,

    practiceCharacters: [],
    currentIndex: 0,
    knownCharacters: [],
    unknownCharacters: [],
    sessionId: null,

    aiExercises: null,
    aiCurrentIndex: 0,
    aiAnswers: [],
    isGenerating: false,

    progressMap: {},
    isLoadingProgress: false,

    selectedCharacter: null,
    showCharacterDetail: false,

    error: null,

    // ─── Actions ───

    loadScript: async (scriptId, userId) => {
        const { selectedScriptId, loadedScript } = get();
        // Skip reload if already loaded, just refresh progress
        if (selectedScriptId === scriptId && loadedScript) {
            await get().fetchProgress(userId, scriptId);
            return;
        }
        set({ isLoadingScript: true, error: null, selectedScriptId: scriptId });
        try {
            const script = await loadScriptSet(scriptId);
            if (script) {
                set({ loadedScript: script, isLoadingScript: false });
                await get().fetchProgress(userId, scriptId);
            } else {
                set({ error: 'Script not found', isLoadingScript: false });
            }
        } catch (e) {
            console.error('Failed to load script:', e);
            set({ error: 'Failed to load script data', isLoadingScript: false });
        }
    },

    setPracticeMode: (mode) => set({ practiceMode: mode }),
    setCharacterFilter: (filter) => set({ characterFilter: filter }),
    setPracticeCount: (count) => set({ practiceCount: count }),
    setLessonSet: (id) => set({ selectedLessonSetId: id }),

    startLessonPractice: (characterIds) => {
        const { loadedScript } = get();
        if (!loadedScript) return false;

        const chars = loadedScript.characters.filter(c => characterIds.includes(c.id));
        if (chars.length === 0) return false;

        // Shuffle
        const shuffled = [...chars];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        set({
            practiceCharacters: shuffled,
            currentIndex: 0,
            knownCharacters: [],
            unknownCharacters: [],
            error: null,
        });
        return true;
    },

    startPractice: () => {
        const { loadedScript, characterFilter, practiceCount, progressMap } = get();
        if (!loadedScript) return false;

        let chars = [...loadedScript.characters];
        const now = new Date().toISOString();

        // Apply filter
        switch (characterFilter) {
            case 'new':
                chars = chars.filter(c => !progressMap[c.id] || progressMap[c.id].status === 'new');
                break;
            case 'due':
                chars = chars.filter(c => {
                    const p = progressMap[c.id];
                    return p && p.next_review_at && p.next_review_at <= now;
                });
                break;
            case 'weak':
                chars = chars.filter(c => {
                    const p = progressMap[c.id];
                    return p && p.strength <= 2 && p.status !== 'new';
                });
                break;
        }

        // Shuffle
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }

        // Limit count
        chars = chars.slice(0, practiceCount);

        if (chars.length === 0) {
            set({ error: 'No characters match the current filter' });
            return false;
        }

        set({
            practiceCharacters: chars,
            currentIndex: 0,
            knownCharacters: [],
            unknownCharacters: [],
            error: null,
        });
        return true;
    },

    handleSwipe: (direction) => {
        const { practiceCharacters, currentIndex, knownCharacters, unknownCharacters } = get();
        const current = practiceCharacters[currentIndex];
        if (!current) return;

        if (direction === 'right') {
            set({
                knownCharacters: [...knownCharacters, current],
                currentIndex: currentIndex + 1,
            });
        } else {
            set({
                unknownCharacters: [...unknownCharacters, current],
                currentIndex: currentIndex + 1,
            });
        }
    },

    setAIExercises: (exercises) => set({
        aiExercises: exercises,
        aiCurrentIndex: 0,
        aiAnswers: [],
        isGenerating: false,
    }),

    answerAIExercise: (correct) => {
        const { aiCurrentIndex, aiAnswers } = get();
        const newAnswers = [...aiAnswers, { correct, exerciseIndex: aiCurrentIndex }];
        set({ aiAnswers: newAnswers, aiCurrentIndex: aiCurrentIndex + 1 });
    },

    fetchProgress: async (userId, scriptSetId) => {
        set({ isLoadingProgress: true });
        try {
            const supabase = createClient();
            const { data, error } = await (supabase as any)
                .from('character_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('script_set_id', scriptSetId);

            if (error) {
                console.error('Failed to fetch progress:', error);
                set({ isLoadingProgress: false });
                return;
            }

            const map: Record<string, CharacterProgress> = {};
            for (const row of (data || []) as any[]) {
                map[row.character_id] = row as CharacterProgress;
            }
            set({ progressMap: map, isLoadingProgress: false });
        } catch (e) {
            console.error('Failed to fetch progress:', e);
            set({ isLoadingProgress: false });
        }
    },

    saveResults: async (userId, languageCode) => {
        const { knownCharacters, unknownCharacters, selectedScriptId, progressMap } = get();
        if (!selectedScriptId) return;

        const supabase = createClient();
        const now = new Date().toISOString();
        const newProgressMap = { ...progressMap };

        // Process all reviewed characters
        const allChars = [
            ...knownCharacters.map(c => ({ char: c, quality: 4 })),
            ...unknownCharacters.map(c => ({ char: c, quality: 1 })),
        ];

        for (const { char, quality } of allChars) {
            const existing = progressMap[char.id];
            const isCorrect = quality >= 3;

            // SM-2 calculation
            let ef = existing?.ease_factor ?? 2.5;
            let interval = existing?.interval_days ?? 0;
            let strength = existing?.strength ?? 0;

            if (isCorrect) {
                strength = Math.min(5, strength + 1);
                if (interval === 0) interval = 1;
                else if (interval === 1) interval = 6;
                else interval = Math.round(interval * ef);
                ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
            } else {
                strength = Math.max(0, strength - 1);
                interval = 0;
                ef = Math.max(1.3, ef - 0.2);
            }

            let status: CharacterStatus = 'learning';
            if (strength >= 4) status = 'mastered';
            else if (strength >= 2) status = 'reviewing';
            else if (strength === 0 && !existing) status = 'new';

            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + interval);

            const record = {
                user_id: userId,
                script_set_id: selectedScriptId,
                character_id: char.id,
                language_code: languageCode,
                status,
                strength,
                ease_factor: ef,
                interval_days: interval,
                review_count: (existing?.review_count ?? 0) + 1,
                correct_count: (existing?.correct_count ?? 0) + (isCorrect ? 1 : 0),
                incorrect_count: (existing?.incorrect_count ?? 0) + (isCorrect ? 0 : 1),
                last_reviewed_at: now,
                next_review_at: nextReview.toISOString(),
                updated_at: now,
            };

            if (existing) {
                await (supabase as any)
                    .from('character_progress')
                    .update(record)
                    .eq('id', existing.id);
            } else {
                await (supabase as any)
                    .from('character_progress')
                    .insert(record);
            }

            newProgressMap[char.id] = {
                id: existing?.id ?? '',
                ...record,
            } as CharacterProgress;
        }

        set({ progressMap: newProgressMap });
    },

    openCharacterDetail: (character) => set({
        selectedCharacter: character,
        showCharacterDetail: true,
    }),

    closeCharacterDetail: () => set({
        selectedCharacter: null,
        showCharacterDetail: false,
    }),

    resetForNextFlashPhase: () => {
        const { practiceCharacters } = get();
        const shuffled = [...practiceCharacters];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        set({
            practiceCharacters: shuffled,
            currentIndex: 0,
            knownCharacters: [],
            unknownCharacters: [],
        });
    },

    resetPractice: () => set({
        practiceCharacters: [],
        currentIndex: 0,
        knownCharacters: [],
        unknownCharacters: [],
        sessionId: null,
        aiExercises: null,
        aiCurrentIndex: 0,
        aiAnswers: [],
        error: null,
        isGenerating: false,
        selectedLessonSetId: null,
    }),

    reset: () => set({
        selectedScriptId: null,
        loadedScript: null,
        isLoadingScript: false,
        practiceMode: 'recognition',
        characterFilter: 'all',
        practiceCount: 20,
        selectedLessonSetId: null,
        practiceCharacters: [],
        currentIndex: 0,
        knownCharacters: [],
        unknownCharacters: [],
        sessionId: null,
        aiExercises: null,
        aiCurrentIndex: 0,
        aiAnswers: [],
        isGenerating: false,
        progressMap: {},
        isLoadingProgress: false,
        selectedCharacter: null,
        showCharacterDetail: false,
        error: null,
    }),
}));
