"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import type { RecordingState, AzurePronunciationScore, AzureWordResult } from '@/types/pronunciation';

export interface SpeakingResult {
    recognizedText: string;
    scores: AzurePronunciationScore | null;
    words: AzureWordResult[];
    mode: 'scripted' | 'freeform';
    runId: string | null;
    durationSeconds: number;
}

export interface UseSpeakingPronunciationResult {
    state: RecordingState;
    result: SpeakingResult | null;
    startScripted: (expectedText: string) => Promise<void>;
    startFreeform: () => Promise<void>;
    stop: () => void;
    cancel: () => void;
    error: string | null;
}

async function fetchSpeechToken(): Promise<{ token: string; region: string; runId: string }> {
    const res = await fetch('/api/pronunciation/evaluate-azure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phraseId: 'speaking', expectedText: 'speaking-session' }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export function useSpeakingPronunciation(): UseSpeakingPronunciationResult {
    const [state, setState] = useState<RecordingState>('idle');
    const [result, setResult] = useState<SpeakingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
    const modeRef = useRef<'scripted' | 'freeform'>('freeform');
    const runIdRef = useRef<string | null>(null);
    const recordingStartRef = useRef<number>(0);
    const pendingRef = useRef<{
        recognizedText: string;
        scores: AzurePronunciationScore | null;
        words: AzureWordResult[];
    } | null>(null);

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
    }, []);

    const startRecognition = useCallback(async (expectedText: string | null) => {
        setError(null);
        setResult(null);
        modeRef.current = expectedText ? 'scripted' : 'freeform';

        try {
            const { token, region, runId } = await fetchSpeechToken();
            runIdRef.current = runId;

            const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
            speechConfig.speechRecognitionLanguage = 'en-US';

            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

            // Always apply pronunciation assessment.
            // Scripted: use expected text as reference (enableMiscue=true for omission/insertion detection)
            // Freeform: empty reference → Azure scores phoneme accuracy of what was actually spoken
            const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(
                expectedText ?? '',
                SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
                SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
                !!expectedText, // enableMiscue only when reference text exists
            );
            pronConfig.enableProsodyAssessment = true;
            pronConfig.applyTo(recognizer);

            pendingRef.current = {
                recognizedText: '',
                scores: null,
                words: [],
            };

            recognizer.recognized = (_, e) => {
                if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && pendingRef.current) {
                    const seg = e.result.text || '';
                    if (seg) {
                        pendingRef.current.recognizedText = pendingRef.current.recognizedText
                            ? pendingRef.current.recognizedText + ' ' + seg
                            : seg;
                    }

                    const pronResult = SpeechSDK.PronunciationAssessmentResult.fromResult(e.result);
                    if (pronResult.pronunciationScore > 0 || pronResult.accuracyScore > 0) {
                        pendingRef.current.scores = {
                            accuracy: pronResult.accuracyScore ?? 0,
                            fluency: pronResult.fluencyScore ?? 0,
                            prosody: pronResult.prosodyScore ?? 0,
                            completeness: pronResult.completenessScore ?? 0,
                            overall: pronResult.pronunciationScore ?? 0,
                        };
                    }

                    const json = e.result.properties.getProperty(
                        SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
                    );
                    if (json) {
                        try {
                            const parsed = JSON.parse(json);
                            const nBest = parsed?.NBest?.[0];
                            if (nBest?.Words) {
                                const segWords = nBest.Words.map((w: any) => ({
                                    word: w.Word,
                                    accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                                    errorType: (w.PronunciationAssessment?.ErrorType ?? 'None') as any,
                                    phonemes: (w.Phonemes ?? []).map((p: any) => ({
                                        phoneme: p.Phoneme,
                                        accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? 0,
                                        errorType: p.PronunciationAssessment?.ErrorType,
                                    })),
                                }));
                                // Append words from each segment
                                pendingRef.current.words = [...pendingRef.current.words, ...segWords];
                            }
                        } catch { /* ignore */ }
                    }
                }
            };

            recognizer.canceled = (_, e) => {
                if (e.reason === SpeechSDK.CancellationReason.Error) {
                    setError(e.errorDetails || 'Recognition canceled');
                    try { recognizerRef.current?.close(); } catch { /* */ }
                    recognizerRef.current = null;
                    pendingRef.current = null;
                    setState('error');
                }
            };

            recognizer.startContinuousRecognitionAsync(
                () => {},
                () => {
                    setError('Failed to start recording');
                    setState('error');
                },
            );
            recognizerRef.current = recognizer;
            recordingStartRef.current = Date.now();
            setState('recording');
        } catch (err: any) {
            setError(err.message || 'Failed to start');
            setState('error');
        }
    }, []);

    const startScripted = useCallback(async (expectedText: string) => {
        await startRecognition(expectedText);
    }, [startRecognition]);

    const startFreeform = useCallback(async () => {
        await startRecognition(null);
    }, [startRecognition]);

    const stop = useCallback(() => {
        if (!recognizerRef.current) return;
        setState('processing');

        recognizerRef.current.stopContinuousRecognitionAsync(
            () => {
                try { recognizerRef.current?.close(); } catch { /* */ }
                recognizerRef.current = null;

                const pending = pendingRef.current;
                pendingRef.current = null;

                if (!pending?.recognizedText) {
                    setError('No speech detected. Try again.');
                    setState('error');
                    return;
                }

                const durationSeconds = recordingStartRef.current
                    ? Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
                    : 0;

                setResult({
                    recognizedText: pending.recognizedText,
                    scores: pending.scores,
                    words: pending.words,
                    mode: modeRef.current,
                    runId: runIdRef.current,
                    durationSeconds,
                });
                setState('done');
            },
            () => {
                try { recognizerRef.current?.close(); } catch { /* */ }
                recognizerRef.current = null;
                pendingRef.current = null;
                setError('Failed to stop recording');
                setState('error');
            },
        );
    }, []);

    return { state, result, startScripted, startFreeform, stop, cancel, error };
}
