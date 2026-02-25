"use client";

import { useEffect, useCallback, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useNewsStore } from "@/store/news-store";
import NewsFeed from "@/components/news/NewsFeed";
import NewsArticleDetail from "@/components/news/NewsArticleDetail";
import NewsHistory from "@/components/news/NewsHistory";
import UrlSubmitModal from "@/components/news/UrlSubmitModal";
import { Newspaper, Sparkles, BookOpen, Check } from "lucide-react";
import styles from "./page.module.css";

export default function NewsPage() {
    const { user, nativeLanguage, activeLanguageCode } = useAppStore();
    const {
        viewState,
        difficulty,
        articles,
        isLoadingFeed,
        currentArticle,
        loadingStage,
        error,
        history,
        isLoadingHistory,
        creditError,
        setDifficulty,
        fetchFeed,
        handleProcessArticle,
        submitUrl,
        toggleVocabSaved,
        toggleGrammarSaved,
        goToFeed,
        goToHistory,
        goBackFromArticle,
        clearCreditError,
    } = useNewsStore();

    const [urlModalOpen, setUrlModalOpen] = useState(false);

    // Fetch feed on mount
    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchFeed(activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchFeed]);

    const handleArticleClick = useCallback((article: { source_url: string; title?: string; description?: string | null }) => {
        handleProcessArticle(article.source_url, activeLanguageCode, nativeLanguage, article.title, article.description || undefined);
    }, [handleProcessArticle, activeLanguageCode, nativeLanguage]);

    const handleUrlSubmit = useCallback((url: string) => {
        submitUrl(url, activeLanguageCode, nativeLanguage);
    }, [submitUrl, activeLanguageCode, nativeLanguage]);

    const handleHistoryArticleClick = useCallback((entry: { article_url: string }) => {
        handleProcessArticle(entry.article_url, activeLanguageCode, nativeLanguage);
    }, [handleProcessArticle, activeLanguageCode, nativeLanguage]);

    // Loading view
    if (viewState === "loading") {
        const stages = [
            { icon: Newspaper, label: "記事を取得中..." },
            { icon: Sparkles, label: "リライト中..." },
            { icon: BookOpen, label: "単語・構文を抽出中..." },
        ];

        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.stages}>
                        {stages.map((stage, i) => {
                            const isDone = loadingStage > i;
                            const isActive = loadingStage === i;
                            const isPending = loadingStage < i;
                            const Icon = stage.icon;
                            return (
                                <div
                                    key={i}
                                    className={`${styles.stage} ${isDone ? styles.stageDone : ""} ${isActive ? styles.stageActive : ""} ${isPending ? styles.stagePending : ""}`}
                                >
                                    <div className={styles.stageIcon}>
                                        {isDone ? <Check size={14} /> : <Icon size={14} />}
                                    </div>
                                    <span className={styles.stageLabel}>{stage.label}</span>
                                    {isActive && <span className={styles.stageDot} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Article detail view
    if (viewState === "article" && currentArticle) {
        return (
            <div className={styles.container}>
                <NewsArticleDetail
                    article={currentArticle}
                    onBack={goBackFromArticle}
                    onToggleVocabSaved={toggleVocabSaved}
                    onToggleGrammarSaved={toggleGrammarSaved}
                />
            </div>
        );
    }

    // History view
    if (viewState === "history") {
        return (
            <div className={styles.container}>
                <NewsHistory
                    history={history}
                    isLoading={isLoadingHistory}
                    onBack={goToFeed}
                    onArticleClick={handleHistoryArticleClick}
                />
            </div>
        );
    }

    // Feed view (default)
    return (
        <div className={styles.container}>
            {creditError && (
                <div className={styles.creditError}>
                    <p>{creditError}</p>
                    <button onClick={clearCreditError}>OK</button>
                </div>
            )}

            <NewsFeed
                articles={articles}
                isLoading={isLoadingFeed}
                difficulty={difficulty}
                nativeLanguage={nativeLanguage}
                error={error}
                onArticleClick={handleArticleClick}
                onDifficultyChange={setDifficulty}
                onUrlSubmit={() => setUrlModalOpen(true)}
                onHistoryClick={goToHistory}
            />

            <UrlSubmitModal
                isOpen={urlModalOpen}
                onClose={() => setUrlModalOpen(false)}
                onSubmit={handleUrlSubmit}
            />
        </div>
    );
}
