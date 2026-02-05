"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useAppStore } from "@/store/app-context";
import { useLongTextStore } from "@/store/long-text-store";
import { useExplorer } from "@/hooks/use-explorer";
import { useAwarenessStore } from "@/store/awareness-store";
import { useSettingsStore } from "@/store/settings-store";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import MemoDropZone from "@/components/MemoDropZone";
import SentenceReader from "@/components/long-text/SentenceReader";
import styles from "./page.module.css";

export default function LongTextReaderPage() {
    const params = useParams();
    const textId = params.textId as string;

    const { activeLanguageCode } = useAppStore();
    const {
        currentText,
        currentProgress,
        isLoadingText,
        loadText,
        markSentenceCompleted,
        clearCurrentText,
    } = useLongTextStore();

    const { drawerState, closeExplorer } = useExplorer();
    const { isMemoMode } = useAwarenessStore();
    const { playbackSpeed, ttsVoice, ttsLearnerMode } = useSettingsStore();

    const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
    const sentenceRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Load text on mount
    useEffect(() => {
        if (textId) {
            loadText(textId);
        }
        return () => {
            clearCurrentText();
        };
    }, [textId, loadText, clearCurrentText]);

    const handlePlayAudio = useCallback(async (index: number, text: string) => {
        if (audioLoadingIndex !== null) return;

        setAudioLoadingIndex(index);
        try {
            const result = await generateSpeech(
                text,
                activeLanguageCode || "en",
                ttsVoice,
                ttsLearnerMode
            );

            if (result && "data" in result) {
                await playBase64Audio(result.data, {
                    mimeType: result.mimeType,
                    playbackRate: playbackSpeed,
                });
            } else if ("speechSynthesis" in window) {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = activeLanguageCode === "zh" ? "zh-CN" : activeLanguageCode || "en";
                u.rate = playbackSpeed;
                window.speechSynthesis.speak(u);
            }
        } catch (error) {
            console.error("Audio playback error:", error);
        } finally {
            setAudioLoadingIndex(null);
        }
    }, [activeLanguageCode, ttsVoice, ttsLearnerMode, playbackSpeed, audioLoadingIndex]);

    const handleMarkCompleted = useCallback((index: number) => {
        markSentenceCompleted(index);
    }, [markSentenceCompleted]);

    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;
    const completedSentences = currentProgress?.completed_sentences || [];

    if (isLoadingText) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    if (!currentText) {
        return (
            <div className={styles.container}>
                <div className={styles.notFound}>
                    <p>長文が見つかりませんでした</p>
                    <Link href="/app/long-text" className={styles.backLink}>
                        一覧に戻る
                    </Link>
                </div>
            </div>
        );
    }

    const completedCount = completedSentences.length;
    const totalCount = currentText.sentences.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div
            className={clsx(
                styles.container,
                isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed
            )}
        >
            <div className={styles.leftArea}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/app/long-text" className={styles.backBtn}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{currentText.title}</h1>
                        <div className={styles.progressInfo}>
                            <span className={styles.progressText}>
                                {completedCount} / {totalCount}
                            </span>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* MemoDropZone (Desktop) */}
                <div className={styles.desktopOnly}>
                    <div className={styles.memoZoneWrapper}>
                        <MemoDropZone />
                    </div>
                </div>

                {/* Main Content - Multiple Cards */}
                <div className={styles.scrollArea}>
                    <div className={styles.sentenceList}>
                        {currentText.sentences.map((sentence, index) => (
                            <div
                                key={sentence.id}
                                ref={(el) => {
                                    if (el) sentenceRefs.current.set(index, el);
                                }}
                                className={clsx(
                                    styles.sentenceCard,
                                    completedSentences.includes(index) && styles.sentenceCardCompleted
                                )}
                            >
                                <SentenceReader
                                    sentence={sentence}
                                    currentIndex={index}
                                    totalSentences={totalCount}
                                    onPlayAudio={() => handlePlayAudio(index, sentence.text)}
                                    audioLoading={audioLoadingIndex === index}
                                    isCompleted={completedSentences.includes(index)}
                                    onMarkCompleted={() => handleMarkCompleted(index)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* MemoDropZone (Mobile) */}
                    <div className={styles.mobileOnly}>
                        <MemoDropZone expandedLayout={true} />
                    </div>
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
