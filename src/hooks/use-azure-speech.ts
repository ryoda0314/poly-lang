"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface UseAzureSpeechResult {
    isListening: boolean;
    interimText: string;
    finalText: string;
    finalScore: { accuracy: number; fluency: number; prosody: number; completeness: number } | null;
    finalDetails: any[]; // Using any to avoid circular dependency or complex import, but ideally PronunciationDetailedWord[]
    startListening: () => Promise<void>;
    stopListening: () => void;
    error: string | null;
    reset: () => void;
}

interface SpeechToken {
    token: string;
    region: string;
}

export function useAzureSpeech(): UseAzureSpeechResult {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [finalScore, setFinalScore] = useState<{ accuracy: number; fluency: number; prosody: number; completeness: number } | null>(null);
    const [finalDetails, setFinalDetails] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognizerRef.current) {
                recognizerRef.current.close();
                recognizerRef.current = null;
            }
        };
    }, []);

    const getTokenOrRefresh = async (): Promise<SpeechToken> => {
        const res = await fetch('/api/speech-token');
        if (!res.ok) {
            throw new Error('Failed to fetch speech token');
        }
        return res.json();
    };

    const startListening = useCallback(async () => {
        try {
            setError(null);
            setInterimText("");
            setFinalText("");
            setFinalScore(null);
            setFinalDetails([]);

            const { token, region } = await getTokenOrRefresh();
            const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
            speechConfig.speechRecognitionLanguage = "en-US";

            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

            // Configure Pronunciation Assessment for Unscripted Speech
            const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(
                "", // Empty reference text for unscripted
                SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
                SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
                true // enableMiscue
            );
            // @ts-ignore - Enable prosody if available in types or just rely on config
            pronConfig.enableProsodyAssessment = true;
            pronConfig.applyTo(recognizer);

            recognizer.recognizing = (s, e) => {
                setInterimText(e.result.text);
            };

            recognizer.recognized = (s, e) => {
                if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                    setFinalText(prev => prev ? `${prev} ${e.result.text}` : e.result.text);

                    // Capture Score
                    try {
                        const pronResult = SpeechSDK.PronunciationAssessmentResult.fromResult(e.result);
                        if (pronResult) {
                            setFinalScore({
                                accuracy: pronResult.accuracyScore,
                                fluency: pronResult.fluencyScore,
                                prosody: pronResult.prosodyScore,
                                completeness: pronResult.completenessScore
                            });
                        }

                        // Capture Detailed Words/Phonemes from JSON
                        // Capture Detailed Words/Phonemes from JSON
                        let json = e.result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult);
                        if (!json) {
                            console.warn("SpeechServiceResponse_JsonResult not found by ID, trying string key");
                            json = e.result.properties.getProperty("SpeechServiceResponse_JsonResult");
                        }

                        if (json) {
                            console.log("Pronunciation JSON:", json); // Debug
                            const parsed = JSON.parse(json);
                            if (parsed.NBest && parsed.NBest[0] && parsed.NBest[0].Words) {
                                const newWords = parsed.NBest[0].Words.map((w: any) => ({
                                    word: w.Word,
                                    accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore,
                                    errorType: w.PronunciationAssessment?.ErrorType ?? w.ErrorType,
                                    phonemes: w.Phonemes?.map((p: any) => ({
                                        phoneme: p.Phoneme,
                                        accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? p.AccuracyScore,
                                        errorType: p.PronunciationAssessment?.ErrorType ?? p.ErrorType
                                    })) || []
                                }));
                                setFinalDetails(prev => [...prev, ...newWords]);
                            }
                        } else {
                            console.warn("No JSON result found from Azure Speech");
                        }

                    } catch (err) {
                        console.warn("Pronunciation score extract failed", err);
                    }
                }
            };

            recognizer.canceled = (s, e) => {
                if (e.reason === SpeechSDK.CancellationReason.Error) {
                    setError(`Speech Recognition Error: ${e.errorDetails}`);
                }
                stopListening();
            };

            recognizer.sessionStopped = (s, e) => {
                stopListening();
            };

            recognizer.startContinuousRecognitionAsync();
            recognizerRef.current = recognizer;
            setIsListening(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to start recording');
            setIsListening(false);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognizerRef.current) {
            recognizerRef.current.stopContinuousRecognitionAsync(() => {
                recognizerRef.current?.close();
                recognizerRef.current = null;
                setIsListening(false);
            });
        } else {
            setIsListening(false);
        }
    }, []);

    const reset = useCallback(() => {
        setInterimText("");
        setFinalText("");
        setFinalScore(null);
        setFinalDetails([]);
        setError(null);
    }, []);

    return {
        isListening,
        interimText,
        finalText,
        finalScore,
        finalDetails,
        startListening,
        stopListening,
        error,
        reset
    };
}
