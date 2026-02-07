"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-context";
import { useEtymologyStore } from "@/store/etymology-store";
import EtymologySearch from "@/components/etymology/EtymologySearch";
import EtymologyWordDetail from "@/components/etymology/EtymologyWordDetail";
import PartsLibrary from "@/components/etymology/PartsLibrary";
import { Loader2 } from "lucide-react";
import styles from "./page.module.css";

export default function EtymologyPage() {
    const { user, nativeLanguage, activeLanguageCode } = useAppStore();
    const {
        viewState,
        searchQuery,
        recentSearches,
        targetLanguage,
        currentEntry,
        wordParts,
        partOrigins,
        partsFilter,
        isSearching,
        isLoadingParts,
        error,
        searchWord,
        setTargetLanguage,
        fetchWordParts,
        fetchRecentSearches,
        goToPartsLibrary,
        goToSearch,
    } = useEtymologyStore();

    // Initialize target language from active learning language
    useEffect(() => {
        if (activeLanguageCode) {
            setTargetLanguage(activeLanguageCode);
        }
    }, [activeLanguageCode, setTargetLanguage]);

    // Fetch recent searches on mount and when target language changes
    useEffect(() => {
        if (user) {
            fetchRecentSearches(targetLanguage);
        }
    }, [user, targetLanguage, fetchRecentSearches]);

    const handleSearch = useCallback((word: string) => {
        searchWord(word, targetLanguage, nativeLanguage);
    }, [searchWord, targetLanguage, nativeLanguage]);

    const handleRelatedWordClick = useCallback((word: string) => {
        searchWord(word, targetLanguage, nativeLanguage);
    }, [searchWord, targetLanguage, nativeLanguage]);

    const handleTargetLanguageChange = useCallback((lang: string) => {
        setTargetLanguage(lang);
    }, [setTargetLanguage]);

    const handlePartClick = useCallback((part: string, type: string) => {
        goToPartsLibrary({ type });
    }, [goToPartsLibrary]);

    const handlePartsFilterChange = useCallback((filter: { type?: string; origin?: string; search?: string }) => {
        fetchWordParts(filter);
    }, [fetchWordParts]);

    // Loading view
    if (viewState === "loading") {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p className={styles.loadingText}>語源を分析中...</p>
                    <p className={styles.loadingSubtext}>Wiktionary + AI で構造化しています</p>
                </div>
            </div>
        );
    }

    // Parts library view
    if (viewState === "parts-library") {
        return (
            <div className={styles.container}>
                <PartsLibrary
                    parts={wordParts}
                    origins={partOrigins}
                    isLoading={isLoadingParts}
                    initialType={partsFilter.type}
                    onBack={goToSearch}
                    onFilterChange={handlePartsFilterChange}
                />
            </div>
        );
    }

    // Result view
    if (viewState === "result" && currentEntry) {
        return (
            <div className={styles.container}>
                <EtymologyWordDetail
                    entry={currentEntry}
                    onBack={goToSearch}
                    onRelatedWordClick={handleRelatedWordClick}
                    onPartClick={handlePartClick}
                />
            </div>
        );
    }

    // Search view (default)
    return (
        <div className={styles.container}>
            <EtymologySearch
                recentSearches={recentSearches}
                targetLanguage={targetLanguage}
                onTargetLanguageChange={handleTargetLanguageChange}
                isSearching={isSearching}
                error={error}
                onSearch={handleSearch}
            />

            {/* Parts Library link */}
            <div className={styles.partsLibraryLink}>
                <button className={styles.partsLibraryButton} onClick={() => goToPartsLibrary()}>
                    部品ライブラリを見る →
                </button>
            </div>
        </div>
    );
}
