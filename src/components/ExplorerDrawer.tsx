"use client";

import React, { useEffect } from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Trash2, Maximize2, Minimize2, Volume2, StickyNote } from "lucide-react";
import styles from "./ExplorerDrawer.module.css";
import TokenizedSentence from "@/components/TokenizedSentence";
import clsx from "clsx";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { useAwarenessStore } from "@/store/awareness-store";

const DRAWER_VARIANTS = {
    UNOPENED: { y: "120%", opacity: 0, height: 400 },
    COLLAPSED: { y: 0, opacity: 1, height: 450 },
    EXPANDED: { y: 0, opacity: 1, height: "85vh" },
};

export default function ExplorerDrawer() {
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
    const { activeLanguageCode, user } = useAppStore();
    const { selectedToken, addMemo, memos, deleteMemo } = useAwarenessStore();
    const [audioLoading, setAudioLoading] = React.useState<string | null>(null);
    const [isMemoOpen, setIsMemoOpen] = React.useState(false);
    const isRtl = activeLanguageCode === "ar";

    const playAudio = async (text: string, id: string) => {
        if (audioLoading) return;
        setAudioLoading(id);

        try {
            const result = await generateSpeech(text, activeLanguageCode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType });
            } else {
                if (result && 'error' in result) {
                    console.warn("TTS generation failed:", result.error);
                } else {
                    console.warn("Failed to generate speech");
                }

                // Fallback to browser TTS
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeExplorer();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeExplorer]);

    if (drawerState === "UNOPENED") return null;

    const currentStep = trail[activeIndex];
    const canGoBack = activeIndex > 0;

    // Awareness Memo Logic
    const isMatch = selectedToken && currentStep && selectedToken.text === currentStep.token;

    let existingMemo = null;
    if (isMatch) {
        const key = `${selectedToken.phraseId}-${selectedToken.tokenIndex}`;
        const localMemos = memos[key];
        if (localMemos && localMemos.length > 0) {
            existingMemo = localMemos[0];
        }
    }

    React.useEffect(() => {
        setIsMemoOpen(!!existingMemo);
    }, [!!existingMemo, activeIndex]);

    const handleToggleMemo = () => {
        setIsMemoOpen(prev => !prev);
    };

    const handleRegister = async (conf: "high" | "medium" | "low", note: string) => {
        if (!user || !isMatch) return;

        if (existingMemo) {
            await useAwarenessStore.getState().updateMemo(existingMemo.id, {
                confidence: conf,
                memo: note,
                updated_at: new Date().toISOString()
            });
        } else {
            await addMemo(user.id, selectedToken.phraseId, selectedToken.tokenIndex, selectedToken.text, conf, note);
        }
    };

    const handleDelete = async () => {
        if (existingMemo) {
            await deleteMemo(existingMemo.id);
        }
    };

    const renderContent = () => {
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
                    {/* Awareness Memo Toggle */}
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

            {trail.length > 0 && (
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

function MemoInputCard({ token, existingMemo, onRegister, onDelete }: any) {
    const [confidence, setConfidence] = React.useState<"high" | "medium" | "low">(existingMemo?.confidence || 'low');
    const [note, setNote] = React.useState(existingMemo?.memo || '');

    React.useEffect(() => {
        if (existingMemo) {
            setConfidence(existingMemo.confidence);
            setNote(existingMemo.memo || '');
        } else {
            setConfidence('low');
            setNote('');
        }
    }, [existingMemo, token]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            style={{ marginBottom: '2rem' }}
        >
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                overflow: 'hidden',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ width: '6px', background: 'var(--color-destructive)' }} />
                <div style={{ flex: 1, padding: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{token}</h3>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(['high', 'medium', 'low'] as const).map(lev => (
                                <button
                                    key={lev}
                                    onClick={() => setConfidence(lev)}
                                    style={{
                                        border: 'none',
                                        background: confidence === lev
                                            ? (lev === 'low' ? 'var(--color-destructive)' : lev === 'medium' ? 'var(--color-warning)' : 'var(--color-success)')
                                            : 'transparent',
                                        color: confidence === lev
                                            ? 'white'
                                            : 'var(--color-fg-muted)',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {lev.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note..."
                        style={{
                            width: '100%',
                            border: 'none',
                            background: 'transparent',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            color: 'var(--color-fg)',
                            fontFamily: 'inherit',
                            minHeight: '60px',
                            marginBottom: '1rem'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)' }}>
                            {existingMemo ? new Date(existingMemo.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {existingMemo && (
                                <button onClick={onDelete} style={{ color: 'var(--color-fg-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => onRegister(confidence, note)}
                                style={{
                                    background: 'var(--color-fg)',
                                    color: 'var(--color-bg)',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {existingMemo ? 'Update' : 'Register'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
