"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, ChevronDown } from "lucide-react";
import { ScoreGauge } from "./ScoreGauge";
import type { AzureEvaluationResult, AzureWordResult } from "@/types/pronunciation";
import styles from "./AzureResultPanel.module.css";

interface AzureResultPanelProps {
    result: AzureEvaluationResult;
    onRetry: () => void;
}

function getScoreColor(score: number): string {
    if (score >= 80) return "var(--color-success-fg, #10b981)";
    if (score >= 60) return "#b45309";
    return "#ef4444";
}

function getScoreBg(score: number): string {
    if (score >= 80) return "rgba(45, 212, 191, 0.12)";
    if (score >= 60) return "rgba(250, 204, 21, 0.15)";
    return "rgba(239, 68, 68, 0.12)";
}

function getScoreBorder(score: number): string {
    if (score >= 80) return "rgba(45, 212, 191, 0.3)";
    if (score >= 60) return "rgba(250, 204, 21, 0.3)";
    return "rgba(239, 68, 68, 0.3)";
}

export function AzureResultPanel({ result, onRetry }: AzureResultPanelProps) {
    const { scores, words, feedback } = result;

    // Collect weak phonemes (score < 60) across all words
    const weakPhonemes = new Map<string, number[]>();
    for (const w of words) {
        for (const p of w.phonemes) {
            if (p.accuracyScore < 60) {
                const existing = weakPhonemes.get(p.phoneme) ?? [];
                existing.push(p.accuracyScore);
                weakPhonemes.set(p.phoneme, existing);
            }
        }
    }
    const sortedWeak = [...weakPhonemes.entries()]
        .map(([phoneme, scores]) => ({
            phoneme,
            avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            count: scores.length,
        }))
        .sort((a, b) => a.avgScore - b.avgScore);

    return (
        <div className={styles.container}>
            {/* Score gauge */}
            <motion.div
                className={styles.gaugeWrapper}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <ScoreGauge score={Math.round(scores.overall)} />
            </motion.div>

            {/* 4-axis compact scores */}
            <motion.div
                className={styles.axisGrid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {([
                    { label: "Accuracy", value: scores.accuracy },
                    { label: "Fluency", value: scores.fluency },
                    { label: "Completeness", value: scores.completeness },
                    { label: "Prosody", value: scores.prosody },
                ] as const).map(({ label, value }) => (
                    <div key={label} className={styles.axisItem}>
                        <div className={styles.axisLabel}>
                            <span>{label}</span>
                            <span style={{ color: getScoreColor(value), fontWeight: 700 }}>{Math.round(value)}</span>
                        </div>
                        <div className={styles.axisBar}>
                            <motion.div
                                className={styles.axisFill}
                                style={{ background: getScoreColor(value) }}
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            />
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Inline word display — colored by score, tap to expand phonemes */}
            {words.length > 0 && (
                <motion.div
                    className={styles.wordSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className={styles.wordSectionLabel}>Word Analysis</div>
                    <div className={styles.inlineWords}>
                        {words.map((word, idx) => (
                            <InlineWord key={idx} word={word} />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Weak phonemes summary */}
            {sortedWeak.length > 0 && (
                <motion.div
                    className={styles.weakSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className={styles.wordSectionLabel}>Focus Areas</div>
                    <div className={styles.weakGrid}>
                        {sortedWeak.map(({ phoneme, avgScore }) => (
                            <div key={phoneme} className={styles.weakItem}>
                                <span className={styles.weakPhoneme}>/{phoneme}/</span>
                                <span className={styles.weakScore} style={{ color: getScoreColor(avgScore) }}>
                                    {avgScore}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Feedback */}
            {feedback && (
                <motion.div
                    className={styles.feedbackBox}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <span className={styles.feedbackLabel}>Feedback</span>
                    <p className={styles.feedbackText}>{feedback}</p>
                </motion.div>
            )}

            {/* Retry */}
            <button className={styles.retryBtn} onClick={onRetry}>
                <RefreshCcw size={16} />
                Try Again
            </button>
        </div>
    );
}

function InlineWord({ word }: { word: AzureWordResult }) {
    const [expanded, setExpanded] = useState(false);
    const score = word.accuracyScore;
    const hasError = word.errorType !== "None";
    const hasWeakPhonemes = word.phonemes.some(p => p.accuracyScore < 70);
    const isExpandable = word.phonemes.length > 0 && (hasWeakPhonemes || hasError);

    return (
        <div className={styles.inlineWordWrapper}>
            <button
                className={`${styles.inlineWordBtn} ${expanded ? styles.inlineWordExpanded : ""}`}
                style={{
                    color: getScoreColor(score),
                    background: hasError ? getScoreBg(score) : score < 80 ? getScoreBg(score) : "transparent",
                    borderColor: hasError || score < 80 ? getScoreBorder(score) : "transparent",
                    cursor: isExpandable ? "pointer" : "default",
                }}
                onClick={() => isExpandable && setExpanded(!expanded)}
            >
                <span className={styles.inlineWordText}>{word.word}</span>
                <span className={styles.inlineWordScore}>{Math.round(score)}</span>
                {hasError && (
                    <span className={styles.inlineWordError}>{word.errorType}</span>
                )}
                {isExpandable && (
                    <ChevronDown
                        size={12}
                        className={styles.inlineWordChevron}
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
                    />
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className={styles.phonemeDropdown}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={styles.phonemeRow}>
                            {word.phonemes.map((p, i) => (
                                <span
                                    key={i}
                                    className={styles.phonemeBadge}
                                    style={{
                                        background: getScoreBg(p.accuracyScore),
                                        color: getScoreColor(p.accuracyScore),
                                        borderColor: getScoreBorder(p.accuracyScore),
                                    }}
                                >
                                    <span className={styles.phonemeText}>/{p.phoneme}/</span>
                                    <span className={styles.phonemeScore}>{Math.round(p.accuracyScore)}</span>
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
