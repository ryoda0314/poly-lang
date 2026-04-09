'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingState } from '@/types/pronunciation';

interface UseAudioRecorderResult {
    state: RecordingState;
    audioBlob: Blob | null;
    audioUrl: string | null;
    audioLevel: number;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    resetRecording: () => void;
    error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderResult {
    const [state, setState] = useState<RecordingState>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        analyserRef.current = null;
        mediaRecorderRef.current = null;
        setAudioLevel(0);
    }, []);

    // Analyze audio levels for visualization
    const analyzeAudioLevel = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (root mean square) for a more accurate volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalizedLevel = Math.min(rms / 128, 1); // Normalize to 0-1

        setAudioLevel(normalizedLevel);

        if (state === 'recording') {
            animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
        }
    }, [state]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            setError(null);
            cleanup();
            chunksRef.current = [];

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            streamRef.current = stream;

            // Set up audio analysis
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            // Set up MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                cleanup();
            };

            mediaRecorder.onerror = () => {
                setError('Recording failed. Please try again.');
                setState('error');
                cleanup();
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setState('recording');

            // Start audio level analysis
            animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
        } catch (err) {
            const message =
                err instanceof DOMException && err.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow microphone access in your browser settings.'
                    : err instanceof Error
                        ? err.message
                        : 'Failed to start recording';

            setError(message);
            setState('error');
            cleanup();
        }
    }, [cleanup, analyzeAudioLevel]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.stop();
            setState('idle');
        }
    }, [state]);

    // Reset recording
    const resetRecording = useCallback(() => {
        cleanup();
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setError(null);
        setState('idle');
    }, [cleanup, audioUrl]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [cleanup, audioUrl]);

    return {
        state,
        audioBlob,
        audioUrl,
        audioLevel,
        startRecording,
        stopRecording,
        resetRecording,
        error,
    };
}
