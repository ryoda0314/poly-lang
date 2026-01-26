"use client";

import React, { useEffect, useState } from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Trash2, Maximize2, Minimize2, Volume2, StickyNote, Check } from "lucide-react";
import styles from "./ExplorerDrawer.module.css";
import TokenizedSentence from "@/components/TokenizedSentence";
import clsx from "clsx";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { useSettingsStore } from "@/store/settings-store";
import { usePathname } from "next/navigation";
import AwarenessStatsPanel from "@/components/awareness/AwarenessStatsPanel";

const DRAWER_VARIANTS = {
    UNOPENED: { y: "120%", opacity: 0, height: 400 },
    COLLAPSED: { y: 0, opacity: 1, height: 490 },
    EXPANDED: { y: 0, opacity: 1, height: "85vh" },
};

export default function ExplorerDrawer() {
    const pathname = usePathname();
    const {
        drawerState,
        trail,
        closeExplorer,
        toggleExpand,
        popTrail,
        jumpToTrail,
        deleteCurrent,
        activeIndex,
    } = useExplorer();
    const { activeLanguageCode, user, profile, refreshProfile } = useAppStore();
    const { selectedToken, addMemo, memos, deleteMemo, clearSelection, updateMemo } = useAwarenessStore();
    const { ttsVoice, ttsLearnerMode } = useSettingsStore();
    const [audioLoading, setAudioLoading] = React.useState<string | null>(null);
    const [isMemoOpen, setIsMemoOpen] = React.useState(false);
    const isRtl = activeLanguageCode === "ar";

    // Check for stats mode
    const isStatsMode = selectedToken?.viewMode === 'stats';

    // Close explorer on route change
    useEffect(() => {
        closeExplorer();
    }, [pathname, closeExplorer]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeExplorer();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeExplorer]);

    const currentStep = trail[activeIndex];
    const canGoBack = activeIndex > 0;

    const isMatch = !!(selectedToken && currentStep && selectedToken.text === currentStep.token);

    let existingMemo = null;
    if (selectedToken) {
        if (isMatch) {
            const key = `${selectedToken.phraseId}-${selectedToken.startIndex}`;
            const localMemos = memos[key];
            if (localMemos && localMemos.length > 0) {
                existingMemo = localMemos[0];
            }
        }
    }

    React.useEffect(() => {
        setIsMemoOpen(!!existingMemo);
    }, [!!existingMemo, activeIndex]);

    if (drawerState === "UNOPENED") return null;

    const playAudio = async (text: string, id: string) => {
        if (audioLoading) return;

        // Client-side credit check
        const credits = profile?.audio_credits ?? 0;
        if (credits <= 0) {
            // Use browser alert or update a local error state. 
            // Since this is a small button, a simple alert is clearest for now unless we have a toaster.
            alert("音声クレジットが不足しています (Insufficient Audio Credits)");
            return;
        }

        setAudioLoading(id);

        try {
            const result = await generateSpeech(text, activeLanguageCode, ttsVoice, ttsLearnerMode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType });

                // Refresh profile to sync credits
                refreshProfile().catch(console.error);
            } else {
                if (result && 'error' in result) {
                    console.warn("TTS generation failed:", result.error);
                    if (result.error.includes("credit")) {
                        alert("音声クレジットが不足しています (Insufficient Audio Credits)");
                        return; // Don't fallback
                    }
                } else {
                    console.warn("Failed to generate speech");
                }

                // Fallback to browser TTS ONLY if not a credit issue (e.g. network error)?
                // User seems to want to BLOCK audio if credits are 0.
                // If we are here, we passed the initial credit check, so maybe it's a real server error.
                // For now, let's DISABLE fallback to avoid confusion, or keep it only for non-credit errors?
                // Given the user report, removing automatic fallback is safest for "Premium Feel".
                // But let's stick to just blocking the START if 0 credits.

                // If specific error, show it.
                // For safety, let's NOT fallback if we suspect credit issues to be strict.
                // Actually, let's keep fallback for GENUINE errors if credits > 0, 
                // but the user's issue was likely the fallback happening when credits=0.
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = activeLanguageCode;
                    window.speechSynthesis.speak(utterance);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(null);
        }
    };

    const handleToggleMemo = () => {
        setIsMemoOpen(prev => !prev);
    };

    const handleRegister = async (conf: "high" | "medium" | "low", note: string) => {
        if (!user || !isMatch || !selectedToken) return;

        if (existingMemo) {
            await updateMemo(existingMemo.id, {
                confidence: conf,
                memo: note,
                updated_at: new Date().toISOString()
            });
        } else {
            // Fix: Use startIndex instead of tokenIndex
            await addMemo(user.id, selectedToken.phraseId, selectedToken.startIndex, selectedToken.text, conf, activeLanguageCode, note);
        }
    };

    const handleDelete = async () => {
        if (existingMemo) {
            await deleteMemo(existingMemo.id);
        }
    };

    const renderContent = () => {
        // Stats Mode Priority
        if (isStatsMode && selectedToken) {
            const key = `${selectedToken.phraseId}-${selectedToken.startIndex}`;
            const localMemos = memos[key];
            const statsMemo = localMemos && localMemos.length > 0 ? localMemos[0] : null;

            return (
                <AwarenessStatsPanel
                    token={selectedToken.text}
                    memo={statsMemo || undefined}
                    onClose={() => {
                        clearSelection();
                        closeExplorer();
                    }}
                />
            );
        }

        if (!currentStep) return <div className={styles.emptyState}>No selection</div>;

        if (currentStep.loading) {
            return (
                <div className={styles.emptyState}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                        <div style={{ width: 24, height: 24, border: "2px solid #ccc", borderTopColor: "#D94528", borderRadius: "50%" }} />
                    </motion.div>
                    <span>Searching &quot;{currentStep.token}&quot;...</span>
                </div>
            );
        }

        if (currentStep.error) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.errorState}>{currentStep.error}</div>
                </div>
            );
        }

        if (!currentStep.examples || currentStep.examples.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <span>No examples found for &quot;{currentStep.token}&quot;</span>
                </div>
            );
        }

        return (
            <div className={styles.exampleList}>
                <AnimatePresence>
                    {isMemoOpen && isMatch && (
                        <MemoInputCard
                            token={currentStep.token}
                            existingMemo={existingMemo}
                            onRegister={handleRegister}
                            onDelete={handleDelete}
                        />
                    )}
                </AnimatePresence>
                <div className={styles.dateBreak}><span>Examples</span></div>
                {currentStep.examples.map((ex) => (
                    <div key={ex.id} className={styles.exampleCard}>
                        <div className={styles.exampleTarget}>
                            <TokenizedSentence text={ex.text} direction={isRtl ? "rtl" : "ltr"} phraseId={ex.id} />
                            <button
                                className={styles.audioBtn}
                                onClick={() => playAudio(ex.text, ex.id)}
                                title="Play audio"
                                disabled={audioLoading === ex.id}
                            >
                                {audioLoading === ex.id ? (
                                    <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                ) : (
                                    <Volume2 size={16} />
                                )}
                            </button>
                        </div>
                        <div className={styles.exampleTranslation}>{ex.translation}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <motion.div
            className={styles.drawer}
            variants={DRAWER_VARIANTS}
            initial="UNOPENED"
            animate={drawerState}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Header - Hide in Stats Mode to give Panel full control, or adapt */}
            {!isStatsMode && (
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button
                            className={styles.iconBtn}
                            onClick={popTrail}
                            disabled={!canGoBack}
                            title="Go back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <span className={styles.title}>{currentStep?.token || "Explorer"}</span>
                    </div>
                    <div className={styles.controls}>
                        {isMatch && (
                            <button
                                className={`${styles.iconBtn} ${existingMemo ? styles.activeMemo : ''}`}
                                onClick={handleToggleMemo}
                                title={isMemoOpen ? "Close Memo" : (existingMemo ? "Edit Memo" : "Add Memo")}
                                style={{ color: existingMemo ? 'var(--color-accent)' : 'inherit' }}
                            >
                                <StickyNote size={18} fill={existingMemo ? "currentColor" : "none"} />
                            </button>
                        )}
                        <button className={styles.iconBtn} onClick={toggleExpand} title={drawerState === "EXPANDED" ? "Collapse" : "Expand"}>
                            {drawerState === "EXPANDED" ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button className={styles.iconBtn} onClick={deleteCurrent} title="Remove word" disabled={trail.length === 0}>
                            <Trash2 size={18} />
                        </button>
                        <button className={styles.iconBtn} onClick={closeExplorer} title="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {trail.length > 0 && !isStatsMode && (
                <div className={styles.breadcrumbs}>
                    {trail.map((node, index) => (
                        <button
                            key={`${node.token}-${index}`}
                            className={clsx(styles.crumb, index === activeIndex && styles.crumbActive)}
                            onClick={() => jumpToTrail(index)}
                        >
                            {node.token}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.content}>
                {renderContent()}
            </div>
        </motion.div>
    );
}

// Recreate MemoInputCard locally since it was missing
interface MemoInputCardProps {
    token: string;
    existingMemo: any | null;
    onRegister: (conf: "high" | "medium" | "low", note: string) => void;
    onDelete: () => void;
}

function MemoInputCard({ token, existingMemo, onRegister, onDelete }: MemoInputCardProps) {
    const [confidence, setConfidence] = useState<"high" | "medium" | "low">(existingMemo?.confidence || "medium");
    const [note, setNote] = useState(existingMemo?.memo || "");

    useEffect(() => {
        if (existingMemo) {
            setConfidence(existingMemo.confidence || "medium");
            setNote(existingMemo.memo || "");
        }
    }, [existingMemo]);

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", marginBottom: "var(--space-4)" }}
        >
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "var(--shadow-sm)"
            }}>
                <div style={{ marginBottom: "12px", fontSize: "0.9rem", fontWeight: 600 }}>Awareness Memo: {token}</div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    {(['high', 'medium', 'low'] as const).map(conf => (
                        <button
                            key={conf}
                            onClick={() => setConfidence(conf)}
                            style={{
                                flex: 1,
                                padding: "6px",
                                borderRadius: "4px",
                                border: confidence === conf
                                    ? `2px solid ${conf === 'high' ? 'var(--color-success)' : conf === 'medium' ? 'var(--color-warning)' : 'var(--color-destructive)'}`
                                    : "1px solid var(--color-border)",
                                background: confidence === conf
                                    ? `color-mix(in srgb, ${conf === 'high' ? 'var(--color-success)' : conf === 'medium' ? 'var(--color-warning)' : 'var(--color-destructive)'} 10%, transparent)`
                                    : "transparent",
                                color: confidence === conf
                                    ? `var(--color-fg)`
                                    : "var(--color-fg-muted)",
                                fontWeight: confidence === conf ? 700 : 400,
                                cursor: "pointer",
                                textTransform: "capitalize",
                                fontSize: "0.85rem"
                            }}
                        >
                            {conf}
                        </button>
                    ))}
                </div>

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note about this word..."
                    style={{
                        width: "100%",
                        minHeight: "80px",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid var(--color-border)",
                        fontFamily: "inherit",
                        fontSize: "0.9rem",
                        marginBottom: "12px",
                        resize: "vertical",
                        background: "var(--color-bg)"
                    }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    {existingMemo && (
                        <button
                            onClick={onDelete}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "1px solid var(--color-destructive)",
                                background: "transparent",
                                color: "var(--color-destructive)",
                                cursor: "pointer",
                                fontSize: "0.85rem"
                            }}
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={() => onRegister(confidence, note)}
                        style={{
                            flex: 1,
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: "none",
                            background: "var(--color-accent)",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                        }}
                    >
                        <Check size={14} />
                        {existingMemo ? "Update" : "Save"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
