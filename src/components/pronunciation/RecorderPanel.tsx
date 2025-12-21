"use client";

import { motion } from 'framer-motion';
import { Mic, Square, Loader2, RefreshCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { RecordingState } from '@/types/pronunciation';
import { AudioVisualizer } from './AudioVisualizer';

interface RecorderPanelProps {
    text: string;
    recordingState: RecordingState;
    onStartRecording: () => void;
    onStopRecording: () => void;
    error: string | null;
    audioLevel: number;
}

export function RecorderPanel({ text, recordingState, onStartRecording, onStopRecording, error, audioLevel }: RecorderPanelProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '2rem', padding: '2rem', textAlign: 'center' }}>
            {/* Target Text */}
            <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', lineHeight: 1.4, color: 'var(--color-fg)' }}
            >
                {text}
            </motion.h3>

            {/* Visualizer Area */}
            <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AudioVisualizer audioLevel={audioLevel} isRecording={recordingState === 'recording'} />
            </div>

            {/* Controls */}
            <div style={{ position: 'relative' }}>
                {/* Ripple Effect when recording */}
                {recordingState === 'recording' && (
                    <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: '#ef4444', borderRadius: '50%', zIndex: 0
                        }}
                    />
                )}

                {recordingState === 'processing' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-fg-muted)' }}>
                        <Loader2 className="animate-spin" /> Analyzing...
                    </div>
                ) : recordingState === 'recording' ? (
                    <button
                        onClick={onStopRecording}
                        style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: '#ef4444', color: 'white',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                            position: 'relative', zIndex: 1,
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Square fill="currentColor" size={28} />
                    </button>
                ) : (
                    <button
                        onClick={onStartRecording}
                        style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'var(--color-accent)', color: 'white',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px var(--shadow-color)',
                            position: 'relative', zIndex: 1,
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Mic size={32} />
                    </button>
                )}
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: '#ef4444', fontSize: '0.9rem', background: '#fee2e2', padding: '0.5rem 1rem', borderRadius: '8px' }}
                >
                    {error}
                </motion.div>
            )}

            <p style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)' }}>
                {recordingState === 'recording' ? 'Recording in progress...' : 'Click microphone to start speaking'}
            </p>
        </div>
    );
}
