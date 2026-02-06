"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Filter, ChevronDown, Plus, Book } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/app-context";
import { useLongTextStore } from "@/store/long-text-store";
import { translations, NativeLanguage } from "@/lib/translations";
import TextCard from "@/components/long-text/TextCard";
import styles from "./page.module.css";
import clsx from "clsx";

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

export default function LongTextListPage() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { texts, progressMap, isLoadingTexts, fetchTexts } = useLongTextStore();
    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const t = translations[(nativeLanguage || "ja") as NativeLanguage] || translations.ja;

    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchTexts(activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchTexts]);

    const filteredTexts = texts.filter(text => {
        // Hide Bible texts - they're accessed via the Bible page
        if (text.category === 'Bible') return false;
        if (difficultyFilter === "all") return true;
        return text.difficulty_level === difficultyFilter;
    });

    const difficultyLabels: Record<DifficultyFilter, string> = {
        all: "全て",
        beginner: "初級",
        intermediate: "中級",
        advanced: "上級",
    };

    if (isLoadingTexts) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    {t.loading || "読み込み中..."}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    <Link href="/app/long-text/bible" className={styles.bibleButton}>
                        <Book size={18} />
                        <span>聖書</span>
                    </Link>
                    <Link href="/app/long-text/add" className={styles.addButton}>
                        <Plus size={18} />
                        <span>追加</span>
                    </Link>

                    <div className={styles.filterWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <Filter size={16} />
                        <span>{difficultyLabels[difficultyFilter]}</span>
                        <ChevronDown
                            size={16}
                            className={clsx(styles.chevron, isFilterOpen && styles.chevronOpen)}
                        />
                    </button>

                    {isFilterOpen && (
                        <>
                            <div
                                className={styles.filterBackdrop}
                                onClick={() => setIsFilterOpen(false)}
                            />
                            <div className={styles.filterDropdown}>
                                {(["all", "beginner", "intermediate", "advanced"] as DifficultyFilter[]).map(level => (
                                    <button
                                        key={level}
                                        className={clsx(
                                            styles.filterItem,
                                            difficultyFilter === level && styles.filterItemActive
                                        )}
                                        onClick={() => {
                                            setDifficultyFilter(level);
                                            setIsFilterOpen(false);
                                        }}
                                    >
                                        {difficultyLabels[level]}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    </div>
                </div>
            </div>

            <div className={styles.scrollArea}>
                {filteredTexts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                        <h2 className={styles.emptyTitle}>
                            長文がありません
                        </h2>
                        <p className={styles.emptyDesc}>
                            学習したい長文を追加してみましょう
                        </p>
                        <Link href="/app/long-text/add" className={styles.emptyAddButton}>
                            <Plus size={18} />
                            <span>最初の長文を追加</span>
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredTexts.map(text => (
                            <TextCard
                                key={text.id}
                                text={text}
                                progress={progressMap[text.id]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
