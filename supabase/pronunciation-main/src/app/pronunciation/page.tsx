'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LetterText, AudioWaveform } from 'lucide-react';
import type { Sentence, EvaluationMode, PhonemeEvaluationResult } from '@/types/pronunciation';
import { sentences } from '@/data/sentences';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { usePronunciation } from '@/hooks/use-pronunciation';
import { evaluatePronunciationPhoneme } from '@/lib/api';
import { SentenceList } from '@/components/pronunciation/sentence-list';
import { RecorderPanel } from '@/components/pronunciation/recorder-panel';
import { ResultPanel } from '@/components/pronunciation/result-panel';
import { PhonemeResultPanel } from '@/components/pronunciation/phoneme-result-panel';

export default function PronunciationPage() {
    const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
    const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('word');
    const [phonemeResult, setPhonemeResult] = useState<PhonemeEvaluationResult | null>(null);

    const {
        state: recorderState,
        audioBlob,
        audioLevel,
        startRecording,
        stopRecording,
        resetRecording,
        error: recorderError,
    } = useAudioRecorder();

    const {
        state: pronunciationState,
        setState: setPronunciationState,
        currentResult,
        previousResult,
        comparison,
        submitAudio,
        reset: resetPronunciation,
        error: pronunciationError,
    } = usePronunciation();

    // Combine states for display
    const displayState = pronunciationState === 'processing' ? 'processing' : recorderState;

    // Handle sentence selection
    const handleSelectSentence = useCallback((sentence: Sentence) => {
        setSelectedSentence(sentence);
        resetRecording();
        resetPronunciation();
        setPhonemeResult(null);
    }, [resetRecording, resetPronunciation]);

    // Handle mode change
    const handleModeChange = useCallback((mode: EvaluationMode) => {
        setEvaluationMode(mode);
        resetRecording();
        resetPronunciation();
        setPhonemeResult(null);
    }, [resetRecording, resetPronunciation]);

    // Handle audio submission
    const handleSubmit = useCallback(async () => {
        if (!audioBlob || !selectedSentence) return;

        setPronunciationState('processing');

        if (evaluationMode === 'phoneme') {
            // Phoneme-level evaluation
            const response = await evaluatePronunciationPhoneme(
                audioBlob,
                selectedSentence.id,
                selectedSentence.text
            );

            if (response.success && response.data) {
                setPhonemeResult(response.data);
                toast.success('Phoneme analysis complete!', {
                    description: 'Check your detailed pronunciation breakdown.',
                });
                resetRecording();
            } else {
                toast.error('Phoneme evaluation failed', {
                    description: response.error || 'Please try again.',
                });
            }
            setPronunciationState('idle');
        } else {
            // Word-level evaluation (existing flow)
            const success = await submitAudio(audioBlob, selectedSentence.id, selectedSentence.text);

            if (success) {
                toast.success('Pronunciation evaluated!', {
                    description: 'Check your score and feedback on the right.',
                });
                resetRecording();
            } else {
                toast.error('Evaluation failed', {
                    description: pronunciationError || 'Please try again.',
                });
            }
        }
    }, [audioBlob, selectedSentence, evaluationMode, submitAudio, setPronunciationState, resetRecording, pronunciationError]);

    // Handle retry
    const handleRetry = useCallback(() => {
        resetRecording();
        setPhonemeResult(null);
    }, [resetRecording]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && selectedSentence) {
                if (document.activeElement?.tagName === 'INPUT') return;

                e.preventDefault();
                if (recorderState === 'recording') {
                    stopRecording();
                } else if (recorderState === 'idle' && !audioBlob) {
                    startRecording();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSentence, recorderState, audioBlob, startRecording, stopRecording]);

    // Show recorder error as toast
    useEffect(() => {
        if (recorderError) {
            toast.error('Recording error', { description: recorderError });
        }
    }, [recorderError]);

    return (
        <div className="h-[calc(100vh-4rem)]">
            {/* Mode Toggle */}
            <div
                className="flex justify-center py-3 border-b"
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
            >
                <div
                    className="inline-flex rounded-full p-1"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                    <button
                        onClick={() => handleModeChange('word')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${evaluationMode === 'word'
                                ? 'bg-[var(--primary)] text-white'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            }`}
                    >
                        <LetterText className="w-4 h-4" />
                        Word Level
                    </button>
                    <button
                        onClick={() => handleModeChange('phoneme')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${evaluationMode === 'phoneme'
                                ? 'bg-[var(--primary)] text-white'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            }`}
                    >
                        <AudioWaveform className="w-4 h-4" />
                        Phoneme Level
                    </button>
                </div>
            </div>

            <div className="h-[calc(100%-3.5rem)] grid grid-cols-1 lg:grid-cols-[320px_1fr_380px] gap-0">
                {/* Left: Sentence List */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="hidden lg:block border-r overflow-hidden"
                    style={{ borderColor: 'var(--border)', background: 'var(--background-elevated)' }}
                >
                    <SentenceList
                        sentences={sentences}
                        selectedId={selectedSentence?.id || null}
                        onSelect={handleSelectSentence}
                    />
                </motion.aside>

                {/* Center: Recorder */}
                <motion.main
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="overflow-hidden"
                >
                    {/* Mobile sentence selector */}
                    <div className="lg:hidden p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <select
                            value={selectedSentence?.id || ''}
                            onChange={(e) => {
                                const sentence = sentences.find((s) => s.id === e.target.value);
                                if (sentence) handleSelectSentence(sentence);
                            }}
                            className="w-full p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
                        >
                            <option value="">Select a sentence...</option>
                            {sentences.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.text.slice(0, 50)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    <RecorderPanel
                        sentence={selectedSentence}
                        recordingState={displayState}
                        audioLevel={audioLevel}
                        audioBlob={audioBlob}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onSubmit={handleSubmit}
                        onReset={resetRecording}
                        error={recorderError || pronunciationError}
                    />
                </motion.main>

                {/* Right: Results */}
                <motion.aside
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="hidden lg:block border-l overflow-hidden"
                    style={{ borderColor: 'var(--border)', background: 'var(--background-elevated)' }}
                >
                    <AnimatePresence mode="wait">
                        {evaluationMode === 'phoneme' ? (
                            <motion.div
                                key="phoneme"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full"
                            >
                                <PhonemeResultPanel
                                    result={phonemeResult}
                                    onRetry={handleRetry}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="word"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full"
                            >
                                <ResultPanel
                                    result={currentResult}
                                    comparison={comparison}
                                    onRetry={handleRetry}
                                    isSecondAttempt={previousResult !== null}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.aside>
            </div>

            {/* Mobile results (bottom sheet style) */}
            <AnimatePresence>
                {(currentResult || phonemeResult) && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="lg:hidden fixed inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl"
                        style={{ background: 'var(--background-elevated)', borderTop: '1px solid var(--border)' }}
                    >
                        <div className="w-12 h-1 rounded-full bg-[var(--border)] mx-auto mt-3" />
                        {evaluationMode === 'phoneme' ? (
                            <PhonemeResultPanel
                                result={phonemeResult}
                                onRetry={handleRetry}
                            />
                        ) : (
                            <ResultPanel
                                result={currentResult}
                                comparison={comparison}
                                onRetry={handleRetry}
                                isSecondAttempt={previousResult !== null}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
