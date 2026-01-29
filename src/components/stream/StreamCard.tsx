import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { StreamItem, CorrectionCardData } from "@/types/stream";
import styles from "./StreamCard.module.css";
import { useStreamStore } from "./store";
import { useHistoryStore } from "@/store/history-store";
import { useCollectionsStore } from "@/store/collections-store";
import { Volume2, Bookmark, ChevronDown, ChevronUp, Copy, Check, MoveRight, Star, ArrowDown, BookOpen, Lock } from "lucide-react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { useSettingsStore } from "@/store/settings-store";

import { translations } from "@/lib/translations";
import { explainPhraseElements, ExplanationResult } from "@/actions/explain";
import { computeDiff } from "@/lib/diff";
import { generateSpeech } from "@/actions/speech";
import { refineWithNuance } from "@/actions/correct";
import { playBase64Audio } from "@/lib/audio";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import TokenizedSentence, { HighlightRange } from "@/components/TokenizedSentence";
import { SaveToCollectionModal } from "@/components/SaveToCollectionModal";
import { SpeedControlModal } from "@/components/SpeedControlModal";
import { VoiceSettingsModal } from "@/components/VoiceSettingsModal";

const useCopyToClipboard = () => {
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setTimeout(() => setCopiedText(null), 2000);
            return true;
        } catch (e) {
            console.error("Failed to copy:", e);
            return false;
        }
    };

    return { copiedText, copy };
};

interface Props {
    item: Extract<StreamItem, { kind: "sentence" | "candidate" | "correction-card" }>;
}

export default function StreamCard({ item }: Props) {
    if (item.kind === "correction-card") {
        return <CorrectionCard item={item} />;
    }
    // Legacy support
    if (item.kind === "sentence" || item.kind === "candidate") {
        return <LegacyStreamCard item={item} />;
    }
    return null;
}

// ------------------------------------------------------------------
// v0.7 Correction Card (Assessment -> Sentence Blocks)
// ------------------------------------------------------------------
function CorrectionCard({ item }: { item: Extract<StreamItem, { kind: "correction-card" }> }) {
    const data = item.data;
    const [isDiffOpen, setIsDiffOpen] = useState(true);
    const [isBoundaryOpen, setIsBoundaryOpen] = useState(false);
    const [isAlternativesOpen, setIsAlternativesOpen] = useState(true);
    const { verifyAttemptedMemosInText } = useAwarenessStore();
    const { logEvent } = useHistoryStore();
    const { user, profile, activeLanguageCode, nativeLanguage, refreshProfile, showPinyin, togglePinyin } = useAppStore();
    const { copiedText, copy } = useCopyToClipboard();

    // Explanation State
    const [explanation, setExplanation] = useState<{ targetText: string, result: ExplanationResult } | null>(null);
    const [isExplanationOpen, setIsExplanationOpen] = useState(true);
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanationError, setExplanationError] = useState<string | null>(null);

    // Save to Collection Modal State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState<{ text: string; translation?: string } | null>(null);

    // Track saved phrases for checkmark display
    const [savedTexts, setSavedTexts] = useState<Set<string>>(new Set());

    // Audio loading state
    const [audioLoading, setAudioLoading] = useState<string | null>(null);

    // Nuance refinement state
    const [nuanceText, setNuanceText] = useState("");
    const [isNuanceRefining, setIsNuanceRefining] = useState(false);
    const [nuanceError, setNuanceError] = useState<string | null>(null);

    // Version management: original correction + nuance refinements
    const [refinements, setRefinements] = useState<Array<{
        label: string;
        score: number;
        summary_1l: string;
        points: string[];
        recommended: string;
        recommended_translation: string;
        sentences: { text: string; translation: string }[];
        diff: { before: string; after: string };
        boundary_1l: string | null;
        alternatives: { label: string; text: string; translation?: string }[];
    }>>([]);
    const [activeVersion, setActiveVersion] = useState(0);
    const { savePhraseToCollection } = useCollectionsStore();
    const { defaultPhraseView, playbackSpeed, togglePlaybackSpeed, setPlaybackSpeed, ttsVoice, ttsLearnerMode, setTtsVoice, setTtsLearnerMode } = useSettingsStore();

    // Long-press modals
    const [speedModalOpen, setSpeedModalOpen] = useState(false);
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);

    // Long-press: indicator slides left, modal opens on release
    const lpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lpTriggeredRef = useRef(false);
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
        const endLp = (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
            if ('preventDefault' in e && 'touches' in e) (e as React.TouchEvent).preventDefault();
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
        };
        const cancelLp = () => {
            if (lpTimerRef.current) { clearTimeout(lpTimerRef.current); lpTimerRef.current = null; }
            setLpIndicator(null);
            lpTriggeredRef.current = false;
        };
        return {
            onMouseDown: (e: React.MouseEvent) => startLp(e.currentTarget as HTMLElement),
            onMouseUp: endLp,
            onMouseLeave: cancelLp,
            onTouchStart: (e: React.TouchEvent) => startLp(e.currentTarget as HTMLElement),
            onTouchEnd: endLp,
        };
    }, []);

    // Check if user has audio premium (speed control + voice selection)
    const hasAudioPremium = useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("audio_premium");
    }, [profile]);

    // Check if user has a premium plan (not free)
    const isPremiumUser = useMemo(() => {
        const plan = (profile as any)?.subscription_plan || 'free';
        return plan !== 'free';
    }, [profile]);

    // Auto-verify memos when correction result is displayed
    useEffect(() => {
        if (data.recommended) {
            verifyAttemptedMemosInText(data.recommended);
        }
        // Also check all sentences
        data.sentences?.forEach(sent => {
            if (sent.text) {
                verifyAttemptedMemosInText(sent.text);
            }
        });
    }, [data.recommended, data.sentences, verifyAttemptedMemosInText]);

    const t: any = translations[nativeLanguage] || translations.ja;

    const handleExplain = async (targetText: string) => {
        if (isExplaining) return;

        // 1. Check if we already have this explanation loaded (reuse cache)
        if (explanation?.targetText === targetText) {
            // Toggle visibility without credit check or API call
            setIsExplanationOpen(!isExplanationOpen);
            return;
        }

        // 2. Client-side credit check for NEW explanations
        const credits = profile?.explanation_credits ?? 0;
        if (credits <= 0) {
            setExplanationError(t.stream_insufficient_explanation_credits);
            return;
        }

        setIsExplaining(true);
        setExplanationError(null);

        try {
            logEvent(TRACKING_EVENTS.EXPLANATION_REQUEST, 0, { phrase_id: item.data.sid, text_length: targetText.length });

            // Check if we have cached explanation? (Not implemented locally in component for simplification)
            const result = await explainPhraseElements(targetText, activeLanguageCode || "en", nativeLanguage);
            if (!result) throw new Error("Failed to explain");
            if (result.error) {
                throw new Error(result.error);
            }

            setExplanation({
                targetText,
                result
            });
            setIsExplanationOpen(true);

            // Refresh profile to update credits count
            refreshProfile().catch(console.error);

        } catch (e: any) {
            console.error(e);
            setExplanationError(e.message || "Explanation failed. Please try again.");
        } finally {
            setIsExplaining(false);
        }
    };

    const handleSavePhrase = async (text: string, translation?: string) => {
        if (!user || !activeLanguageCode) return;

        // If history mode is on, save directly without showing modal
        if (defaultPhraseView === 'history') {
            try {
                await savePhraseToCollection(
                    user.id,
                    activeLanguageCode,
                    text,
                    translation || "",
                    null // Save to uncategorized (history)
                );
                // Show checkmark feedback
                setSavedTexts(prev => new Set(prev).add(text));
            } catch (e) {
                console.error("Save failed", e);
                alert(t.saveFailed || "Failed to save.");
            }
            return;
        }

        // If my-phrases mode, show modal to select collection
        setPendingSaveData({ text, translation });
        setIsSaveModalOpen(true);
    };

    const handleConfirmSave = async (collectionId: string | null) => {
        if (!user || !activeLanguageCode || !pendingSaveData) return;
        try {
            await savePhraseToCollection(
                user.id,
                activeLanguageCode,
                pendingSaveData.text,
                pendingSaveData.translation || "",
                collectionId
            );
            setIsSaveModalOpen(false);
            setPendingSaveData(null);
        } catch (e) {
            console.error("Save failed", e);
            alert(t.saveFailed || "Failed to save.");
        }
    };

    const handleVerifyLikeAction = () => {
        verifyAttemptedMemosInText(data.recommended);
    };

    const handleNuanceRefine = async () => {
        if (!nuanceText.trim() || isNuanceRefining) return;

        // Client-side credit check
        const credits = profile?.correction_credits ?? 0;
        if (credits <= 0) {
            setNuanceError(t.nuanceRefineCreditError);
            return;
        }

        setIsNuanceRefining(true);
        setNuanceError(null);

        try {
            logEvent(TRACKING_EVENTS.NUANCE_REFINEMENT, 1, {
                input_length: data.original.length,
                nuance_length: nuanceText.length,
                language: activeLanguageCode
            });

            const result = await refineWithNuance(
                data.original,
                data.recommended,
                nuanceText,
                activeLanguageCode || "en",
                nativeLanguage,
                "neutral"
            );

            refreshProfile().catch(console.error);

            if (!result) {
                setNuanceError("Refinement failed. Please try again.");
                return;
            }

            const newRefinement = {
                label: nuanceText,
                score: result.score,
                summary_1l: result.summary_1l,
                points: result.points,
                recommended: result.recommended,
                recommended_translation: result.recommended_translation,
                sentences: result.sentences,
                diff: result.diff,
                boundary_1l: result.boundary_1l,
                alternatives: result.alternatives
            };
            setRefinements(prev => [...prev, newRefinement]);
            setActiveVersion(refinements.length + 1);
            setNuanceText("");
        } catch (e: any) {
            console.error(e);
            setNuanceError(e.message || "Nuance refinement failed.");
        } finally {
            setIsNuanceRefining(false);
        }
    };

    const handlePlayAudio = async (text: string, key: string) => {
        if (audioLoading) return;

        // Client-side credit check
        const credits = profile?.audio_credits ?? 0;
        if (credits <= 0) {
            alert(t.stream_insufficient_audio_credits);
            return;
        }

        handleVerifyLikeAction();
        setAudioLoading(key);
        try {
            const result = await generateSpeech(text, activeLanguageCode || "en", ttsVoice, ttsLearnerMode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType, playbackRate: playbackSpeed });
                refreshProfile().catch(console.error);
            } else {
                // Fallback to browser TTS
                if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(text);
                    u.lang = activeLanguageCode === 'zh' ? 'zh-CN' : 'en';
                    u.rate = playbackSpeed;
                    window.speechSynthesis.speak(u);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(null);
        }
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        handlePlayAudio(activeData.recommended, 'main');
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleVerifyLikeAction();
        alert(t.stream_saved_to_library);
    };

    const toggleBoundary = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsBoundaryOpen(!isBoundaryOpen);
    };

    const toggleAlternatives = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAlternativesOpen(!isAlternativesOpen);
    };

    // Compute active version data (original or nuance refinement)
    const activeData = useMemo(() => {
        if (activeVersion === 0 || !refinements[activeVersion - 1]) return data;
        const ref = refinements[activeVersion - 1];
        return { ...data, ...ref };
    }, [activeVersion, refinements, data]);

    const score = activeData.score || 0;

    // Fallback if sentences are missing (legacy data)
    const displaySentences = (activeData.sentences && activeData.sentences.length > 0)
        ? activeData.sentences
        : [{ text: activeData.recommended, translation: activeData.recommended_translation }];

    return (
        <div className={styles.card} style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '640px',
            width: '100%',
            margin: '0 auto'
        }}>
            {/* -------------------------------------------------------------
               SECTION 1: ASSESSMENT (Your Attempt + Score + General Feedback)
               ------------------------------------------------------------- */}
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative'
            }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {t.yourAttempt}
                </div>

                {/* Original Text (Large) */}
                <div style={{
                    fontSize: '1.25rem', // Larger
                    color: 'var(--color-fg)',
                    lineHeight: 1.4,
                    marginBottom: '16px'
                }}>
                    <TokenizedSentence
                        text={data.original}
                        phraseId={`original-${data.sid}`}
                        readOnly
                    />
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

                {/* Score & General Feedback */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)' }}>{t.naturalnessScore}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={14} fill={i * 20 <= score ? "var(--color-accent)" : "none"} color="var(--color-accent)" />
                                ))}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{score}</span>
                        </div>
                    </div>
                    {/* Summary (Verdict) */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        color: 'var(--color-fg)',
                        fontWeight: 500
                    }}>
                        <span>{activeData.summary_1l}</span>
                    </div>
                </div>
            </div>

            {/* Version Connector / Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px', marginTop: '-8px', marginBottom: '-8px' }}>
                {/* Top arrow */}
                <div style={{ background: 'var(--color-bg-sub)', borderRadius: '50%', padding: '4px' }}>
                    <ArrowDown size={16} color="var(--color-fg-muted)" />
                </div>

                {/* Tab switcher (only when refinements exist) */}
                {refinements.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '999px',
                        padding: '3px',
                        overflowX: 'auto',
                        maxWidth: '100%',
                        marginTop: '6px',
                        marginBottom: '6px'
                    }}>
                        <button
                            onClick={() => setActiveVersion(0)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: '999px',
                                border: 'none',
                                background: activeVersion === 0 ? 'var(--color-fg)' : 'transparent',
                                color: activeVersion === 0 ? 'var(--color-surface)' : 'var(--color-fg-muted)',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {t.originalCorrection || '元の添削'}
                        </button>
                        {refinements.map((ref, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveVersion(i + 1)}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: activeVersion === i + 1 ? 'var(--color-fg)' : 'transparent',
                                    color: activeVersion === i + 1 ? 'var(--color-surface)' : 'var(--color-fg-muted)',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '140px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {ref.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Bottom arrow (only when tabs are shown) */}
                {refinements.length > 0 && (
                    <div style={{ background: 'var(--color-bg-sub)', borderRadius: '50%', padding: '4px' }}>
                        <ArrowDown size={16} color="var(--color-fg-muted)" />
                    </div>
                )}
            </div>

            {/* -------------------------------------------------------------
               SECTION 2: SOLUTION (Recommendation Blocks)
               ------------------------------------------------------------- */}
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-primary)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>
                        {t.betterPhrasing}
                    </div>
                </div>

                {/* Render Sentences Loop */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {displaySentences.map((sent, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            marginBottom: (i < displaySentences.length - 1) ? '16px' : '0',
                            paddingBottom: (i < displaySentences.length - 1) ? '16px' : '0',
                            borderBottom: (i < displaySentences.length - 1) ? '1px dashed var(--color-border-sub)' : 'none'
                        }}>
                            {/* Sentence Text using TokenizedSentence for interactivity & Pinyin */}
                            <div style={{
                                fontSize: '1.1rem', // Slightly adjust container base size, TokenizedSentence handles its own sizing
                                marginBottom: '4px'
                            }}>
                                <TokenizedSentence
                                    text={sent.text}
                                    phraseId={`${data.sid}-${i}`} // Unique ID for each sentence block
                                    readOnly
                                />
                            </div>

                            {/* Action Buttons - Wrap on mobile */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                                scrollbarWidth: 'none', // Firefox
                                msOverflowStyle: 'none', // IE/Edge
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: '4px' // Space for scrollbar if visible
                            }}>
                                <style jsx>{`
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>

                                {/* Pinyin Toggle (Chinese only) */}
                                {activeLanguageCode === 'zh' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePinyin();
                                        }}
                                        className={styles.iconBtn}
                                        title="Toggle Pinyin"
                                        style={{
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'transparent',
                                            color: showPinyin ? 'var(--color-primary)' : 'var(--color-fg)',
                                            border: showPinyin ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            flexShrink: 0,
                                            width: '36px',
                                            height: '36px',
                                            fontSize: '0.9rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        拼
                                    </button>
                                )}

                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const success = await copy(sent.text);
                                        if (success) {
                                            logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { text_length: sent.text.length, source: 'stream_card' });
                                        }
                                    }}
                                    className={styles.iconBtn}
                                    title={t.copy}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'transparent',
                                        border: '1px solid var(--color-border)',
                                        color: copiedText === sent.text ? 'var(--color-success, #22c55e)' : 'var(--color-fg)',
                                        flexShrink: 0
                                    }}
                                >
                                    {copiedText === sent.text ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    {...makeLongPress(
                                        () => {
                                            verifyAttemptedMemosInText(sent.text);
                                            logEvent(TRACKING_EVENTS.AUDIO_PLAY, 0, { text_length: sent.text.length, source: 'stream_card' });
                                            handlePlayAudio(sent.text, `sent-${i}`);
                                        },
                                        () => setVoiceModalOpen(true)
                                    )}
                                    className={styles.iconBtn}
                                    title={t.play}
                                    disabled={audioLoading === `sent-${i}`}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'transparent',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-fg)',
                                        flexShrink: 0
                                    }}
                                >
                                    {audioLoading === `sent-${i}` ? (
                                        <div style={{ width: 18, height: 18, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                    ) : (
                                        <Volume2 size={18} />
                                    )}
                                </button>
                                {hasAudioPremium && (
                                    <button
                                        {...makeLongPress(
                                            () => togglePlaybackSpeed(),
                                            () => setSpeedModalOpen(true)
                                        )}
                                        className={styles.iconBtn}
                                        title={`Speed: ${playbackSpeed}x`}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'transparent',
                                            border: '1px solid var(--color-border)',
                                            color: playbackSpeed === 1.0 ? 'var(--color-fg)' : 'var(--color-accent)',
                                            flexShrink: 0,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            fontFamily: 'system-ui, sans-serif',
                                            minWidth: '36px'
                                        }}
                                    >
                                        {`${playbackSpeed}x`}
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        verifyAttemptedMemosInText(sent.text);
                                        handleSavePhrase(sent.text, sent.translation);
                                    }}
                                    className={styles.iconBtn}
                                    title={savedTexts.has(sent.text) ? t.saved || "Saved" : t.save}
                                    disabled={savedTexts.has(sent.text)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'transparent',
                                        border: '1px solid var(--color-border)',
                                        color: savedTexts.has(sent.text) ? 'var(--color-success, #22c55e)' : 'var(--color-fg)',
                                        flexShrink: 0
                                    }}
                                >
                                    {savedTexts.has(sent.text) ? <Check size={18} /> : <Bookmark size={18} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExplain(sent.text);
                                    }}
                                    className={styles.iconBtn}
                                    title={t.explain}
                                    disabled={isExplaining}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'transparent',
                                        color: explanation?.targetText === sent.text ? 'var(--color-primary)' : 'var(--color-fg)',
                                        border: explanation?.targetText === sent.text ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        flexShrink: 0
                                    }}
                                >
                                    {isExplaining && explanation?.targetText !== sent.text && isExplaining ? (
                                        <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                    ) : (
                                        <BookOpen size={18} color={explanation?.targetText === sent.text ? "var(--color-primary)" : "currentColor"} />
                                    )}
                                </button>
                            </div>

                            {sent.translation && (
                                <div style={{ fontSize: '0.95rem', color: 'var(--color-fg-muted)' }}>
                                    {sent.translation}
                                </div>
                            )}

                            {/* Explanation UI - Collapsible */}
                            {explanation && explanation.targetText === sent.text && (
                                <div style={{
                                    marginTop: '12px',
                                    background: 'transparent',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Collapsible Header */}
                                    <button
                                        onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                            {t.explain || 'Explanation'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {isExplanationOpen ? <ChevronUp size={14} color="var(--color-fg-muted)" /> : <ChevronDown size={14} color="var(--color-fg-muted)" />}
                                        </div>
                                    </button>

                                    {/* Collapsible Content */}
                                    {isExplanationOpen && (
                                        <div style={{ padding: '0 12px 12px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {explanation.result.items.map((item, idx) => (
                                                    <div key={idx} style={{
                                                        background: 'var(--color-surface)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--color-border)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1px'
                                                    }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg)' }}>{item.token}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-fg-muted)' }}>{item.meaning}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>{item.grammar}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {explanation.result.nuance && (
                                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-fg)', lineHeight: 1.4, borderTop: '1px solid var(--color-border-sub)', paddingTop: '6px' }}>
                                                    {explanation.result.nuance}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {explanationError && (explanation?.targetText === sent.text || !explanation) && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-destructive)', marginTop: '4px', padding: '0 4px', fontWeight: 600 }}>
                                    {t.stream_warning} {explanationError}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Why? (Reasoning/Points) */}
                {activeData.points && activeData.points.length > 0 && (
                    <div style={{
                        background: 'rgba(0,0,0,0.025)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '12px'
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {t.whyBetter}
                        </div>
                        <ul style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '0.95rem',
                            color: 'var(--color-fg)',
                            lineHeight: 1.6,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {activeData.points.map((p, i) => (
                                <li key={i}>{p}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Nuance / Boundary Note - Parallel to points */}
                {activeData.boundary_1l && (
                    <div style={{
                        background: 'rgba(0,0,0,0.025)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--color-fg-muted)',
                            textTransform: 'uppercase',
                            marginBottom: '8px'
                        }}>
                            {t.nuance}
                        </div>
                        {(() => {
                            const lines = activeData.boundary_1l!.split('\n').filter(l => l.trim());
                            if (lines.length > 1) {
                                return (
                                    <ul style={{
                                        margin: 0,
                                        paddingLeft: '20px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-fg)',
                                        lineHeight: 1.6
                                    }}>
                                        {lines.map((line, i) => (
                                            <li key={i} style={{ fontStyle: 'italic' }}>{line}</li>
                                        ))}
                                    </ul>
                                );
                            }
                            return (
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontStyle: 'italic',
                                    color: 'var(--color-fg)',
                                    lineHeight: 1.5
                                }}>
                                    {activeData.boundary_1l}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Diff */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.9rem'
                }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-fg-muted)' }}>{t.diff}:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: "100%" }}>
                        {(() => {
                            const beforeText = activeData.diff.before || "";
                            const afterText = activeData.diff.after || "";

                            // Simple sentence splitting ensuring we capture the delimiter
                            // This regex matches a sequence of non-terminators followed by optional terminators
                            const splitRegex = /[^.!?。！？\n]+[.!?。！？\n]*/g;
                            const beforeSentences = beforeText.match(splitRegex)?.map(s => s.trim()) || [beforeText];
                            const afterSentences = afterText.match(splitRegex)?.map(s => s.trim()) || [afterText];

                            // Determine if we can pair them sentence-by-sentence
                            // We pair if counts match and we have multiples. 
                            // Even if count is 1, we still want the frame style, so we can just use the mapped loop universally.
                            // But if counts MISMATCH (e.g. 2 sentences became 1), we fallback to full block to avoid misalignment.
                            const useSplitView = beforeSentences.length > 1 && beforeSentences.length === afterSentences.length;

                            const pairs = useSplitView
                                ? beforeSentences.map((b, i) => ({ before: b, after: afterSentences[i] }))
                                : [{ before: beforeText, after: afterText }];

                            return pairs.map((pair, idx) => {
                                const diffs = computeDiff(pair.before, pair.after);
                                const originalRanges: HighlightRange[] = [];
                                let origPos = 0;
                                const correctedRanges: HighlightRange[] = [];
                                let corrPos = 0;

                                diffs.forEach(part => {
                                    const len = part.value.length;
                                    if (part.type === 'delete') {
                                        originalRanges.push({ startIndex: origPos, endIndex: origPos + len - 1, type: 'delete' });
                                        origPos += len;
                                    } else if (part.type === 'insert') {
                                        correctedRanges.push({ startIndex: corrPos, endIndex: corrPos + len - 1, type: 'insert' });
                                        corrPos += len;
                                    } else {
                                        origPos += len;
                                        corrPos += len;
                                    }
                                });

                                return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {/* Original with Deletions */}
                                        <div style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            fontSize: '0.9rem',
                                            color: 'var(--color-fg)',
                                            lineHeight: 1.5
                                        }}>
                                            <TokenizedSentence
                                                text={pair.before}
                                                phraseId={`cc-diff-${data.sid || 'unk'}-${idx}-orig`}
                                                highlightRanges={originalRanges}
                                                readOnly
                                            />
                                        </div>

                                        {/* Arrow */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', opacity: 0.5 }}>
                                            <ArrowDown size={14} />
                                        </div>

                                        {/* New with Insertions */}
                                        <div style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            fontSize: '0.95rem',
                                            color: 'var(--color-fg)',
                                            fontWeight: 500,
                                            lineHeight: 1.5
                                        }}>
                                            <TokenizedSentence
                                                text={pair.after}
                                                phraseId={`cc-diff-${data.sid || 'unk'}-${idx}-corr`}
                                                highlightRanges={correctedRanges}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Nuance Refinement - inside Solution card (Premium only) */}
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px dashed var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    opacity: isPremiumUser ? 1 : 0.6
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--color-fg-muted)',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {t.nuanceRefine}
                        {!isPremiumUser && <Lock size={12} />}
                    </div>
                    {!isPremiumUser ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-sub)',
                            fontSize: '0.85rem',
                            color: 'var(--color-fg-muted)'
                        }}>
                            <Lock size={16} />
                            <span>{t.nuanceRefinePremiumOnly}</span>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                minWidth: 0
                            }}>
                                <input
                                    value={nuanceText}
                                    onChange={(e) => {
                                        setNuanceText(e.target.value);
                                        if (nuanceError) setNuanceError(null);
                                    }}
                                    placeholder={t.nuanceRefineHint}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNuanceRefine()}
                                    disabled={isNuanceRefining}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-fg)',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={handleNuanceRefine}
                                    disabled={!nuanceText.trim() || isNuanceRefining}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: (!nuanceText.trim() || isNuanceRefining) ? 'var(--color-border)' : 'var(--color-accent, #D94528)',
                                        color: (!nuanceText.trim() || isNuanceRefining) ? 'var(--color-fg-muted)' : '#fff',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: (!nuanceText.trim() || isNuanceRefining) ? 'default' : 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0
                                    }}
                                >
                                    {isNuanceRefining ? t.nuanceRefineLoading : t.nuanceRefineButton}
                                </button>
                            </div>
                            {nuanceError && (
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--color-destructive)',
                                    fontWeight: 600
                                }}>
                                    {nuanceError}
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* Alternatives - Redesigned */}
            {activeData.alternatives && activeData.alternatives.length > 0 && (
                <div style={{
                    background: 'var(--color-bg-sub)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '8px'
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--color-fg-muted)',
                        textTransform: 'uppercase',
                        marginBottom: '12px'
                    }}>
                        {t.otherOptions}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {activeData.alternatives.map((alt, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '10px 12px',
                                background: 'var(--color-surface)',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)'
                            }}>
                                {/* Header: Label + Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        background: i === 0 ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                                        color: '#fff',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {alt.label}
                                    </span>

                                    {/* Actions moved to header */}
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {/* Pinyin Toggle (Chinese only) */}
                                        {activeLanguageCode === 'zh' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePinyin();
                                                }}
                                                className={styles.iconBtn}
                                                title="Toggle Pinyin"
                                                style={{
                                                    padding: '4px',
                                                    color: showPinyin ? 'var(--color-primary)' : 'var(--color-fg-muted)',
                                                    fontWeight: showPinyin ? 600 : 400
                                                }}
                                            >
                                                拼
                                            </button>
                                        )}

                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const success = await copy(alt.text);
                                                if (success) {
                                                    logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { text_length: alt.text.length, source: 'stream_card_alternative' });
                                                }
                                            }}
                                            className={styles.iconBtn}
                                            title={copiedText === alt.text ? "Copied!" : "Copy"}
                                            style={{
                                                padding: '4px',
                                                color: copiedText === alt.text ? 'var(--color-success, #22c55e)' : 'var(--color-fg-muted)'
                                            }}
                                        >
                                            {copiedText === alt.text ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                        <button
                                            {...makeLongPress(
                                                () => {
                                                    logEvent(TRACKING_EVENTS.AUDIO_PLAY, 0, { text_length: alt.text.length, source: 'stream_card_alternative' });
                                                    handlePlayAudio(alt.text, `alt-${i}`);
                                                },
                                                () => setVoiceModalOpen(true)
                                            )}
                                            className={styles.iconBtn}
                                            title="Play TTS"
                                            disabled={audioLoading === `alt-${i}`}
                                            style={{ padding: '4px', color: 'var(--color-fg-muted)' }}
                                        >
                                            {audioLoading === `alt-${i}` ? (
                                                <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                            ) : (
                                                <Volume2 size={14} />
                                            )}
                                        </button>
                                        {hasAudioPremium && (
                                            <button
                                                {...makeLongPress(
                                                    () => togglePlaybackSpeed(),
                                                    () => setSpeedModalOpen(true)
                                                )}
                                                className={styles.iconBtn}
                                                title={`Speed: ${playbackSpeed}x`}
                                                style={{
                                                    padding: '4px',
                                                    color: playbackSpeed === 1.0 ? 'var(--color-fg-muted)' : 'var(--color-accent)',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    fontFamily: 'system-ui, sans-serif'
                                                }}
                                            >
                                                {`${playbackSpeed}x`}
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSavePhrase(alt.text, alt.translation);
                                            }}
                                            className={styles.iconBtn}
                                            title={savedTexts.has(alt.text) ? t.saved || "Saved" : t.save}
                                            disabled={savedTexts.has(alt.text)}
                                            style={{ padding: '4px', color: savedTexts.has(alt.text) ? 'var(--color-success, #22c55e)' : 'var(--color-fg-muted)' }}
                                        >
                                            {savedTexts.has(alt.text) ? <Check size={14} /> : <Bookmark size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Content (Full Width) */}
                                <div>
                                    <div style={{
                                        fontSize: '0.95rem',
                                        color: 'var(--color-fg)',
                                        fontWeight: 500,
                                        lineHeight: 1.4,
                                        marginBottom: '4px'
                                    }}>
                                        <TokenizedSentence
                                            text={alt.text}
                                            phraseId={`cc-alt-${data.sid}-${i}`}
                                            readOnly
                                        />
                                    </div>
                                    {alt.translation && (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--color-fg-muted)',
                                            marginTop: '4px'
                                        }}>
                                            {alt.translation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Save to Collection Modal */}
            <SaveToCollectionModal
                isOpen={isSaveModalOpen}
                onClose={() => {
                    setIsSaveModalOpen(false);
                    setPendingSaveData(null);
                }}
                onSave={handleConfirmSave}
                text={pendingSaveData?.text || ""}
                translation={pendingSaveData?.translation}
            />

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

// ------------------------------------------------------------------
// Legacy Support (Sentence / Candidate)
// ------------------------------------------------------------------
function LegacyStreamCard({ item }: { item: Extract<StreamItem, { kind: "sentence" | "candidate" }> }) {
    const { selectedSid, toggleSelection } = useStreamStore();
    const data = item.data;
    const isSelected = selectedSid === data.sid;
    const [isDiffOpen, setIsDiffOpen] = useState(false);

    const sourceClass = data.source === "BASE" ? styles.base
        : data.source === "CANDIDATE" ? styles.candidate
            : styles.compare;

    const toggleDiff = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDiffOpen(!isDiffOpen);
    };

    const hasDiff = item.kind === 'candidate' && item.diff;

    return (
        <div
            className={`${styles.card} ${sourceClass} ${isSelected ? styles.selected : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                toggleSelection(data.sid);
            }}
        >
            <div className={styles.meta}>{data.source}</div>
            <div className={styles.text}>{data.learn}</div>
            <div className={styles.translation}>{data.translation}</div>
            {hasDiff && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={toggleDiff}
                        // Simple inline style to reduce complexity
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}
                    >
                        {isDiffOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span style={{ marginLeft: 4 }}>Diff</span>
                    </button>
                    {isDiffOpen && item.diff && (
                        <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                            <span style={{ color: 'red', textDecoration: 'line-through' }}>{item.diff.before}</span>
                            {' -> '}
                            <span style={{ color: 'green' }}>{item.diff.after}</span>
                        </div>
                    )}
                </div>
            )}
            {'tags' in item && (
                <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {/* @ts-ignore */}
                    {item.tags?.map((t: string) => (
                        <span key={t} style={{ fontSize: '0.7em', background: '#eee', padding: '2px 4px', borderRadius: 4 }}>{t}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
