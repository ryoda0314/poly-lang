'use client';

import { motion } from 'framer-motion';
import { Mic, Square, Send, RotateCcw, Loader2, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { Sentence, RecordingState } from '@/types/pronunciation';
import { Button } from '@/components/ui/button';
import { AudioVisualizer } from './audio-visualizer';

interface RecorderPanelProps {
    sentence: Sentence | null;
    recordingState: RecordingState;
    audioLevel: number;
    audioBlob: Blob | null;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSubmit: () => void;
    onReset: () => void;
    error?: string | null;
}

export function RecorderPanel({
    sentence,
    recordingState,
    audioLevel,
    audioBlob,
    onStartRecording,
    onStopRecording,
    onSubmit,
    onReset,
    error,
}: RecorderPanelProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (sentence?.text) {
            await navigator.clipboard.writeText(sentence.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [sentence?.text]);

    const isRecording = recordingState === 'recording';
    const isProcessing = recordingState === 'processing';
    const hasRecording = audioBlob !== null;

    if (!sentence) {
        return (
            <div className="h-full flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div
                        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--card)', border: '2px dashed var(--border)' }}
                    >
                        <Mic className="w-10 h-10" style={{ color: 'var(--foreground-muted)' }} />
                    </div>
                    <h3 className="font-display text-xl mb-2">Select a Sentence</h3>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Choose a practice sentence from the list to begin
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            {/* Sentence display */}
            <motion.div
                key={sentence.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl text-center mb-8"
            >
                <div className="relative group">
                    <p className="font-display text-2xl md:text-3xl leading-relaxed">
                        {sentence.text}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Copy sentence"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <p className="text-sm mt-3" style={{ color: 'var(--foreground-muted)' }}>
                    {sentence.category} • {sentence.difficulty}
                </p>
            </motion.div>

            {/* Audio visualizer / Recording indicator */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <AudioVisualizer audioLevel={audioLevel} isRecording={isRecording} />
            </motion.div>

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-4"
            >
                {/* Main recording button */}
                {!hasRecording && !isProcessing && (
                    <Button
                        size="lg"
                        onClick={isRecording ? onStopRecording : onStartRecording}
                        className={`h-14 px-8 rounded-full font-medium transition-all ${isRecording
                                ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] animate-recording'
                                : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                            }`}
                    >
                        {isRecording ? (
                            <>
                                <Square className="w-5 h-5 mr-2" />
                                Stop Recording
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5 mr-2" />
                                Start Recording
                            </>
                        )}
                    </Button>
                )}

                {/* After recording: Submit or Reset */}
                {hasRecording && !isProcessing && (
                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={onReset}
                            className="h-14 px-6 rounded-full"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Re-record
                        </Button>
                        <Button
                            size="lg"
                            onClick={onSubmit}
                            className="h-14 px-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
                        >
                            <Send className="w-5 h-5 mr-2" />
                            Evaluate
                        </Button>
                    </div>
                )}

                {/* Processing state */}
                {isProcessing && (
                    <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing your pronunciation...</span>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-lg text-center max-w-md"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    >
                        <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Keyboard hint */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-xs"
                style={{ color: 'var(--foreground-muted)' }}
            >
                Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--card)] mx-1">Space</kbd> to
                {isRecording ? ' stop' : ' start'} recording
            </motion.p>
        </div>
    );
}
