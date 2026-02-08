"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-context";
import { useEtymologyStore } from "@/store/etymology-store";
import EtymologySearch from "@/components/etymology/EtymologySearch";
import EtymologyWordDetail from "@/components/etymology/EtymologyWordDetail";
import PartsLibrary from "@/components/etymology/PartsLibrary";
import PartDetail from "@/components/etymology/PartDetail";
import { Database, Globe, Sparkles, Check } from "lucide-react";
import type { WordPart } from "@/actions/etymology";
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
        selectedPart,
        partDetailWords,
        isLoadingPartDetail,
        isSearching,
        isLoadingParts,
        loadingStage,
        error,
        searchWord,
        setTargetLanguage,
        fetchWordParts,
        fetchRecentSearches,
        goToPartsLibrary,
        goToPartDetail,
        goToSearch,
        goBackFromResult,
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

    const handleLibraryPartClick = useCallback((part: WordPart) => {
        goToPartDetail(part);
    }, [goToPartDetail]);

    const handlePartDetailWordClick = useCallback((word: string) => {
        searchWord(word, targetLanguage, nativeLanguage);
    }, [searchWord, targetLanguage, nativeLanguage]);

    // Loading view
    if (viewState === "loading") {
        const stages = [
            { icon: Database, label: "キャッシュを確認中..." },
            { icon: Globe, label: "Wiktionaryからデータ取得中..." },
            { icon: Sparkles, label: "AIで語源を構造化中..." },
            { icon: Sparkles, label: "もう少しお待ちください..." },
        ];

        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <p className={styles.loadingWord}>{searchQuery}</p>
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

    // Part detail view
    if (viewState === "part-detail" && selectedPart) {
        return (
            <div className={styles.container}>
                <PartDetail
                    part={selectedPart}
                    words={partDetailWords}
                    isLoading={isLoadingPartDetail}
                    onBack={() => goToPartsLibrary()}
                    onWordClick={handlePartDetailWordClick}
                />
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
                    onPartClick={handleLibraryPartClick}
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
                    onBack={goBackFromResult}
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
