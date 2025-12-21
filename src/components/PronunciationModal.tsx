"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic } from 'lucide-react';
import { usePronunciation } from '@/hooks/use-pronunciation';
import { RecorderPanel } from './pronunciation/RecorderPanel';
import { ResultPanel } from './pronunciation/ResultPanel';
import { AudioVisualizer } from './pronunciation/AudioVisualizer';

interface PronunciationModalProps {
    isOpen: boolean;
    onClose: () => void;
    phraseText: string;
    phraseId: string;
}

export function PronunciationModal({ isOpen, onClose, phraseText, phraseId }: PronunciationModalProps) {
    const { state, currentResult, submitAudio, reset, error } = usePronunciation();
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Audio Level for Visualizer
    const [audioLevel, setAudioLevel] = useState(0);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            reset();
        } else {
            // Cleanup on close
            stopMedia();
        }
    }, [isOpen, reset]);

    const stopMedia = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        audioContextRef.current = null;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);

            // Setup Visualizer
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            const updateLevel = () => {
                analyzer.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(avg * 2); // Boost a bit
                rafRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();

            // Setup Recorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await submitAudio(blob, phraseId, phraseText);
                stopMedia();
            };

            mediaRecorder.start();

        } catch (err) {
            console.error("Mic Error:", err);
            // alert("Could not access microphone."); 
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    width: '90%', maxWidth: '500px', height: '600px',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mic size={18} color="var(--color-accent)" /> Pronunciation
                    </span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {!currentResult ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Inject Visualizer into RecorderPanel Logic manually since we separated them */}
                            {/* Actually RecorderPanel is pure UI now. */}
                            <RecorderPanel
                                text={phraseText}
                                recordingState={state}
                                onStartRecording={startRecording}
                                onStopRecording={stopRecording}
                                error={error}
                                audioLevel={audioLevel}
                            />
                        </div>
                    ) : (
                        <ResultPanel
                            result={currentResult}
                            onRetry={reset}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
