"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, Volume2, Eye, EyeOff, Languages } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import TokenizedSentence from "@/components/TokenizedSentence";
import MemoDropZone from "@/components/MemoDropZone";
import { useExplorer } from "@/hooks/use-explorer";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import { useAwarenessStore } from "@/store/awareness-store";
import clsx from "clsx";
import styles from "./history.module.css";

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
function HistoryCard({ event, t }: { event: any, t: any }) {
    const meta = event.meta || {};
    const [isRevealed, setIsRevealed] = useState(false);

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(meta.text);
            u.lang = 'en'; // Assuming English for now, could be passed from event
            window.speechSynthesis.speak(u);
        }
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
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", marginBottom: "12px" }}>
                <button
                    onClick={handlePlay}
                    style={{
                        background: "var(--color-accent)",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        cursor: "pointer"
                    }}
                >
                    <Volume2 size={16} />
                </button>
            </div>

            <div style={{
                marginBottom: "16px",
                fontSize: "1.4rem",
                fontFamily: "var(--font-display)",
                lineHeight: 1.4
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
    const { user, activeLanguageCode, nativeLanguage, showPinyin, togglePinyin } = useAppStore();
    const { drawerState, closeExplorer } = useExplorer();
    const { isMemoMode } = useAwarenessStore();

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
                            <h1 className={styles.title}>{t.reviewHistory}</h1>
                            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
                                {/* Pinyin Toggle Button - Only show for Chinese */}
                                {activeLanguageCode === "zh" && (
                                    <button
                                        onClick={togglePinyin}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "8px 12px",
                                            borderRadius: "var(--radius-md)",
                                            border: showPinyin ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                                            background: showPinyin ? "var(--color-accent-subtle)" : "var(--color-surface)",
                                            color: showPinyin ? "var(--color-accent)" : "var(--color-fg-muted)",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            fontWeight: 500,
                                            transition: "all 0.2s",
                                        }}
                                        title={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
                                    >
                                        <Languages size={18} />
                                        <span>拼音</span>
                                    </button>
                                )}
                                <MemoDropZone />
                            </div>
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
                                            <HistoryCard key={event.id} event={event} t={t} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isPanelOpen && (
                <>
                    <div className={styles.overlay} onClick={() => closeExplorer()} />
                    <div className={styles.rightPanel}>
                        <ExplorerSidePanel />
                    </div>
                </>
            )}
        </div>
    );
}
