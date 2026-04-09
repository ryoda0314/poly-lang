"use client";

import { Clock } from "lucide-react";
import type { NewsArticleSummary } from "@/types/news";
import styles from "./NewsArticleCard.module.css";

interface Props {
    article: NewsArticleSummary;
    onClick: () => void;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffH = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffH < 1) return 'just now';
        if (diffH < 24) return `${diffH}h ago`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD}d ago`;
        return d.toLocaleDateString();
    } catch {
        return '';
    }
}

export default function NewsArticleCard({ article, onClick }: Props) {
    return (
        <button className={styles.card} onClick={onClick}>
            <h3 className={styles.title}>{article.title}</h3>
            {article.published_at && (
                <div className={styles.meta}>
                    <Clock size={12} />
                    <span>{formatDate(article.published_at)}</span>
                </div>
            )}
        </button>
    );
}
