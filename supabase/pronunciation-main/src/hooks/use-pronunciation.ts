'use client';

import { useState, useCallback } from 'react';
import type { EvaluationResult, RecordingState, ComparisonData } from '@/types/pronunciation';
import { evaluatePronunciation } from '@/lib/api';

interface UsePronunciationResult {
    state: RecordingState;
    setState: (state: RecordingState) => void;
    currentResult: EvaluationResult | null;
    previousResult: EvaluationResult | null;
    comparison: ComparisonData | null;
    submitAudio: (audio: Blob, sentenceId: string, expectedText: string) => Promise<boolean>;
    reset: () => void;
    error: string | null;
}

export function usePronunciation(): UsePronunciationResult {
    const [state, setState] = useState<RecordingState>('idle');
    const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
    const [previousResult, setPreviousResult] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const submitAudio = useCallback(
        async (audio: Blob, sentenceId: string, expectedText: string): Promise<boolean> => {
            setState('processing');
            setError(null);

            const response = await evaluatePronunciation(audio, sentenceId, expectedText);

            if (!response.success || !response.data) {
                setError(response.error || 'Evaluation failed');
                setState('error');
                return false;
            }

            // If there's a current result, move it to previous for comparison
            if (currentResult) {
                setPreviousResult(currentResult);
            }

            setCurrentResult(response.data);
            setState('done');
            return true;
        },
        [currentResult]
    );

    const reset = useCallback(() => {
        setState('idle');
        setCurrentResult(null);
        setPreviousResult(null);
        setError(null);
    }, []);

    // Calculate comparison data
    const comparison: ComparisonData | null =
        currentResult && previousResult
            ? {
                firstRun: previousResult,
                secondRun: currentResult,
                scoreDiff: currentResult.score - previousResult.score,
                improvedItems: currentResult.diffs.filter(
                    (d) =>
                        d.type === 'match' &&
                        previousResult.diffs.some(
                            (pd) => pd.position === d.position && pd.type !== 'match'
                        )
                ).length,
                regressedItems: currentResult.diffs.filter(
                    (d) =>
                        d.type !== 'match' &&
                        previousResult.diffs.some(
                            (pd) => pd.position === d.position && pd.type === 'match'
                        )
                ).length,
            }
            : null;

    return {
        state,
        setState,
        currentResult,
        previousResult,
        comparison,
        submitAudio,
        reset,
        error,
    };
}
