"use client";

import { useEffect, useState, useCallback } from "react";
import { Play } from "lucide-react";
import {
    ENGLISH_PHONEMES,
    PHONEME_CATEGORIES,
    type EnglishPhoneme,
    type PhonemeCategory,
} from "@/data/english-phonemes";
import styles from "./PhonemeEncyclopedia.module.css";

interface PhonemeStats {
    phoneme: string;
    avgScore: number;
    count: number;
    lowCount: number;
}

type FilterMode = "all" | "weak" | "strong" | "unattempted";

function getScoreColor(score: number): string {
    if (score >= 80) return "var(--color-success-fg, #10b981)";
    if (score >= 60) return "#b45309";
    return "#ef4444";
}

function getCardBg(score: number | null): string {
    if (score === null) return "var(--color-surface)";
    if (score >= 80) return "rgba(45, 212, 191, 0.06)";
    if (score >= 60) return "rgba(250, 204, 21, 0.06)";
    return "rgba(239, 68, 68, 0.06)";
}

function getCardBorder(score: number | null): string {
    if (score === null) return "var(--color-border)";
    if (score >= 80) return "rgba(45, 212, 191, 0.3)";
    if (score >= 60) return "rgba(250, 204, 21, 0.3)";
    return "rgba(239, 68, 68, 0.25)";
}

interface PhonemeEncyclopediaProps {
    onPracticePhoneme?: (symbol: string) => void;
}

export function PhonemeEncyclopedia({ onPracticePhoneme }: PhonemeEncyclopediaProps) {
    const [statsMap, setStatsMap] = useState<Map<string, PhonemeStats>>(new Map());
    const [totalRuns, setTotalRuns] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterMode>("all");
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/pronunciation/weak-phonemes?all=true")
            .then((r) => r.json())
            .then((data) => {
                const map = new Map<string, PhonemeStats>();
                for (const p of data.phonemes ?? []) {
                    map.set(p.phoneme, p);
                }
                setStatsMap(map);
                setTotalRuns(data.totalRuns ?? 0);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const getFilteredPhonemes = useCallback(
        (category: PhonemeCategory): EnglishPhoneme[] => {
            const categoryPhonemes = ENGLISH_PHONEMES.filter((p) => p.category === category);
            if (filter === "all") return categoryPhonemes;

            return categoryPhonemes.filter((p) => {
                const stats = statsMap.get(p.symbol);
                switch (filter) {
                    case "weak":
                        return stats && stats.avgScore < 70;
                    case "strong":
                        return stats && stats.avgScore >= 70;
                    case "unattempted":
                        return !stats;
                    default:
                        return true;
                }
            });
        },
        [filter, statsMap],
    );

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Phoneme Encyclopedia</h2>
                {totalRuns > 0 && (
                    <span className={styles.sessionCount}>{totalRuns} sessions</span>
                )}
            </div>

            {/* Filters */}
            <div className={styles.filterRow}>
                {(
                    [
                        { key: "all", label: "All" },
                        { key: "weak", label: "Weak (<70)" },
                        { key: "strong", label: "Strong" },
                        { key: "unattempted", label: "Not tested" },
                    ] as { key: FilterMode; label: string }[]
                ).map((f) => (
                    <button
                        key={f.key}
                        className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Category sections */}
            {PHONEME_CATEGORIES.map((cat) => {
                const phonemes = getFilteredPhonemes(cat.key);
                if (phonemes.length === 0) return null;

                return (
                    <div key={cat.key} className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionTitle}>{cat.label}</span>
                            <span className={styles.sectionTitleJa}>{cat.labelJa}</span>
                        </div>
                        <div className={styles.cardGrid}>
                            {phonemes.map((phoneme) => {
                                const stats = statsMap.get(phoneme.symbol);
                                const isExpanded = expandedSymbol === phoneme.symbol;

                                return (
                                    <div
                                        key={phoneme.symbol}
                                        role="button"
                                        tabIndex={0}
                                        className={styles.card}
                                        style={{
                                            background: getCardBg(stats?.avgScore ?? null),
                                            borderColor: getCardBorder(stats?.avgScore ?? null),
                                        }}
                                        onClick={() =>
                                            setExpandedSymbol(isExpanded ? null : phoneme.symbol)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setExpandedSymbol(isExpanded ? null : phoneme.symbol);
                                            }
                                        }}
                                    >
                                        <div className={styles.cardTop}>
                                            <span className={styles.symbol}>/{phoneme.symbol}/</span>
                                            {phoneme.hard && (
                                                <span className={styles.hardBadge}>Hard</span>
                                            )}
                                        </div>
                                        <span className={styles.example}>
                                            {phoneme.example} {phoneme.ipa}
                                        </span>

                                        {stats ? (
                                            <div className={styles.scoreRow}>
                                                <span
                                                    className={styles.score}
                                                    style={{ color: getScoreColor(stats.avgScore) }}
                                                >
                                                    {stats.avgScore}
                                                </span>
                                                <span className={styles.count}>
                                                    {stats.count}x
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={styles.noData}>--</span>
                                        )}

                                        {isExpanded && (
                                            <div className={styles.detail}>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Approx</span>
                                                    <span className={styles.detailValue}>
                                                        {phoneme.approx}
                                                    </span>
                                                </div>
                                                {stats && stats.lowCount > 0 && (
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>Low</span>
                                                        <span className={styles.detailValue}>
                                                            {stats.lowCount}/{stats.count} times below 60
                                                        </span>
                                                    </div>
                                                )}
                                                <p className={styles.tipText}>{phoneme.tip}</p>
                                                {onPracticePhoneme && (
                                                    <button
                                                        className={styles.practiceBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onPracticePhoneme(phoneme.symbol);
                                                        }}
                                                    >
                                                        <Play size={12} />
                                                        Practice
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* If all sections are empty after filtering */}
            {PHONEME_CATEGORIES.every((cat) => getFilteredPhonemes(cat.key).length === 0) && (
                <div className={styles.emptySection}>
                    {filter === "weak" && "No weak phonemes found yet. Keep practicing!"}
                    {filter === "unattempted" && "All phonemes have been tested at least once!"}
                    {filter === "strong" && "No strong phonemes yet. Record more sentences to build your stats."}
                </div>
            )}
        </div>
    );
}
