"use client";

import React, { useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Phrase, GENDER_SUPPORTED_LANGUAGES } from "@/lib/data";
import { generateSpeech } from "@/actions/speech";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import { Volume2, Copy, Check, Eye, EyeOff, Gauge, Languages, User, Type } from "lucide-react";
import { playBase64Audio, unlockAudio } from "@/lib/audio";
import { tryPlayPreGenerated } from "@/lib/tts-storage";
import { useHistoryStore } from "@/store/history-store";
import { useSettingsStore } from "@/store/settings-store";
import { useLongPress } from "@/hooks/use-long-press";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import { SpeedControlModal } from "@/components/SpeedControlModal";
import { VoiceSettingsModal } from "@/components/VoiceSettingsModal";
import IPAText from "@/components/IPAText";

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
    /** Demo mode: uses local state for settings, plays only pre-generated samples, no credits consumed */
    demoMode?: boolean;
}

export default function PhraseCard({ phrase, demoMode = false }: Props) {
    const { activeLanguageCode, nativeLanguage, speakingGender, setSpeakingGender, profile, refreshProfile } = useAppStore();
    // Per-phrase reading toggles (local state)
    const [showPinyin, setShowPinyin] = React.useState(false);
    const [showFurigana, setShowFurigana] = React.useState(false);
    const togglePinyin = () => setShowPinyin(prev => !prev);
    const toggleFurigana = () => setShowFurigana(prev => !prev);
    const t = translations[nativeLanguage] || translations.en;
    const { logEvent } = useHistoryStore();
    const [audioLoading, setAudioLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const isRtl = activeLanguageCode === "ar";

    // Shop Feature States
    const [isRevealed, setIsRevealed] = React.useState(false);
    const settingsStore = useSettingsStore();

    // Demo mode: use local state instead of global settings store
    const [demoVoice, setDemoVoice] = React.useState("Kore");
    const [demoLearnerMode, setDemoLearnerMode] = React.useState(false);
    const [demoSpeed, setDemoSpeed] = React.useState(1.0);

    // Use demo state or global state based on mode
    const playbackSpeed = demoMode ? demoSpeed : settingsStore.playbackSpeed;
    const ttsVoice = demoMode ? demoVoice : settingsStore.ttsVoice;
    const ttsLearnerMode = demoMode ? demoLearnerMode : settingsStore.ttsLearnerMode;

    const setPlaybackSpeed = demoMode ? setDemoSpeed : settingsStore.setPlaybackSpeed;
    const setTtsVoice = demoMode ? setDemoVoice : settingsStore.setTtsVoice;
    const setTtsLearnerMode = demoMode ? setDemoLearnerMode : settingsStore.setTtsLearnerMode;
    const togglePlaybackSpeed = demoMode
        ? () => setDemoSpeed(s => s === 1.0 ? 0.75 : s === 0.75 ? 1.25 : 1.0)
        : settingsStore.togglePlaybackSpeed;

    // Long-press modals
    const [speedModalOpen, setSpeedModalOpen] = React.useState(false);
    const [voiceModalOpen, setVoiceModalOpen] = React.useState(false);

    // Token boundaries display (long-press on phrase card, but NOT on tokens)
    const [showTokenBoundaries, setShowTokenBoundaries] = React.useState(false);
    const tokenBoundariesBind = useLongPress({
        threshold: 400,
        onLongPress: (e) => {
            // Don't show boundaries if long-pressing on any button (tokens, audio, speed, etc.)
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
                return;
            }
            setShowTokenBoundaries(true);
            if (navigator.vibrate) navigator.vibrate(30);
        },
    });
    // Hide boundaries on release
    const handleTokenBoundariesRelease = () => {
        setShowTokenBoundaries(false);
    };

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

        // Demo mode: play pre-generated sample only, no logging, no credits
        if (demoMode) {
            try {
                const mode = ttsLearnerMode ? "slow" : "normal";
                const sampleUrl = `/samples/voices/${ttsVoice}/${activeLanguageCode}_${mode}.wav`;
                audio.src = sampleUrl;
                audio.playbackRate = playbackSpeed;
                await audio.play();
            } catch (e) {
                console.error("Demo audio playback failed:", e);
            } finally {
                setAudioLoading(false);
            }
            return;
        }

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
                alert((t as any).insufficientAudioCredits || "Insufficient Audio Credits");
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
                        alert((t as any).insufficientAudioCredits || "Insufficient Audio Credits");
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
            if (!demoMode) {
                logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { phrase_id: phrase.id, text_length: effectiveText.length, source: 'phrase_card' });
            }
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
            position: "relative",
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.transform = "translateY(0);";
                handleTokenBoundariesRelease();
            }}
            onMouseDown={tokenBoundariesBind.onMouseDown}
            onMouseUp={(e) => { tokenBoundariesBind.onMouseUp(e); handleTokenBoundariesRelease(); }}
            onTouchStart={tokenBoundariesBind.onTouchStart}
            onTouchEnd={(e) => { tokenBoundariesBind.onTouchEnd(e); handleTokenBoundariesRelease(); }}
            onTouchMove={tokenBoundariesBind.onTouchMove}
        >
            {/* Target language text - full width */}
            <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", lineHeight: 1.4, textAlign: "start", wordBreak: "break-word", overflowWrap: "break-word" }}>
                <TokenizedSentence text={effectiveText} tokens={effectiveTokens} phraseId={phrase.id} showTokenBoundaries={showTokenBoundaries} showPinyinOverride={showPinyin} showFuriganaOverride={showFurigana} />
            </div>

            {/* Bottom section: translation + buttons inline */}
            <div
                style={{
                    fontSize: "0.9rem",
                    color: "var(--color-fg-muted)",
                    textAlign: "start",
                }}
            >
                <IPAText text={displayTranslation} />

                {/* Action buttons - float right */}
                <span style={{ float: 'right', display: 'inline-flex', gap: '4px', alignItems: 'center', verticalAlign: 'middle' }}>
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
                            }}
                            title={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
                        >
                            <Languages size={16} />
                        </button>
                    )}

                    {/* Furigana Toggle for Japanese */}
                    {activeLanguageCode === "ja" && (
                        <button
                            onClick={toggleFurigana}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: showFurigana ? "var(--color-accent)" : "var(--color-fg-muted)",
                                cursor: "pointer",
                                padding: "var(--space-1)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                            title={showFurigana ? "Hide Furigana" : "Show Furigana"}
                        >
                            <Languages size={16} />
                        </button>
                    )}

                    {/* IPA Toggle for English translations */}
                    <button
                        onClick={() => settingsStore.toggleIPA()}
                        onDoubleClick={() => settingsStore.setIPAMode(settingsStore.ipaMode === 'word' ? 'connected' : 'word')}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: settingsStore.showIPA ? "var(--color-accent)" : "var(--color-fg-muted)",
                            cursor: "pointer",
                            padding: "var(--space-1)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                            position: "relative",
                        }}
                        title={settingsStore.showIPA
                            ? `IPA: ${settingsStore.ipaMode === 'word' ? '単語ごと' : 'つながり'} (ダブルクリックでモード切替)`
                            : "Show IPA pronunciation"}
                    >
                        <Type size={16} />
                        {settingsStore.showIPA && (
                            <span style={{
                                position: "absolute",
                                top: -2,
                                right: -2,
                                fontSize: "0.5rem",
                                fontWeight: 700,
                                color: "var(--color-accent)",
                                lineHeight: 1,
                            }}>
                                {settingsStore.ipaMode === 'word' ? 'W' : 'C'}
                            </span>
                        )}
                    </button>

                    {/* Gender Toggle for Supported Languages */}
                    {GENDER_SUPPORTED_LANGUAGES.includes(activeLanguageCode) && (
                        <button
                            onClick={() => setSpeakingGender(speakingGender === "male" ? "female" : "male")}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: speakingGender === "male" ? "#3b82f6" : "#ef4444",
                                cursor: "pointer",
                                padding: "var(--space-1)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                            title={`Current Voice: ${speakingGender === "male" ? "Man" : "Woman"}`}
                        >
                            <User size={16} />
                        </button>
                    )}

                    {(hasAudioPremium || demoMode) && (
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
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                fontFamily: "system-ui, sans-serif",
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
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    <button
                        {...((hasAudioPremium || demoMode)
                            ? makeLongPress(
                                () => playAudio(effectiveText),
                                () => setVoiceModalOpen(true)
                            )
                            : { onClick: () => playAudio(effectiveText) }
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
                            <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                            <Volume2 size={16} />
                        )}
                    </button>

                </span>
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


