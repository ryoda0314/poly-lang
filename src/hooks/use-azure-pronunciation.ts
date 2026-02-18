"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { useHistoryStore } from '@/store/history-store';
import { TRACKING_EVENTS } from '@/lib/tracking_constants';
import type { RecordingState, AzureEvaluationResult } from '@/types/pronunciation';

export interface UseAzurePronunciationResult {
    state: RecordingState;
    setState: (s: RecordingState) => void;
    currentResult: AzureEvaluationResult | null;
    previousResult: AzureEvaluationResult | null;
    startEvaluation: (phraseId: string, expectedText: string) => Promise<void>;
    stopEvaluation: () => void;
    cancel: () => void;
    reset: () => void;
    error: string | null;
    audioLevel: number;
}

/**
 * Pronunciation assessment hook using Azure Speech SDK.
 * Uses the same pattern as CorrectionSidebar (use-azure-speech.ts):
 *   fromDefaultMicrophoneInput() + startContinuousRecognitionAsync / stopContinuousRecognitionAsync
 */
export function useAzurePronunciation(): UseAzurePronunciationResult {
    const [state, setState] = useState<RecordingState>('idle');
    const [currentResult, setCurrentResult] = useState<AzureEvaluationResult | null>(null);
    const [previousResult, setPreviousResult] = useState<AzureEvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const { logEvent } = useHistoryStore();

    const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

    const pendingRef = useRef<{
        runId: string;
        phraseId: string;
        expectedText: string;
        words: Array<{
            word: string;
            accuracyScore: number;
            errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
            phonemes: Array<{ phoneme: string; accuracyScore: number; errorType?: string }>;
        }>;
        scores: { accuracy: number; fluency: number; prosody: number; completeness: number; overall: number } | null;
        recognizedText: string;
    } | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognizerRef.current) {
                try { recognizerRef.current.close(); } catch { /* */ }
                recognizerRef.current = null;
            }
        };
    }, []);

    const cancel = useCallback(() => {
        if (recognizerRef.current) {
            recognizerRef.current.stopContinuousRecognitionAsync(
                () => {
                    try { recognizerRef.current?.close(); } catch { /* */ }
                    recognizerRef.current = null;
                },
                () => {
                    try { recognizerRef.current?.close(); } catch { /* */ }
                    recognizerRef.current = null;
                },
            );
        }
        pendingRef.current = null;
        setState('idle');
        setAudioLevel(0);
    }, []);

    const startEvaluation = useCallback(async (phraseId: string, expectedText: string): Promise<void> => {
        setError(null);

        try {
            // Step 1: Consume credit + get speech token
            const prepareRes = await fetch('/api/pronunciation/evaluate-azure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phraseId, expectedText }),
            });

            if (!prepareRes.ok) {
                const errData = await prepareRes.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(errData.error || `HTTP ${prepareRes.status}`);
            }

            const { token, region, runId } = await prepareRes.json();

            // Step 2: Setup Azure Speech SDK — SAME as CorrectionSidebar (use-azure-speech.ts)
            const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
            speechConfig.speechRecognitionLanguage = 'en-US';

            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

            // Configure pronunciation assessment (scripted mode)
            const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(
                expectedText,
                SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
                SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
                true,
            );
            pronConfig.enableProsodyAssessment = true;
            pronConfig.applyTo(recognizer);

            // Initialize pending result collector
            pendingRef.current = {
                runId,
                phraseId,
                expectedText,
                words: [],
                scores: null,
                recognizedText: '',
            };

            // Event: recognizing — log interim results
            recognizer.recognizing = (_, e) => {
                // Use text length as rough audio level indicator
                setAudioLevel(Math.min(255, (e.result.text?.length || 0) * 20));
            };

            // Event: recognized — collect scores and words
            recognizer.recognized = (_, e) => {
                if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && pendingRef.current) {
                    const pronResult = SpeechSDK.PronunciationAssessmentResult.fromResult(e.result);
                    const scores = {
                        accuracy: pronResult.accuracyScore ?? 0,
                        fluency: pronResult.fluencyScore ?? 0,
                        prosody: pronResult.prosodyScore ?? 0,
                        completeness: pronResult.completenessScore ?? 0,
                        overall: pronResult.pronunciationScore ?? 0,
                    };
                    pendingRef.current.scores = scores;
                    pendingRef.current.recognizedText = e.result.text || '';

                    // Extract word/phoneme details from JSON
                    const json = e.result.properties.getProperty(
                        SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
                    );
                    if (json) {
                        try {
                            const parsed = JSON.parse(json);
                            const nBest = parsed?.NBest?.[0];
                            if (nBest?.Words) {
                                pendingRef.current.words = nBest.Words.map((w: any) => ({
                                    word: w.Word,
                                    accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                                    errorType: (w.PronunciationAssessment?.ErrorType ?? 'None') as 'None' | 'Omission' | 'Insertion' | 'Mispronunciation',
                                    phonemes: (w.Phonemes ?? []).map((p: any) => ({
                                        phoneme: p.Phoneme,
                                        accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? 0,
                                        errorType: p.PronunciationAssessment?.ErrorType,
                                    })),
                                }));
                            }
                        } catch { /* ignore parse error */ }
                    }
                }
            };

            // Event: canceled — handle errors
            recognizer.canceled = (_, e) => {
                if (e.reason === SpeechSDK.CancellationReason.Error) {
                    setError(e.errorDetails || 'Recognition canceled');
                    try { recognizerRef.current?.close(); } catch { /* */ }
                    recognizerRef.current = null;
                    pendingRef.current = null;
                    setState('error');
                }
            };

            // Step 3: Start continuous recognition (same as CorrectionSidebar)
            recognizer.startContinuousRecognitionAsync(
                () => {},
                () => {
                    setError('Failed to start recording');
                    setState('error');
                },
            );
            recognizerRef.current = recognizer;
            setState('recording');

        } catch (err: any) {
            setError(err.message || 'Evaluation failed');
            setState('error');
        }
    }, []);

    const stopEvaluation = useCallback(() => {
        if (!recognizerRef.current) return;

        setState('processing');
        setAudioLevel(0);

        recognizerRef.current.stopContinuousRecognitionAsync(
            () => {
                try { recognizerRef.current?.close(); } catch { /* */ }
                recognizerRef.current = null;

                const pending = pendingRef.current;
                pendingRef.current = null;

                if (!pending?.scores) {
                    setError('No speech recognized. Please speak clearly.');
                    setState('error');
                    return;
                }

                const { scores, words, expectedText, recognizedText, runId, phraseId } = pending;
                const pronounScore = scores.overall;

                let feedback = '';
                if (pronounScore >= 90) {
                    feedback = 'Excellent! Your pronunciation is very clear and accurate.';
                } else if (pronounScore >= 75) {
                    feedback = 'Good pronunciation! Focus on the highlighted phonemes for improvement.';
                } else if (pronounScore >= 50) {
                    feedback = 'Keep practicing. Pay attention to the red-highlighted sounds.';
                } else {
                    feedback = 'Try speaking more slowly and clearly. Listen to native pronunciation for reference.';
                }

                const weakPhonemes = words
                    .flatMap(w => w.phonemes)
                    .filter(p => p.accuracyScore < 60)
                    .map(p => p.phoneme);
                if (weakPhonemes.length > 0) {
                    const unique = [...new Set(weakPhonemes)].slice(0, 3);
                    feedback += ` Focus on: ${unique.map(p => `/${p}/`).join(', ')}`;
                }

                const evalResult: AzureEvaluationResult = {
                    runId,
                    scores,
                    words,
                    expectedText,
                    recognizedText,
                    feedback,
                    createdAt: new Date().toISOString(),
                };

                // Save results to DB (fire and forget)
                fetch('/api/pronunciation/save-result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ runId, phraseId, expectedText, recognizedText, scores, words, feedback }),
                }).catch(err => console.error('Failed to save result:', err));

                setCurrentResult(prev => {
                    if (prev) setPreviousResult(prev);
                    return evalResult;
                });
                setState('done');

                logEvent(TRACKING_EVENTS.PRONUNCIATION_CHECK, Math.round(pronounScore), {
                    phraseId,
                    accuracy: scores.accuracy,
                    fluency: scores.fluency,
                    completeness: scores.completeness,
                    prosody: scores.prosody,
                });
            },
            () => {
                try { recognizerRef.current?.close(); } catch { /* */ }
                recognizerRef.current = null;
                pendingRef.current = null;
                setError('Failed to stop recording');
                setState('error');
            },
        );
    }, [logEvent]);

    const reset = useCallback(() => {
        cancel();
        setState('idle');
        setCurrentResult(null);
        setPreviousResult(null);
        setError(null);
    }, [cancel]);

    return {
        state,
        setState,
        currentResult,
        previousResult,
        startEvaluation,
        stopEvaluation,
        cancel,
        reset,
        error,
        audioLevel,
    };
}
