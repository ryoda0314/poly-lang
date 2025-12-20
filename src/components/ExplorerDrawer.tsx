"use client";

import React, { useEffect } from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import { motion } from "framer-motion";
import { X, ArrowLeft, Trash2, Maximize2, Minimize2, Volume2 } from "lucide-react";
import styles from "./ExplorerDrawer.module.css";
import TokenizedSentence from "@/components/TokenizedSentence";
import clsx from "clsx";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";

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
    const { activeLanguageCode } = useAppStore();
    const [audioLoading, setAudioLoading] = React.useState<string | null>(null);

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
                <div className={styles.dateBreak}><span>Examples</span></div>
                {currentStep.examples.map((ex) => (
                    <div key={ex.id} className={styles.exampleCard}>
                        <div className={styles.exampleTarget}>
                            <TokenizedSentence text={ex.text} />
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
