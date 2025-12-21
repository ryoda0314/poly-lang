"use client";
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
    onStop: (blob: Blob) => void;
}

export function useAudioRecorder({ onStop }: UseAudioRecorderOptions) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopResources = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopResources();
    }, [stopResources]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Audio Level Setup
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyzer);

            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            const updateLevel = () => {
                analyzer.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((src, a) => src + a, 0) / dataArray.length;
                setAudioLevel(avg * 2);
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();

            // Recorder Setup
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onStop(blob);
                // Note: We stop resources here, but usually it's good to keep stream active? 
                // No, standard behavior is stop microhpone when not recording to save battery/privacy.
                stopResources();
                setIsRecording(false);
                setAudioLevel(0);
            };

            mediaRecorder.start();
            setIsRecording(true);

        } catch (err: any) {
            console.error(err);
            setError("Could not access microphone.");
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return {
        isRecording,
        audioLevel,
        startRecording,
        stopRecording,
        error
    };
}
