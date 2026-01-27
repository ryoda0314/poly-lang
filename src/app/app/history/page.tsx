"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bookmark, Volume2, Eye, EyeOff, Languages, Copy, Check, Info } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import TokenizedSentence from "@/components/TokenizedSentence";
import MemoDropZone from "@/components/MemoDropZone";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { useExplorer } from "@/hooks/use-explorer";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import { useAwarenessStore } from "@/store/awareness-store";
import { useSettingsStore } from "@/store/settings-store";
import clsx from "clsx";
import styles from "./history.module.css";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { Clock, RotateCw } from "lucide-react";
import { SpeedControlModal } from "@/components/SpeedControlModal";
import { VoiceSettingsModal } from "@/components/VoiceSettingsModal";

const HISTORY_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "履歴ページへようこそ！",
        description: "ここでは、これまでに再生したり詳細を見たフレーズが時系列で表示されます。学習の足跡を振り返りましょう。",
        icon: <Clock size={48} style={{ color: "var(--color-accent)" }} />
    },
    {
        title: "カードをタップで翻訳表示",
        description: "各カードをタップすると、翻訳文が表示されます。理解度を確認しながら復習できます。",
        icon: <Eye size={48} style={{ color: "#8b5cf6" }} />
    },
    {
        title: "再度再生して定着",
        description: "音声を繰り返し聞いて、フレーズを体に染み込ませましょう。再生ボタンはカード右下にあります。",
        icon: <RotateCw size={48} style={{ color: "#10b981" }} />
    }
];

// ------------------------------------------------------------------
// Date Helper
// ------------------------------------------------------------------
function getDateLabel(dateStr: string, nativeLang: string, t: any) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) return t.today;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return t.yesterday;

    const locales: Record<string, string> = { ja: 'ja-JP', ko: 'ko-KR', en: 'en-US' };
    const localeStr = locales[nativeLang] || 'en-US';
    return date.toLocaleDateString(localeStr, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ------------------------------------------------------------------
// Interactive History Card
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// Interactive History Card
// ------------------------------------------------------------------
const HistoryCard = ({ event, t, credits, langCode, profile }: { event: any, t: any, credits: number, langCode: string, profile: any }) => {
    const meta = event.meta || {};
    const [isRevealed, setIsRevealed] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const { playbackSpeed, togglePlaybackSpeed, setPlaybackSpeed, ttsVoice, ttsLearnerMode, setTtsVoice, setTtsLearnerMode } = useSettingsStore();

    // Check if user has speed control from shop
    const hasSpeedControl = useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("speed_control");
    }, [profile]);

    // Long-press modals
    const [speedModalOpen, setSpeedModalOpen] = useState(false);
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);
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

    const handlePlay = async () => {
        if (audioLoading) return;

        // Client-side credit check
        if (credits <= 0) {
            alert("音声クレジットが不足しています (Insufficient Audio Credits)");
            return;
        }

        setAudioLoading(true);
        try {
            const result = await generateSpeech(meta.text, langCode, ttsVoice, ttsLearnerMode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType, playbackRate: playbackSpeed });
            } else {
                if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(meta.text);
                    u.lang = langCode === 'zh' ? 'zh-CN' : 'en';
                    u.rate = playbackSpeed;
                    window.speechSynthesis.speak(u);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(false);
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(meta.text);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const toggleReveal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRevealed(!isRevealed);
    };

    return (
        <div
            onClick={toggleReveal}
            style={{
                background: "var(--color-surface)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                padding: "20px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
                overflow: "hidden"
            }}
            className="hover:shadow-md active:scale-[0.99] transition-all"
        >
            <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                display: "flex",
                gap: "12px",
                zIndex: 10
            }}>
                <button
                    onClick={handleCopy}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: hasCopied ? "var(--color-success)" : "var(--color-fg-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0
                    }}
                    title="Copy"
                >
                    {hasCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
                <button
                    {...makeLongPress(() => handlePlay(), () => setVoiceModalOpen(true))}
                    disabled={audioLoading}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-fg-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0
                    }}
                    title="Play"
                >
                    {audioLoading ? (
                        <div style={{ width: 20, height: 20, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    ) : (
                        <Volume2 size={20} />
                    )}
                </button>
                {hasSpeedControl && (
                    <button
                        {...makeLongPress(() => togglePlaybackSpeed(), () => setSpeedModalOpen(true))}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: playbackSpeed === 1.0 ? "var(--color-fg-muted)" : "var(--color-accent)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            fontFamily: "system-ui, sans-serif"
                        }}
                        title={`Speed: ${playbackSpeed}x`}
                    >
                        {`${playbackSpeed}x`}
                    </button>
                )}
            </div>

            <div style={{
                marginBottom: "16px",
                fontSize: "1.4rem",
                fontFamily: "var(--font-display)",
                lineHeight: 1.4,
                paddingRight: "110px"
            }}>
                <TokenizedSentence
                    text={meta.text}
                    tokens={meta.tokens}
                    phraseId={meta.phrase_id || event.id}
                />
            </div>

            <div style={{
                borderTop: "1px dashed var(--color-border)",
                paddingTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: isRevealed ? "var(--color-fg-muted)" : "transparent",
                transition: "color 0.3s"
            }}>
                <span style={{
                    fontSize: "1rem",
                    filter: isRevealed ? "none" : "blur(4px)",
                    transition: "filter 0.3s",
                    userSelect: isRevealed ? "text" : "none"
                }}>
                    {meta.translation || t.noTranslation}
                </span>
                <div style={{ color: "var(--color-fg-muted)" }}>
                    {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
            </div>

            <SpeedControlModal
                isOpen={speedModalOpen}
                onClose={() => setSpeedModalOpen(false)}
                currentSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
            />
            <VoiceSettingsModal
                isOpen={voiceModalOpen}
                onClose={() => setVoiceModalOpen(false)}
                currentVoice={ttsVoice}
                learnerMode={ttsLearnerMode}
                onVoiceChange={setTtsVoice}
                onLearnerModeChange={setTtsLearnerMode}
            />
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
// Main Page
// ------------------------------------------------------------------
// Imports at top (will be merged/handled by ReplaceFileContent properly if I provide context, or I should do a separate block for imports if too far apart)
// Actually I will replace the whole component body for clarity if allowed, or large chunk.
// Let's replace the Component Body.

export default function HistoryPage() {
    const { events, isLoading, fetchHistory } = useHistoryStore();
    const { user, profile, activeLanguageCode, nativeLanguage, showPinyin, togglePinyin } = useAppStore();
    const { drawerState, closeExplorer } = useExplorer();
    const { isMemoMode } = useAwarenessStore();

    // Tutorial state
    const [tutorialKey, setTutorialKey] = useState(0);

    const handleShowTutorial = () => {
        localStorage.removeItem("poly-lang-page-tutorial-history-v1");
        setTutorialKey(k => k + 1);
    };

    useEffect(() => {
        if (user) {
            fetchHistory(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchHistory]);

    const t = translations[nativeLanguage] || translations.ja;

    if (isLoading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>{t.loading}</div>;
    }

    const savedPhrases = events.filter(e => e.event_type === 'saved_phrase');
    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;

    // Group by Date
    const groupedGroups: Record<string, typeof savedPhrases> = {};
    savedPhrases.forEach(e => {
        const label = getDateLabel(e.occurred_at, nativeLanguage, t);
        if (!groupedGroups[label]) groupedGroups[label] = [];
        groupedGroups[label].push(e);
    });

    const sortedLabels = Object.keys(groupedGroups).sort((a, b) => {
        if (a === t.today) return -1;
        if (b === t.today) return 1;
        if (a === t.yesterday) return -1;
        if (b === t.yesterday) return 1;
        return 0;
    });

    return (
        <div className={clsx(styles.container, isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed)}>
            <div className={styles.leftArea}>
                <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h1 className={styles.title}>{t.reviewHistory}</h1>
                                <button
                                    onClick={handleShowTutorial}
                                    title="使い方"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "30px",
                                        height: "30px",
                                        background: "transparent",
                                        color: "var(--color-fg-muted, #6b7280)",
                                        border: "1px solid var(--color-border, #e5e7eb)",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <Info size={18} />
                                </button>
                            </div>
                            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
                                {/* Pinyin Toggle Button - Only show for Chinese */}

                                <div className={styles.desktopOnly}>
                                    <MemoDropZone />
                                </div>
                            </div>
                        </div>
                        {/* Mobile drop zone in sticky header */}
                        <div className={styles.mobileOnly} style={{ width: "100%", marginTop: "12px" }}>
                            <MemoDropZone expandedLayout={true} />
                        </div>
                    </div>

                    {savedPhrases.length === 0 ? (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "40vh",
                            color: "var(--color-fg-muted)",
                            background: "var(--color-surface)",
                            borderRadius: "16px",
                            border: "1px dashed var(--color-border)"
                        }}>
                            <Bookmark size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.5 }} />
                            <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{t.historyEmptyTitle}</h2>
                            <p>{t.historyEmptyDesc}</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                            {sortedLabels.map(label => (
                                <div key={label}>
                                    <h3 style={{
                                        fontSize: "1rem",
                                        color: "var(--color-fg-muted)",
                                        marginBottom: "16px",
                                        borderLeft: "4px solid var(--color-primary)",
                                        paddingLeft: "12px",
                                        lineHeight: 1
                                    }}>
                                        {label}
                                    </h3>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                        gap: "16px"
                                    }}>
                                        {groupedGroups[label].map(event => (
                                            <HistoryCard key={event.id} event={event} t={t} credits={profile?.audio_credits ?? 0} langCode={activeLanguageCode || "en"} profile={profile} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {
                isPanelOpen && (
                    <>
                        <div className={styles.overlay} onClick={() => closeExplorer()} />
                        <div className={styles.rightPanel}>
                            <ExplorerSidePanel />
                        </div>
                    </>
                )
            }

            {/* Page Tutorial */}
            <PageTutorial key={tutorialKey} pageId="history" steps={HISTORY_TUTORIAL_STEPS} />
        </div >
    );
}
