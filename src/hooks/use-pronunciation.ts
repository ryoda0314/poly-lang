"use client";

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supa-client';
import type { EvaluationResult, RecordingState, ComparisonData, EvaluateResponse } from '@/types/pronunciation';

interface UsePronunciationResult {
    state: RecordingState;
    setState: (state: RecordingState) => void;
    currentResult: EvaluationResult | null;
    previousResult: EvaluationResult | null;
    comparison: ComparisonData | null;
    submitAudio: (audio: Blob, phraseId: string, expectedText: string) => Promise<boolean>;
    reset: () => void;
    error: string | null;
}

export function usePronunciation(): UsePronunciationResult {
    const [state, setState] = useState<RecordingState>('idle');
    const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
    const [previousResult, setPreviousResult] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const submitAudio = useCallback(
        async (audio: Blob, phraseId: string, expectedText: string): Promise<boolean> => {
            setState('processing');
            setError(null);

            try {
                // 1. Call Analysis API
                const formData = new FormData();
                formData.append('audio', audio, 'recording.webm');
                formData.append('expectedText', expectedText);

                const res = await fetch('/api/pronunciation/evaluate', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Evaluation failed');
                }

                const data: EvaluateResponse = await res.json();
                if (!data.data) throw new Error('No data received');

                const result = data.data;

                // 2. Save to Supabase (Client-side to use Auth context)
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData.session) {
                    const { error: dbError } = await supabase.from('pronunciation_runs').insert({
                        phrase_id: phraseId,
                        user_id: sessionData.session.user.id,
                        expected_text: result.expectedText,
                        asr_text: result.asrText,
                        score: result.score,
                        diffs: result.diffs as any,
                        feedback: result.feedback,
                        device_info: { userAgent: navigator.userAgent }
                    });

                    if (dbError) {
                        console.error("Failed to save run:", dbError);
                        // We don't block the UI for this error, just log it
                    }
                }

                // 3. Update State
                if (currentResult) {
                    setPreviousResult(currentResult);
                }
                setCurrentResult(result);
                setState('done');
                return true;

            } catch (e: any) {
                console.error(e);
                setError(e.message);
                setState('error');
                return false;
            }
        },
        [currentResult, supabase]
    );

    const reset = useCallback(() => {
        setState('idle');
        setCurrentResult(null);
        setPreviousResult(null);
        setError(null);
    }, []);

    // Comparison logic
    const comparison: ComparisonData | null =
        currentResult && previousResult
            ? {
                firstRun: previousResult,
                secondRun: currentResult,
                scoreDiff: currentResult.score - previousResult.score,
                improvedItems: currentResult.diffs.filter(d => d.type === 'match' && previousResult.diffs.some(pd => pd.position === d.position && pd.type !== 'match')).length,
                regressedItems: currentResult.diffs.filter(d => d.type !== 'match' && previousResult.diffs.some(pd => pd.position === d.position && pd.type === 'match')).length,
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
