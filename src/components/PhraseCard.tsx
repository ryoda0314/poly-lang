"use client";

import React, { useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Phrase, GENDER_SUPPORTED_LANGUAGES } from "@/lib/data";
import { generateSpeech } from "@/actions/speech";
import { useAppStore } from "@/store/app-context";
import { Volume2, Copy, Check, Eye, EyeOff, Gauge, Languages, User } from "lucide-react";
import { playBase64Audio, unlockAudio } from "@/lib/audio";
import { tryPlayPreGenerated } from "@/lib/tts-storage";
import { useHistoryStore } from "@/store/history-store";
import { useSettingsStore } from "@/store/settings-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import { SpeedControlModal } from "@/components/SpeedControlModal";
import { VoiceSettingsModal } from "@/components/VoiceSettingsModal";

// Transform text based on gender
// Handles both French and Spanish patterns:
// French: "occupé(e)" → male: "occupé", female: "occupée" (append)
// Spanish: "ocupado(a)" → male: "ocupado", female: "ocupada" (replace o→a)
function applyGenderToText(text: string, gender: "male" | "female"): string {
    if (!text) return text;

    if (gender === "male") {
        // For male: simply remove all gender markers and their contents
        // "ocupado(a)" → "ocupado", "occupé(e)" → "occupé"
        return text.replace(/\(([a-záéíóúàâäèêëìîïòôöùûüç]+)\)/gi, "");
    } else {
        // For female: need to handle different patterns
        let result = text;

        // Spanish pattern: -o(a) → -a (replace the 'o' before parentheses with 'a')
        // "ocupado(a)" → "ocupada", "listo(a)" → "lista"
        result = result.replace(/o\(a\)/gi, "a");

        // Spanish pattern: -os(as) → -as (plural)
        // "ocupados(as)" → "ocupadas"
        result = result.replace(/os\(as\)/gi, "as");

        // French pattern: keep content, remove parentheses (append style)
        // "occupé(e)" → "occupée", "content(e)" → "contente"
        // This handles remaining patterns that weren't Spanish -o(a) style
        result = result.replace(/\(([a-záéíóúàâäèêëìîïòôöùûüç]+)\)/gi, "$1");

        return result;
    }
}

interface Props {
    phrase: Phrase;
}

export default function PhraseCard({ phrase }: Props) {
    const { activeLanguageCode, nativeLanguage, speakingGender, setSpeakingGender, profile, refreshProfile, showPinyin, togglePinyin } = useAppStore();
    const { logEvent } = useHistoryStore();
    const [audioLoading, setAudioLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const isRtl = activeLanguageCode === "ar";

    // Shop Feature States
    const [isRevealed, setIsRevealed] = React.useState(false);
    const { playbackSpeed, togglePlaybackSpeed, setPlaybackSpeed, ttsVoice, ttsLearnerMode, setTtsVoice, setTtsLearnerMode } = useSettingsStore();

    // Long-press modals
    const [speedModalOpen, setSpeedModalOpen] = React.useState(false);
    const [voiceModalOpen, setVoiceModalOpen] = React.useState(false);

    // Long-press: indicator slides left, modal opens on release
    const lpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lpTriggeredRef = useRef(false);
    const lpTouchActiveRef = useRef(false);
    const [lpIndicator, setLpIndicator] = useState<{ x: number; y: number; exiting?: boolean } | null>(null);
    const makeLongPress = useCallback((onClick: () => void, onLongPress: () => void) => {
        const startLp = (el: HTMLElement) => {
            lpTriggeredRef.current = false;
            lpTimerRef.current = setTimeout(() => {
                lpTriggeredRef.current = true;
                const rect = el.getBoundingClientRect();
                setLpIndicator({ x: rect.left, y: rect.top + rect.height / 2 });
            }, 400);
        };
        const endLp = (wasTouch: boolean) => (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
            if (wasTouch) (e as React.TouchEvent).preventDefault();
            if (lpTimerRef.current) clearTimeout(lpTimerRef.current);
            const wasLongPress = lpTriggeredRef.current;
            if (wasLongPress) {
                setLpIndicator(prev => prev ? { ...prev, exiting: true } : null);
                setTimeout(() => setLpIndicator(null), 250);
                onLongPress();
            } else {
                setLpIndicator(null);
                onClick();
            }
            if (wasTouch) setTimeout(() => { lpTouchActiveRef.current = false; }, 400);
        };
        const cancelLp = () => {
            if (lpTimerRef.current) { clearTimeout(lpTimerRef.current); lpTimerRef.current = null; }
            setLpIndicator(null);
            lpTriggeredRef.current = false;
        };
        return {
            onMouseDown: (e: React.MouseEvent) => { if (lpTouchActiveRef.current) return; startLp(e.currentTarget as HTMLElement); },
            onMouseUp: (e: React.MouseEvent) => { if (lpTouchActiveRef.current) return; endLp(false)(e); },
            onMouseLeave: () => { if (lpTouchActiveRef.current) return; cancelLp(); },
            onTouchStart: (e: React.TouchEvent) => { lpTouchActiveRef.current = true; startLp(e.currentTarget as HTMLElement); },
            onTouchEnd: endLp(true),
            onTouchCancel: () => { cancelLp(); setTimeout(() => { lpTouchActiveRef.current = false; }, 400); },
        };
    }, []);

    // Check purchased items from Profile
    const hasFocusMode = React.useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("focus_mode");
    }, [profile]);

    const hasAudioPremium = React.useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("audio_premium");
    }, [profile]);

    // Determine which translation to show
    // use nativeLanguage translation (which is the targetText in that language) or fallback to gloss_en
    const displayTranslation = phrase.translations?.[nativeLanguage] || phrase.translation;

    // Get target text and tokens for the ACTIVE learning language
    const rawText = phrase.translations?.[activeLanguageCode] || phrase.translation;
    // Apply gender transformation
    const effectiveText = applyGenderToText(rawText, speakingGender);
    const rawTokens = phrase.tokensMap?.[activeLanguageCode];

    // Flatten tokens if they are in nested string[][] format (e.g. for Korean multiple sentences)
    // Also apply gender transformation to tokens
    const effectiveTokens = React.useMemo(() => {
        if (!rawTokens) return undefined;
        let tokens: string[];
        // Check if the first element is an array to detect string[][]
        if (Array.isArray(rawTokens[0])) {
            tokens = (rawTokens as string[][]).flat();
        } else {
            tokens = rawTokens as string[];
        }
        // Apply gender transformation to each token
        return tokens.map(t => applyGenderToText(t, speakingGender));
    }, [rawTokens, speakingGender]);

    const playAudio = async (text: string) => {
        if (audioLoading) return;

        // Unlock an Audio element immediately within the user gesture (before any await).
        // Mobile browsers block audio.play() if it's not tied to a tap/click gesture.
        const audio = unlockAudio(playbackSpeed);

        setAudioLoading(true);

        // Log interaction for Quests and Analytics
        logEvent('phrase_view', 1, { phrase_id: phrase.id, text: effectiveText });
        logEvent(TRACKING_EVENTS.AUDIO_PLAY, 0, { phrase_id: phrase.id, text_length: effectiveText.length, source: 'phrase_card' });

        try {
            // Try pre-generated audio first (Kore + normal mode only, no credit cost)
            if (ttsVoice === "Kore" && !ttsLearnerMode) {
                const played = await tryPlayPreGenerated(text, activeLanguageCode, playbackSpeed, audio);
                if (played) return;
            }

            // Fall back to on-the-fly generation (requires credits)
            const credits = profile?.audio_credits ?? 0;
            if (credits <= 0) {
                alert("音声クレジットが不足しています (Insufficient Audio Credits)");
                return;
            }

            const result = await generateSpeech(text, activeLanguageCode, ttsVoice, ttsLearnerMode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType, playbackRate: playbackSpeed }, audio);
                refreshProfile().catch(console.error);
            } else {
                if (result && 'error' in result) {
                    console.warn("TTS generation failed:", result.error);
                    if (result.error.includes("credit")) {
                        alert("音声クレジットが不足しています (Insufficient Audio Credits)");
                        return;
                    }
                }
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = activeLanguageCode;
                    utterance.rate = playbackSpeed;
                    window.speechSynthesis.speak(utterance);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(effectiveText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { phrase_id: phrase.id, text_length: effectiveText.length, source: 'phrase_card' });
        } catch (e) {
            console.error("Failed to copy:", e);
        }
    };

    return (
        <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            boxShadow: "var(--shadow-sm)",
            transition: "box-shadow 0.2s, transform 0.2s",
            height: "100%",
            overflow: "hidden",
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", textAlign: "start" }}>
                <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>
                    <TokenizedSentence text={effectiveText} tokens={effectiveTokens} phraseId={phrase.id} />
                </div>

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                    {/* Pinyin Toggle for Chinese */}
                    {activeLanguageCode === "zh" && (
                        <button
                            onClick={togglePinyin}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: showPinyin ? "var(--color-accent)" : "var(--color-fg-muted)",
                                cursor: "pointer",
                                padding: "var(--space-1)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                            }}
                            title={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
                        >
                            <Languages size={18} />
                        </button>
                    )}

                    {/* Gender Toggle for Supported Languages */}
                    {GENDER_SUPPORTED_LANGUAGES.includes(activeLanguageCode) && (
                        <button
                            onClick={() => setSpeakingGender(speakingGender === "male" ? "female" : "male")}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: speakingGender === "male" ? "#3b82f6" : "#ef4444", // Blue / Red
                                cursor: "pointer",
                                padding: "var(--space-1)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                            }}
                            title={`Current Voice: ${speakingGender === "male" ? "Man" : "Woman"}`}
                        >
                            <User size={18} />
                        </button>
                    )}

                    {hasAudioPremium && (
                        <button
                            {...makeLongPress(
                                () => togglePlaybackSpeed(),
                                () => setSpeedModalOpen(true)
                            )}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: playbackSpeed === 1.0 ? "var(--color-fg-muted)" : "var(--color-accent)",
                                cursor: "pointer",
                                padding: "var(--space-1)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                fontFamily: "system-ui, sans-serif",
                                width: "28px"
                            }}
                            title={`Speed: ${playbackSpeed}x`}
                        >
                            {`${playbackSpeed}x`}
                        </button>
                    )}

                    <button
                        onClick={copyToClipboard}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: copied ? "var(--color-success, #22c55e)" : "var(--color-fg-muted)",
                            cursor: "pointer",
                            padding: "var(--space-1)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => !copied && (e.currentTarget.style.color = "var(--color-accent)")}
                        onMouseLeave={e => !copied && (e.currentTarget.style.color = "var(--color-fg-muted)")}
                        title={copied ? "Copied!" : "Copy to clipboard"}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>

                    <button
                        {...makeLongPress(
                            () => playAudio(effectiveText),
                            () => setVoiceModalOpen(true)
                        )}
                        disabled={audioLoading}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "var(--color-fg-muted)",
                            cursor: "pointer",
                            padding: "var(--space-1)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                        }}
                        title="Play audio"
                    >
                        {audioLoading ? (
                            <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                            <Volume2 size={18} />
                        )}
                    </button>
                </div>
            </div>

            <div
                style={{
                    fontSize: "0.9rem",
                    color: "var(--color-fg-muted)",
                    marginTop: "auto",
                    textAlign: "start",
                    position: "relative",
                    cursor: hasFocusMode ? "pointer" : "default",
                    userSelect: hasFocusMode && !isRevealed ? "none" : "auto"
                }}
                onClick={() => hasFocusMode && setIsRevealed(!isRevealed)}
            >
                <div style={{
                    filter: hasFocusMode && !isRevealed ? "blur(6px)" : "none",
                    opacity: hasFocusMode && !isRevealed ? 0.6 : 1,
                    transition: "all 0.3s"
                }}>
                    {displayTranslation}
                </div>

                {hasFocusMode && !isRevealed && (
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        color: "var(--color-fg)",
                        fontWeight: 500,
                        background: "var(--color-surface)",
                        padding: "4px 8px",
                        borderRadius: "var(--radius-md)",
                        boxShadow: "var(--shadow-sm)",
                        zIndex: 10
                    }}>
                        <EyeOff size={16} />
                        <span>Reaveal</span>
                    </div>
                )}
            </div>

            {/* Speed Control Modal (long-press on speed button) */}
            <SpeedControlModal
                isOpen={speedModalOpen}
                onClose={() => setSpeedModalOpen(false)}
                currentSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
            />

            {/* Voice Settings Modal (long-press on play button) */}
            <VoiceSettingsModal
                isOpen={voiceModalOpen}
                onClose={() => setVoiceModalOpen(false)}
                currentVoice={ttsVoice}
                learnerMode={ttsLearnerMode}
                onVoiceChange={setTtsVoice}
                onLearnerModeChange={setTtsLearnerMode}
            />

            {/* Long-press indicator */}
            {lpIndicator && createPortal(
                <div style={{
                    position: 'fixed',
                    left: lpIndicator.x - 12,
                    top: lpIndicator.y - 12,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    pointerEvents: 'none',
                    zIndex: 999,
                    animation: lpIndicator.exiting
                        ? 'lpExpand 0.25s ease-out forwards'
                        : 'lpSlideLeft 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards',
                }}>
                    <style>{`
                        @keyframes lpSlideLeft {
                            from { transform: translateX(0) scale(0.3); opacity: 0; }
                            to   { transform: translateX(-36px) scale(1); opacity: 0.9; }
                        }
                        @keyframes lpExpand {
                            from { transform: translateX(-36px) scale(1); opacity: 0.9; }
                            to   { transform: translateX(-36px) scale(3); opacity: 0; }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </div>
    );
}


