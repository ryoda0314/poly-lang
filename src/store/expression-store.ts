import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type Formality = 'casual' | 'standard' | 'formal' | 'polite';

export interface TranslationSuggestion {
    text: string;
    formality: Formality;
    nuance: string;
}

export interface Expression {
    id: string;
    nativeText: string;
    suggestions: TranslationSuggestion[];
    keyPoints: string[];
    explanation: string;
    learningLanguage: string;
    nativeLanguage: string;
    timestamp: number;
}

interface ExpressionStore {
    // Current result (not saved yet)
    currentExpression: Expression | null;
    setCurrentExpression: (expression: Expression | null) => void;

    // Saved expressions
    savedExpressions: Expression[];
    saveExpression: (expression: Expression) => void;
    removeExpression: (id: string) => void;
    clearSavedExpressions: () => void;

    // Loading state
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const useExpressionStore = create<ExpressionStore>()(
    persist(
        (set) => ({
            // Current result
            currentExpression: null,
            setCurrentExpression: (expression) => set({ currentExpression: expression }),

            // Saved expressions
            savedExpressions: [],
            saveExpression: (expression) => {
                set((state) => {
                    // Don't add duplicates
                    if (state.savedExpressions.some(e => e.id === expression.id)) {
                        return state;
                    }
                    return {
                        savedExpressions: [expression, ...state.savedExpressions],
                        currentExpression: null,
                    };
                });
            },
            removeExpression: (id) => {
                set((state) => ({
                    savedExpressions: state.savedExpressions.filter(e => e.id !== id),
                }));
            },
            clearSavedExpressions: () => set({ savedExpressions: [] }),

            // Loading
            isLoading: false,
            setIsLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'poly-expressions',
            partialize: (state) => ({
                savedExpressions: state.savedExpressions,
            }),
        }
    )
);
