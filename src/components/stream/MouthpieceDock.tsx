"use client";

import React, { useEffect, useState } from "react";
import { useStreamStore } from "./store";
import { Mic, Lock, Send, StopCircle } from "lucide-react";
import { useAzureSpeech } from "@/hooks/use-azure-speech";
import { CorrectionData } from "@/types/stream";

export default function MouthpieceDock() {
    const {
        selectedSid,
        streamItems,
        addStreamItem,
        setVoiceState,
        voiceState
    } = useStreamStore();

    const {
        isListening,
        interimText,
        finalText,
        finalScore,
        startListening,
        stopListening,
        reset,
        error
    } = useAzureSpeech();

    const [isProcessing, setIsProcessing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Auto-scroll or UI feedback for interim text could be handled here or in StreamCanvas
    // For now, let's just show interim text in the dock

    const handleToggle = async () => {
        if (isListening) {
            stopListening();
        } else {
            reset();
            setFetchError(null);
            await startListening();
        }
    };

    // Auto-submit when listening stops and we have text
    useEffect(() => {
        const submit = async () => {
            if (!isListening && finalText && !isProcessing) {
                setIsProcessing(true);
                setFetchError(null);

                // 1. Add User Speech to Stream
                addStreamItem({
                    kind: "user-speech",
                    text: finalText,
                    score: finalScore || undefined
                });

                try {
                    // 2. Call Correction API
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

                    const res = await fetch('/api/correction', {
                        method: 'POST',
                        body: JSON.stringify({ text: finalText }),
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || `Error ${res.status}`);
                    }

                    const data: CorrectionData = await res.json();

                    // 3. Add Correction to Stream
                    addStreamItem({
                        kind: "correction",
                        data
                    });

                } catch (e: any) {
                    console.error(e);
                    setFetchError(e.message || "Failed to getting correction");
                    // Add correction item with error content?
                } finally {
                    setIsProcessing(false);
                    reset();
                }
            }
        };

        if (!isListening && finalText) {
            submit();
        }
    }, [isListening, finalText, finalScore, addStreamItem, reset, isProcessing]);

    // Determine current display text
    const displayText = isListening ? (interimText || "Listening...") : (isProcessing ? "Analyzing..." : "Tap mic to speak");

    return (
        <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            padding: "var(--space-4)",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
        }}>
            <div style={{ textAlign: "center", minHeight: '2.5em' }}>
                <div style={{ fontWeight: 600, fontSize: "1.1rem", color: isListening ? 'var(--color-accent)' : 'inherit' }}>
                    {displayText}
                </div>
                {finalText && isListening && (
                    <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", opacity: 0.6 }}>
                        {finalText}
                    </div>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-4)" }}>
                <button
                    onClick={handleToggle}
                    disabled={isProcessing}
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: "none",
                        background: isListening ? "var(--color-destructive)" : "var(--color-fg)",
                        color: "var(--color-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        opacity: isProcessing ? 0.5 : 1
                    }}
                >
                    {isListening ? (
                        <StopCircle size={32} />
                    ) : (
                        <Mic size={32} />
                    )}
                </button>
            </div>

            {/* Mock Button for Testing */}
            <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
                <button onClick={() => {
                    const { MOCK_CORRECTION_DATA, MOCK_SCORE } = require('./mock/correction');
                    addStreamItem({
                        kind: "user-speech",
                        text: MOCK_CORRECTION_DATA.original,
                        score: MOCK_SCORE
                    });
                    setTimeout(() => {
                        addStreamItem({ kind: "correction", data: MOCK_CORRECTION_DATA });
                    }, 800);
                }} style={{ fontSize: '10px', padding: '4px', opacity: 0.5 }}>
                    MOCK
                </button>
            </div>

            {(error || fetchError) && (
                <div style={{ color: 'var(--color-destructive)', fontSize: '0.8rem', textAlign: 'center' }}>
                    {error || fetchError}
                </div>
            )}
        </div>
    );
}
