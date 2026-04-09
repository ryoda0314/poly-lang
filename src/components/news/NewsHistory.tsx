"use client";

import { ArrowLeft, Loader2, Clock } from "lucide-react";
import type { NewsHistoryEntry } from "@/types/news";
import styles from "./NewsHistory.module.css";

interface Props {
    history: NewsHistoryEntry[];
    isLoading: boolean;
    onBack: () => void;
    onArticleClick: (entry: NewsHistoryEntry) => void;
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString();
    } catch {
        return '';
    }
}

export default function NewsHistory({ history, isLoading, onBack, onArticleClick }: Props) {
    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={onBack}>
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>

            <h2 className={styles.title}>Reading History</h2>

            {isLoading ? (
                <div className={styles.loadingWrapper}>
                    <Loader2 size={24} className={styles.spinner} />
                </div>
            ) : history.length === 0 ? (
                <p className={styles.empty}>まだ記事を読んでいません</p>
            ) : (
                <div className={styles.list}>
                    {history.map((entry) => (
                        <button
                            key={entry.id}
                            className={styles.card}
                            onClick={() => onArticleClick(entry)}
                        >
                            <h3 className={styles.cardTitle}>{entry.article_title}</h3>
                            <div className={styles.cardMeta}>
                                <span className={styles.difficultyBadge}>{entry.difficulty}</span>
                                <span className={styles.date}>
                                    <Clock size={12} />
                                    {formatDate(entry.read_at)}
                                </span>
                                {(entry.saved_vocabulary.length > 0 || entry.saved_grammar.length > 0) && (
                                    <span className={styles.savedCount}>
                                        {entry.saved_vocabulary.length + entry.saved_grammar.length} saved
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
