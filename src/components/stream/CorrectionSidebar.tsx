"use client";
import React, { useState } from 'react';
import { AwarenessSidebar } from '../awareness/AwarenessSidebar'; // Content updated
import { usePronunciation } from '@/hooks/use-pronunciation'; // Can remove if unused
import { useAudioRecorder } from '@/hooks/use-audio-recorder'; // Can remove if unused
import { RecorderPanel } from '../pronunciation/RecorderPanel'; // Can remove
import { ResultPanel } from '../pronunciation/ResultPanel'; // Can remove
import { Mic, StickyNote, X } from 'lucide-react';
import { useStreamStore } from './store';
import { useAzureSpeech } from '@/hooks/use-azure-speech';

import { useAppStore } from "@/store/app-context"; // Import store
import { translations } from "@/lib/translations";

export function CorrectionSidebar() {
    const { nativeLanguage, setNativeLanguage } = useAppStore();
    const [activeTab, setActiveTab] = useState<'awareness' | 'pronunciation'>('awareness');
    const t = translations[nativeLanguage] || translations.ja;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-sub)' }}>
            {/* Header: Tabs + Lang Selector */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--color-border)',
                justifyContent: 'space-between',
                paddingRight: 'var(--space-2)',
                flexShrink: 0  // Prevent header from shrinking
            }}>
                <div style={{ display: 'flex', flex: 1 }}>
                    <Tab
                        label={t.awarenessTitle}
                        icon={<StickyNote size={14} />}
                        active={activeTab === 'awareness'}
                        onClick={() => setActiveTab('awareness')}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
                {activeTab === 'awareness' ? (
                    <div style={{ height: '100%' }}>
                        {/* AwarenessSidebar normally has a border, but we rely on StreamLayout container border */}
                        <AwarenessSidebar />
                    </div>
                ) : (
                    <PronunciationSidebarContent />
                )}
            </div>
        </div>
    );
}

function Tab({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: active ? 'var(--color-bg-sub)' : 'var(--color-bg-alt)',
                borderBottom: active ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--color-fg)' : 'var(--color-fg-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem'
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function PronunciationSidebarContent() {
    const { addStreamItem } = useStreamStore();
    const { nativeLanguage } = useAppStore(); // Get generic settings
    const {
        isListening,
        interimText,
        finalText,
        finalScore,
        finalDetails,
        startListening,
        stopListening,
        reset,
        error
    } = useAzureSpeech();

    // We reuse the same logic as MouthpieceDock
    const [isProcessing, setIsProcessing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const handleToggle = async () => {
        if (isListening) {
            stopListening();
        } else {
            reset();
            setFetchError(null);
            await startListening();
        }
    };

    // Auto-submit logic
    React.useEffect(() => {
        const submit = async () => {
            if (!isListening && finalText && !isProcessing) {
                setIsProcessing(true);
                setFetchError(null);

                // 1. Add User Speech
                addStreamItem({
                    kind: "user-speech",
                    text: finalText,
                    score: finalScore || undefined,
                    details: finalDetails
                });

                try {
                    // 2. Call Correction API
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    const res = await fetch('/api/correction', {
                        method: 'POST',
                        body: JSON.stringify({ text: finalText, nativeLanguage }), // Pass nativeLanguage
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || `Error ${res.status}`);
                    }

                    // Need to import CorrectionData type
                    const data = await res.json();

                    // 3. Add Correction
                    addStreamItem({
                        kind: "correction",
                        data
                    });

                } catch (e: any) {
                    console.error(e);
                    setFetchError(e.message || "Failed to getting correction");
                } finally {
                    setIsProcessing(false);
                    // Do not reset here immediately if we want to show "Sent" state? 
                    // Actually reset is fine as the result is in the stream.
                    reset();
                }
            }
        };

        if (!isListening && finalText) {
            submit();
        }
    }, [isListening, finalText, finalScore, finalDetails, addStreamItem, reset, isProcessing, nativeLanguage]);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            gap: '2rem'
        }}>
            <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {isListening ? "Listening..." : isProcessing ? "Analyzing..." : "Correction & Pronunciation"}
                </h3>
                <p style={{ margin: 0, color: 'var(--color-fg-muted)', fontSize: '0.9rem' }}>
                    {isListening ? interimText || "Speak now..." : "Tap microphone to start speaking. AI will correct your grammar and check your pronunciation."}
                </p>
            </div>

            <button
                onClick={handleToggle}
                disabled={isProcessing}
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "none",
                    background: isListening ? "var(--color-destructive)" : "var(--color-fg)",
                    color: "var(--color-bg)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: isProcessing ? 0.5 : 1,
                    transform: isListening ? 'scale(1.1)' : 'scale(1)'
                }}
            >
                {isListening ? (
                    <div style={{ width: 32, height: 32, borderRadius: 4, background: "currentColor" }} />
                ) : (
                    <Mic size={40} />
                )}
            </button>

            {(error || fetchError) && (
                <div style={{ color: 'var(--color-destructive)', fontSize: '0.9rem', maxWidth: '100%' }}>
                    {error || fetchError}
                </div>
            )}

            {/* Mock Button for Testing */}
            <div style={{ marginTop: 'auto', opacity: 0.5, paddingTop: '1rem' }}>
                <button onClick={() => {
                    const { MOCK_CORRECTION_DATA, MOCK_SCORE, MOCK_DETAILS } = require('./mock/correction');
                    addStreamItem({
                        kind: "user-speech",
                        text: MOCK_CORRECTION_DATA.original,
                        score: MOCK_SCORE,
                        details: MOCK_DETAILS
                    });
                    setTimeout(() => {
                        addStreamItem({ kind: "correction", data: MOCK_CORRECTION_DATA });
                    }, 500);
                }} style={{ fontSize: '10px', padding: '4px 8px', cursor: 'pointer', background: 'none', border: '1px solid currentColor', borderRadius: 4 }}>
                    TEST MOCK
                </button>
            </div>
        </div>
    );
}
