"use client";

import { useEffect } from "react";
import { Clock } from "lucide-react";
import { useSentenceAnalysisStore } from "@/store/sentence-analysis-store";
import styles from "./AnalysisHistory.module.css";

interface Props {
    onSelect: (sentence: string) => void;
    disabled?: boolean;
}

const DIFFICULTY_LABELS: Record<string, string> = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}日前`;
    return `${Math.floor(days / 30)}ヶ月前`;
}

export default function AnalysisHistory({ onSelect, disabled }: Props) {
    const { history, historyLoaded, loadHistory } = useSentenceAnalysisStore();

    useEffect(() => {
        if (!historyLoaded) loadHistory();
    }, [historyLoaded, loadHistory]);

    if (!historyLoaded || history.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <Clock size={14} />
                <span>最近の解析</span>
            </div>
            <div className={styles.list}>
                {history.map((entry) => (
                    <button
                        key={entry.id}
                        className={styles.item}
                        onClick={() => onSelect(entry.sentence)}
                        disabled={disabled}
                    >
                        <span className={styles.sentence}>{entry.sentence}</span>
                        <div className={styles.meta}>
                            {entry.sentencePatternLabel && (
                                <span className={styles.patternBadge}>
                                    {entry.sentencePatternLabel}
                                </span>
                            )}
                            {entry.difficulty && (
                                <span className={styles.difficultyBadge} data-difficulty={entry.difficulty}>
                                    {DIFFICULTY_LABELS[entry.difficulty] ?? entry.difficulty}
                                </span>
                            )}
                            <span className={styles.time}>{timeAgo(entry.createdAt)}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
