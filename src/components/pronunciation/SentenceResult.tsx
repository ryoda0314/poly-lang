"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, ChevronRight } from "lucide-react";
import type { AzureEvaluationResult, AzureWordResult } from "@/types/pronunciation";
import styles from "./SentenceResult.module.css";

interface SentenceResultProps {
    result: AzureEvaluationResult;
    previousScore?: number;
    onRetry: () => void;
    onNext: () => void;
    hasNext: boolean;
}

function getScoreColor(score: number): string {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#b45309";
    return "#ef4444";
}

function getWordBg(score: number, errorType: string): string {
    if (errorType === "Omission") return "rgba(156, 163, 175, 0.15)";
    if (score >= 80) return "rgba(16, 185, 129, 0.12)";
    if (score >= 60) return "rgba(245, 158, 11, 0.12)";
    return "rgba(239, 68, 68, 0.12)";
}

function getPhonemeColor(score: number): string {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#b45309";
    return "#ef4444";
}

function getPhonemeBg(score: number): string {
    if (score >= 80) return "rgba(16, 185, 129, 0.1)";
    if (score >= 60) return "rgba(245, 158, 11, 0.1)";
    return "rgba(239, 68, 68, 0.08)";
}

function ColoredWord({ word, index }: { word: AzureWordResult; index: number }) {
    const [showPopup, setShowPopup] = useState(false);
    const color = word.errorType === "Omission" ? "#9ca3af" : getScoreColor(word.accuracyScore);
    const bg = getWordBg(word.accuracyScore, word.errorType);
    const hasPhonemes = word.phonemes.length > 0;

    return (
        <motion.button
            className={styles.word}
            style={{ color, background: bg }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.3 }}
            onClick={() => hasPhonemes && setShowPopup(!showPopup)}
            onBlur={() => setShowPopup(false)}
        >
            <span className={`${styles.wordText} ${word.errorType === "Omission" ? styles.wordOmission : ""}`}>
                {word.word}
            </span>
            <span className={styles.wordScore}>{Math.round(word.accuracyScore)}</span>

            {showPopup && hasPhonemes && (
                <div className={styles.phonemePopup}>
                    {word.phonemes.map((p, i) => (
                        <span
                            key={i}
                            className={styles.phonemeBadge}
                            style={{
                                background: getPhonemeBg(p.accuracyScore),
                                color: getPhonemeColor(p.accuracyScore),
                                borderColor: `${getPhonemeColor(p.accuracyScore)}30`,
                            }}
                        >
                            <span className={styles.phonemeSymbol}>/{p.phoneme}/</span>
                            <span className={styles.phonemeScoreText}>{Math.round(p.accuracyScore)}</span>
                        </span>
                    ))}
                </div>
            )}
        </motion.button>
    );
}

export function SentenceResult({ result, previousScore, onRetry, onNext, hasNext }: SentenceResultProps) {
    const { scores, words } = result;
    const overall = Math.round(scores.overall);
    const diff = previousScore != null ? overall - Math.round(previousScore) : null;

    return (
        <div className={styles.container}>
            {/* Color-coded sentence */}
            <div className={styles.sentence}>
                {words.map((word, i) => (
                    <ColoredWord key={i} word={word} index={i} />
                ))}
            </div>

            {/* Overall score + diff */}
            <motion.div
                className={styles.scoreSection}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                <div>
                    <span className={styles.overallScore} style={{ color: getScoreColor(overall) }}>
                        {overall}
                    </span>
                    {diff != null && diff !== 0 && (
                        <span className={`${styles.scoreDiff} ${diff > 0 ? styles.scoreDiffPositive : styles.scoreDiffNegative}`}>
                            {diff > 0 ? `+${diff}` : diff}
                        </span>
                    )}
                </div>

                {/* 4-axis mini bars */}
                <div className={styles.axisMini}>
                    {([
                        { label: "Acc", value: scores.accuracy },
                        { label: "Flu", value: scores.fluency },
                        { label: "Com", value: scores.completeness },
                        { label: "Pro", value: scores.prosody },
                    ] as const).map(({ label, value }) => (
                        <div key={label} className={styles.axisItem}>
                            <span className={styles.axisLabel}>{label}</span>
                            <span className={styles.axisValue} style={{ color: getScoreColor(value) }}>
                                {Math.round(value)}
                            </span>
                            <div className={styles.axisBar}>
                                <motion.div
                                    className={styles.axisFill}
                                    style={{ background: getScoreColor(value) }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${value}%` }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                className={styles.actions}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <button className={styles.retryBtn} onClick={onRetry}>
                    <RefreshCcw size={16} />
                    Try Again
                </button>
                <button className={styles.nextBtn} onClick={onNext} disabled={!hasNext}>
                    Next
                    <ChevronRight size={16} />
                </button>
            </motion.div>
        </div>
    );
}
