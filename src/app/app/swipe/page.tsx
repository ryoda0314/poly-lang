"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { useAppStore } from "@/store/app-context";
import { PHRASES, Phrase } from "@/lib/data";
import { translations } from "@/lib/translations";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Volume2, X, Heart, RotateCcw } from "lucide-react";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { tryPlayPreGenerated } from "@/lib/tts-storage";
import { useSettingsStore } from "@/store/settings-store";
import styles from "./swipe.module.css";
import clsx from "clsx";

interface SwipeCardProps {
    phrase: Phrase;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
}

function SwipeCard({ phrase, onSwipe, isTop }: SwipeCardProps) {
    const { activeLanguageCode, nativeLanguage, profile } = useAppStore();
    const { playbackSpeed, ttsVoice, ttsLearnerMode } = useSettingsStore();
    const [isFlipped, setIsFlipped] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

    // Overlay indicators
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const targetText = phrase.translations?.[activeLanguageCode] || "";
    const rawTokens = phrase.tokensMap?.[activeLanguageCode] || [];
    // Ensure tokens is a flat string array (not string[][])
    const tokens = Array.isArray(rawTokens) && rawTokens.length > 0 && Array.isArray(rawTokens[0])
        ? (rawTokens as string[][]).flat()
        : (rawTokens as string[]);
    const nativeText = phrase.translations?.[nativeLanguage] || phrase.translations?.["en"] || "";

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            setExitDirection("right");
            onSwipe("right");
        } else if (info.offset.x < -threshold) {
            setExitDirection("left");
            onSwipe("left");
        }
    };

    const playAudio = async () => {
        if (audioLoading) return;
        setAudioLoading(true);

        try {
            // Try pre-generated first
            const played = await tryPlayPreGenerated(
                phrase.id,
                activeLanguageCode,
                playbackSpeed
            );

            if (!played) {
                // Fall back to API
                const result = await generateSpeech(targetText, activeLanguageCode, ttsVoice, ttsLearnerMode);

                if (result && 'data' in result) {
                    await playBase64Audio(result.data);
                }
            }
        } catch (error) {
            console.error("Audio playback failed:", error);
        } finally {
            setAudioLoading(false);
        }
    };

    const handleCardTap = (e: React.MouseEvent | React.TouchEvent) => {
        // Don't flip if clicking on a button
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        // Only flip if not dragging (small movement threshold)
        if (Math.abs(x.get()) < 10) {
            setIsFlipped(!isFlipped);
        }
    };

    if (!isTop) {
        return (
            <motion.div className={styles.card} style={{ scale: 0.95, y: 10 }}>
                <div className={styles.cardInner}>
                    <div className={styles.cardFront}>
                        <div className={styles.targetText}>
                            <TokenizedSentence
                                text={targetText}
                                tokens={tokens}
                                phraseId={phrase.id}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.card}
            style={{ x, rotate, opacity }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 1, y: 0 }}
            animate={
                exitDirection
                    ? { x: exitDirection === "right" ? 500 : -500, opacity: 0, rotate: exitDirection === "right" ? 30 : -30 }
                    : { scale: 1, y: 0 }
            }
            exit={{ x: exitDirection === "right" ? 500 : -500, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            onClick={handleCardTap}
        >
            {/* Like indicator */}
            <motion.div className={clsx(styles.indicator, styles.likeIndicator)} style={{ opacity: likeOpacity }}>
                <Heart size={32} />
                <span>LIKE</span>
            </motion.div>

            {/* Nope indicator */}
            <motion.div className={clsx(styles.indicator, styles.nopeIndicator)} style={{ opacity: nopeOpacity }}>
                <X size={32} />
                <span>SKIP</span>
            </motion.div>

            <div className={clsx(styles.cardInner, isFlipped && styles.cardFlipped)}>
                {/* Front face - Target language */}
                <div className={styles.cardFront}>
                    <div className={styles.targetText}>
                        <TokenizedSentence
                            text={targetText}
                            tokens={tokens}
                            phraseId={phrase.id}
                        />
                    </div>

                    {/* Audio button */}
                    <button
                        className={styles.audioButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            playAudio();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={audioLoading}
                    >
                        <Volume2 size={24} className={audioLoading ? styles.audioLoading : ""} />
                    </button>

                    <div className={styles.flipHint}>
                        <span>タップで裏返す</span>
                    </div>
                </div>

                {/* Back face - Native translation */}
                <div className={styles.cardBack}>
                    <div className={styles.nativeTextLarge}>
                        {nativeText}
                    </div>

                    {/* Audio button on back too */}
                    <button
                        className={styles.audioButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            playAudio();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={audioLoading}
                    >
                        <Volume2 size={24} className={audioLoading ? styles.audioLoading : ""} />
                    </button>

                    <div className={styles.flipHint}>
                        <span>タップで戻す</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function SwipePage() {
    const { activeLanguageCode, nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [likedPhrases, setLikedPhrases] = useState<Phrase[]>([]);
    const [skippedPhrases, setSkippedPhrases] = useState<Phrase[]>([]);
    const [history, setHistory] = useState<{ phrase: Phrase; action: "like" | "skip" }[]>([]);

    // Filter phrases for current language
    const phrases = useMemo(() => {
        return PHRASES.filter((p) => p.translations?.[activeLanguageCode]);
    }, [activeLanguageCode]);

    const currentPhrase = phrases[currentIndex];
    const nextPhrase = phrases[currentIndex + 1];

    const handleSwipe = (direction: "left" | "right") => {
        if (!currentPhrase) return;

        if (direction === "right") {
            setLikedPhrases((prev) => [...prev, currentPhrase]);
            setHistory((prev) => [...prev, { phrase: currentPhrase, action: "like" }]);
        } else {
            setSkippedPhrases((prev) => [...prev, currentPhrase]);
            setHistory((prev) => [...prev, { phrase: currentPhrase, action: "skip" }]);
        }

        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 200);
    };

    const handleUndo = () => {
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];
        setHistory((prev) => prev.slice(0, -1));

        if (lastAction.action === "like") {
            setLikedPhrases((prev) => prev.slice(0, -1));
        } else {
            setSkippedPhrases((prev) => prev.slice(0, -1));
        }

        setCurrentIndex((prev) => prev - 1);
    };

    const handleButtonSwipe = (direction: "left" | "right") => {
        handleSwipe(direction);
    };

    if (currentIndex >= phrases.length) {
        return (
            <div className={styles.container}>
                <div className={styles.completedState}>
                    <h2>🎉 完了!</h2>
                    <p>すべてのフレーズを確認しました</p>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <Heart size={24} className={styles.likeIcon} />
                            <span>{likedPhrases.length} いいね</span>
                        </div>
                        <div className={styles.statItem}>
                            <X size={24} className={styles.skipIcon} />
                            <span>{skippedPhrases.length} スキップ</span>
                        </div>
                    </div>
                    <button
                        className={styles.restartButton}
                        onClick={() => {
                            setCurrentIndex(0);
                            setLikedPhrases([]);
                            setSkippedPhrases([]);
                            setHistory([]);
                        }}
                    >
                        もう一度
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>スワイプ学習</h1>
                <div className={styles.progress}>
                    {currentIndex + 1} / {phrases.length}
                </div>
            </div>

            {/* Card Stack */}
            <div className={styles.cardStack}>
                <AnimatePresence mode="popLayout">
                    {nextPhrase && (
                        <SwipeCard
                            key={nextPhrase.id}
                            phrase={nextPhrase}
                            onSwipe={() => {}}
                            isTop={false}
                        />
                    )}
                    {currentPhrase && (
                        <SwipeCard
                            key={currentPhrase.id}
                            phrase={currentPhrase}
                            onSwipe={handleSwipe}
                            isTop={true}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
                <button
                    className={clsx(styles.actionButton, styles.undoButton)}
                    onClick={handleUndo}
                    disabled={history.length === 0}
                >
                    <RotateCcw size={24} />
                </button>

                <button
                    className={clsx(styles.actionButton, styles.skipButton)}
                    onClick={() => handleButtonSwipe("left")}
                >
                    <X size={32} />
                </button>

                <button
                    className={clsx(styles.actionButton, styles.likeButton)}
                    onClick={() => handleButtonSwipe("right")}
                >
                    <Heart size={32} />
                </button>
            </div>

            {/* Stats bar */}
            <div className={styles.statsBar}>
                <span className={styles.likedCount}>
                    <Heart size={16} /> {likedPhrases.length}
                </span>
                <span className={styles.skippedCount}>
                    <X size={16} /> {skippedPhrases.length}
                </span>
            </div>
        </div>
    );
}
