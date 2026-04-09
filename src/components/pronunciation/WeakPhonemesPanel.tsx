"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import styles from "./WeakPhonemesPanel.module.css";

interface PhonemeStats {
    phoneme: string;
    avgScore: number;
    count: number;
    lowCount: number;
}

function getScoreColor(score: number): string {
    if (score >= 80) return "var(--color-success-fg, #10b981)";
    if (score >= 60) return "#b45309";
    return "#ef4444";
}

function getScoreBg(score: number): string {
    if (score >= 80) return "rgba(45, 212, 191, 0.1)";
    if (score >= 60) return "rgba(250, 204, 21, 0.1)";
    return "rgba(239, 68, 68, 0.08)";
}

export function WeakPhonemesPanel() {
    const [phonemes, setPhonemes] = useState<PhonemeStats[]>([]);
    const [totalRuns, setTotalRuns] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/pronunciation/weak-phonemes")
            .then(r => r.json())
            .then(data => {
                setPhonemes(data.phonemes ?? []);
                setTotalRuns(data.totalRuns ?? 0);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>Loading...</div>
            </div>
        );
    }

    const weakOnes = phonemes.filter(p => p.avgScore < 70);
    const strongOnes = phonemes.filter(p => p.avgScore >= 70).slice(-5).reverse();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Your Phoneme Stats</h3>
                {totalRuns > 0 && (
                    <span className={styles.runCount}>{totalRuns} sessions</span>
                )}
            </div>

            {totalRuns === 0 ? (
                <div className={styles.emptyState}>
                    <p>Record a sentence to start tracking your pronunciation.</p>
                    <p className={styles.emptyHint}>Your weak phonemes will appear here after a few practice sessions.</p>
                </div>
            ) : (
                <>
                    {/* Weak phonemes */}
                    {weakOnes.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <TrendingDown size={14} />
                                <span>Needs Practice</span>
                            </div>
                            <div className={styles.phonemeGrid}>
                                {weakOnes.map(p => (
                                    <div
                                        key={p.phoneme}
                                        className={styles.phonemeCard}
                                        style={{ background: getScoreBg(p.avgScore), borderColor: `${getScoreColor(p.avgScore)}30` }}
                                    >
                                        <span className={styles.phonemeSymbol}>/{p.phoneme}/</span>
                                        <span className={styles.phonemeAvg} style={{ color: getScoreColor(p.avgScore) }}>
                                            {p.avgScore}
                                        </span>
                                        <span className={styles.phonemeCount}>
                                            {p.lowCount}/{p.count} low
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Strong phonemes */}
                    {strongOnes.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span>Well Pronounced</span>
                            </div>
                            <div className={styles.phonemeGrid}>
                                {strongOnes.map(p => (
                                    <div
                                        key={p.phoneme}
                                        className={styles.phonemeCard}
                                        style={{ background: getScoreBg(p.avgScore), borderColor: `${getScoreColor(p.avgScore)}30` }}
                                    >
                                        <span className={styles.phonemeSymbol}>/{p.phoneme}/</span>
                                        <span className={styles.phonemeAvg} style={{ color: getScoreColor(p.avgScore) }}>
                                            {p.avgScore}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {weakOnes.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No weak phonemes found! Keep practicing to get more data.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
