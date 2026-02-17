"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";
import { usePhrasalVerbStore } from "@/store/phrasal-verb-store";
import PhrasalSearch from "@/components/phrasal-verbs/PhrasalSearch";
import ExpressionDetail from "@/components/phrasal-verbs/ExpressionDetail";
import VerbExpressionList from "@/components/phrasal-verbs/VerbExpressionList";
import { Database, Sparkles, Check } from "lucide-react";
import styles from "./page.module.css";

export default function PhrasalVerbsPage() {
    const { user, nativeLanguage, activeLanguageCode } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (activeLanguageCode && activeLanguageCode !== 'en') {
            router.replace('/app/dashboard');
        }
    }, [activeLanguageCode, router]);
    const {
        viewState,
        searchMode,
        searchQuery,
        recentSearches,
        currentEntry,
        verbResult,
        isSearching,
        loadingStage,
        error,
        setSearchMode,
        searchExpression,
        searchVerb,
        selectExpression,
        fetchRecentSearches,
        goBack,
        goToSearch,
    } = usePhrasalVerbStore();

    useEffect(() => {
        if (user) {
            fetchRecentSearches(activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchRecentSearches]);

    const handleSearch = useCallback((input: string) => {
        if (searchMode === "expression") {
            searchExpression(input, activeLanguageCode, nativeLanguage);
        } else {
            searchVerb(input, activeLanguageCode, nativeLanguage);
        }
    }, [searchMode, searchExpression, searchVerb, activeLanguageCode, nativeLanguage]);

    const handleSelectExpression = useCallback((expression: string) => {
        selectExpression(expression, activeLanguageCode, nativeLanguage);
    }, [selectExpression, activeLanguageCode, nativeLanguage]);

    // Loading view
    if (viewState === "loading") {
        const stages = [
            { icon: Database, label: "キャッシュを確認中..." },
            { icon: Sparkles, label: "AIで表現を分析中..." },
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

    // Detail view
    if (viewState === "detail" && currentEntry) {
        return (
            <div className={styles.container}>
                <ExpressionDetail
                    entry={currentEntry}
                    onBack={goBack}
                    onRelatedClick={handleSelectExpression}
                />
            </div>
        );
    }

    // Verb list view
    if (viewState === "verb-list" && verbResult) {
        return (
            <div className={styles.container}>
                <VerbExpressionList
                    verb={verbResult.verb}
                    expressions={verbResult.expressions}
                    onBack={goToSearch}
                    onExpressionClick={handleSelectExpression}
                />
            </div>
        );
    }

    // Search view (default)
    return (
        <div className={styles.container}>
            <PhrasalSearch
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                recentSearches={recentSearches}
                isSearching={isSearching}
                error={error}
                onSearch={handleSearch}
            />
        </div>
    );
}
