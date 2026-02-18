"use client";

import { useEffect, useState, useMemo } from "react";
import { Mic, BookOpen, ChevronRight, TrendingUp, Target, Zap, MessageSquare } from "lucide-react";
import { sentences } from "@/data/pronunciation-sentences";
import styles from "./PronunciationHome.module.css";

interface PhonemeStats {
    phoneme: string;
    avgScore: number;
    count: number;
    lowCount: number;
}

interface SentenceScoreData {
    bestScore: number;
    attempts: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: "#10b981",
    medium: "#f59e0b",
    hard: "#ef4444",
};

function getScoreColor(score: number): string {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
}

function ScoreRing({ score, size = 120, stroke = 9 }: { score: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
        <div className={styles.ringWrapper} style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className={styles.ringProgress}
                />
            </svg>
            <div className={styles.ringCenter}>
                <span className={styles.ringScore} style={{ color }}>{score}</span>
                <span className={styles.ringLabel}>平均スコア</span>
            </div>
        </div>
    );
}

interface PronunciationHomeProps {
    onStartPractice: () => void;
    onOpenEncyclopedia: () => void;
    onFreeSpeech: () => void;
    onPracticePhoneme: (symbol: string) => void;
}

export function PronunciationHome({ onStartPractice, onOpenEncyclopedia, onFreeSpeech, onPracticePhoneme }: PronunciationHomeProps) {
    const [phonemes, setPhonemes] = useState<PhonemeStats[]>([]);
    const [totalRuns, setTotalRuns] = useState(0);
    const [sentenceScores, setSentenceScores] = useState<Record<string, SentenceScoreData>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/pronunciation/weak-phonemes")
                .then(r => r.json())
                .then(data => {
                    setPhonemes(data.phonemes ?? []);
                    setTotalRuns(data.totalRuns ?? 0);
                }),
            fetch("/api/pronunciation/sentence-scores")
                .then(r => r.json())
                .then(data => setSentenceScores(data.scores ?? {})),
        ])
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const weakPhonemes = useMemo(() => phonemes.filter(p => p.avgScore < 70), [phonemes]);

    const stats = useMemo(() => {
        const entries = Object.entries(sentenceScores);
        const practiced = entries.length;
        const totalAttempts = entries.reduce((sum, [, v]) => sum + v.attempts, 0);
        const avgScore = practiced > 0
            ? Math.round(entries.reduce((sum, [, v]) => sum + v.bestScore, 0) / practiced)
            : 0;
        const mastered = entries.filter(([, v]) => v.bestScore >= 85).length;
        return { practiced, totalAttempts, avgScore, mastered };
    }, [sentenceScores]);

    const recommended = useMemo(() => {
        if (weakPhonemes.length === 0) return [];
        const weakSet = new Set(weakPhonemes.map(p => p.phoneme));
        return sentences
            .filter(s => {
                const sp = s.phonemes ?? [];
                const hasWeak = sp.some(p => weakSet.has(p));
                const score = sentenceScores[s.id];
                const notMastered = !score || score.bestScore < 85;
                return hasWeak && notMastered;
            })
            .slice(0, 3);
    }, [weakPhonemes, sentenceScores]);

    const hasData = totalRuns > 0;
    const progressPct = Math.round((stats.practiced / sentences.length) * 100);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.loadingDot} />
                    <div className={styles.loadingDot} />
                    <div className={styles.loadingDot} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.inner}>

                {/* ── Header ── */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>発音練習</h1>
                    <p className={styles.pageSubtitle}>スピーキングの進捗を確認</p>
                </div>

                {/* ── Score Card ── */}
                {hasData ? (
                    <div className={styles.scoreCard}>
                        <div className={styles.scoreLeft}>
                            <ScoreRing score={stats.avgScore} />
                        </div>
                        <div className={styles.scoreRight}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{stats.totalAttempts}</span>
                                <span className={styles.statLabel}>回数</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>
                                    {stats.practiced}
                                    <span className={styles.statMuted}>/{sentences.length}</span>
                                </span>
                                <span className={styles.statLabel}>文章</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}>
                                <span className={styles.statValue} style={{ color: "#10b981" }}>{stats.mastered}</span>
                                <span className={styles.statLabel}>マスター</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyCard}>
                        <div className={styles.emptyIcon}>
                            <Mic size={28} />
                        </div>
                        <div>
                            <p className={styles.emptyTitle}>練習を始めよう</p>
                            <p className={styles.emptyDesc}>例文を練習して、AIによる正確性・流暢さ・発音のフィードバックを受けよう。</p>
                        </div>
                    </div>
                )}

                {/* ── Quick Actions ── */}
                <div className={styles.actionsCard}>
                    <button className={styles.actionPrimary} onClick={onStartPractice}>
                        <div className={styles.actionIconPrimary}>
                            <Mic size={20} />
                        </div>
                        <div className={styles.actionText}>
                            <span className={styles.actionTitle}>練習開始</span>
                            <span className={styles.actionDesc}>{sentences.length} 文章</span>
                        </div>
                        <ChevronRight size={16} className={styles.actionArrow} />
                    </button>
                    <div className={styles.actionDivider} />
                    <button className={styles.actionSecondary} onClick={onFreeSpeech}>
                        <div className={styles.actionIconSecondary}>
                            <MessageSquare size={18} />
                        </div>
                        <div className={styles.actionText}>
                            <span className={styles.actionTitleSecondary}>自由スピーキング</span>
                            <span className={styles.actionDesc}>自由に話して評価を受けよう</span>
                        </div>
                        <ChevronRight size={16} className={styles.actionArrow} />
                    </button>
                    <div className={styles.actionDivider} />
                    <button className={styles.actionSecondary} onClick={onOpenEncyclopedia}>
                        <div className={styles.actionIconSecondary}>
                            <BookOpen size={18} />
                        </div>
                        <div className={styles.actionText}>
                            <span className={styles.actionTitleSecondary}>音素ガイド</span>
                            <span className={styles.actionDesc}>英語44音素</span>
                        </div>
                        <ChevronRight size={16} className={styles.actionArrow} />
                    </button>
                </div>

                {/* ── Progress Card ── */}
                {hasData && (
                    <div className={styles.progressCard}>
                        <div className={styles.progressHeader}>
                            <div className={styles.progressTitleRow}>
                                <TrendingUp size={14} className={styles.progressIcon} />
                                <span className={styles.progressTitle}>文章の進捗</span>
                            </div>
                            <span className={styles.progressPct}>{progressPct}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className={styles.progressFooter}>
                            <span>{stats.practiced} 練習済み</span>
                            <span>{stats.mastered} マスター</span>
                            <span>{sentences.length - stats.practiced} 残り</span>
                        </div>
                    </div>
                )}

                {/* ── Weak Phonemes ── */}
                {weakPhonemes.length > 0 && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Zap size={14} className={styles.cardHeaderIcon} style={{ color: "#f59e0b" }} />
                            <h2 className={styles.cardTitle}>要練習</h2>
                            <span className={styles.cardBadge}>{weakPhonemes.length}</span>
                        </div>
                        <div className={styles.phonemeList}>
                            {weakPhonemes.slice(0, 5).map((p, i) => (
                                <button
                                    key={p.phoneme}
                                    className={styles.phonemeRow}
                                    onClick={() => onPracticePhoneme(p.phoneme)}
                                >
                                    <span className={styles.phonemeRank}>#{i + 1}</span>
                                    <span className={styles.phonemeSymbol}>/{p.phoneme}/</span>
                                    <div className={styles.phonemeBarWrap}>
                                        <div className={styles.phonemeBar}>
                                            <div
                                                className={styles.phonemeBarFill}
                                                style={{
                                                    width: `${p.avgScore}%`,
                                                    background: getScoreColor(p.avgScore),
                                                }}
                                            />
                                        </div>
                                        <span className={styles.phonemeScore} style={{ color: getScoreColor(p.avgScore) }}>
                                            {p.avgScore}
                                        </span>
                                    </div>
                                    <ChevronRight size={12} className={styles.phonemeArrow} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Recommended ── */}
                {recommended.length > 0 && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Target size={14} className={styles.cardHeaderIcon} style={{ color: "var(--color-accent)" }} />
                            <h2 className={styles.cardTitle}>おすすめ</h2>
                        </div>
                        <div className={styles.recommendedList}>
                            {recommended.map(s => {
                                const scoreData = sentenceScores[s.id];
                                return (
                                    <button
                                        key={s.id}
                                        className={styles.recommendedCard}
                                        onClick={onStartPractice}
                                    >
                                        <div className={styles.recommendedMain}>
                                            <p className={styles.recommendedText}>{s.text}</p>
                                            <div className={styles.recommendedMeta}>
                                                <span
                                                    className={styles.diffBadge}
                                                    style={{
                                                        color: DIFFICULTY_COLORS[s.difficulty],
                                                        background: `${DIFFICULTY_COLORS[s.difficulty]}18`,
                                                    }}
                                                >
                                                    {s.difficulty}
                                                </span>
                                                {s.phonemes?.slice(0, 3).map(p => (
                                                    <span key={p} className={styles.phonemeTag}>/{p}/</span>
                                                ))}
                                            </div>
                                        </div>
                                        {scoreData ? (
                                            <span className={styles.recScore} style={{ color: getScoreColor(scoreData.bestScore) }}>
                                                {Math.round(scoreData.bestScore)}
                                            </span>
                                        ) : (
                                            <span className={styles.recScoreNew}>NEW</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
