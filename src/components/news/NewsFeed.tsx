"use client";

import { Loader2, Link2, History } from "lucide-react";
import type { NewsArticleSummary, NewsDifficulty } from "@/types/news";
import NewsArticleCard from "./NewsArticleCard";
import DifficultySelector from "./DifficultySelector";
import styles from "./NewsFeed.module.css";

interface Props {
    articles: NewsArticleSummary[];
    isLoading: boolean;
    difficulty: NewsDifficulty;
    nativeLanguage: string;
    error: string | null;
    onArticleClick: (article: NewsArticleSummary) => void;
    onDifficultyChange: (d: NewsDifficulty) => void;
    onUrlSubmit: () => void;
    onHistoryClick: () => void;
}

export default function NewsFeed({
    articles, isLoading, difficulty, nativeLanguage, error,
    onArticleClick, onDifficultyChange, onUrlSubmit, onHistoryClick,
}: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>News Reader</h1>
                <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={onUrlSubmit} title="URL入力">
                        <Link2 size={18} />
                    </button>
                    <button className={styles.iconButton} onClick={onHistoryClick} title="履歴">
                        <History size={18} />
                    </button>
                </div>
            </div>

            <DifficultySelector
                value={difficulty}
                onChange={onDifficultyChange}
                nativeLanguage={nativeLanguage}
            />

            {error && <p className={styles.error}>{error}</p>}

            {isLoading ? (
                <div className={styles.loadingWrapper}>
                    <Loader2 size={24} className={styles.spinner} />
                </div>
            ) : articles.length === 0 ? (
                <p className={styles.empty}>ニュースが見つかりませんでした</p>
            ) : (
                <div className={styles.list}>
                    {articles.map((article, i) => (
                        <NewsArticleCard
                            key={`${article.source_url}-${i}`}
                            article={article}
                            onClick={() => onArticleClick(article)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
