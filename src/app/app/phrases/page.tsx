"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { CATEGORIES, PHRASES, GENDER_SUPPORTED_LANGUAGES, PARENT_CATEGORIES, getParentCategoryId } from "@/lib/data";
import { translations } from "@/lib/translations";
import PhraseCard from "@/components/PhraseCard";
import CategoryTabs from "@/components/CategoryTabs";
import AwarenessPanel from "@/components/AwarenessPanel";
import AwarenessMemoPanel from "@/components/AwarenessMemoPanel";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import MemoDropZone from "@/components/MemoDropZone";
import { motion } from "framer-motion";
import { useExplorer } from "@/hooks/use-explorer";
import Link from "next/link";
import { Settings, Languages } from "lucide-react";
import styles from "./phrases.module.css";
import clsx from "clsx";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { BookOpen } from "lucide-react";
import { ShiftClickDemo, DragDropDemo, TapExploreDemo, AudioPlayDemo, RangeExploreDemo, ShiftClearDemo } from "@/components/AnimatedTutorialDemos";

const PHRASES_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "フレーズ一覧へようこそ！",
        description: "ここでは、ネイティブの自然な表現を音声付きで学べます。まず、気になるフレーズを見つけましょう。",
        icon: <BookOpen size={48} style={{ color: "var(--color-accent)" }} />
    },
    {
        title: "単語をタップして探索",
        description: "フレーズ内の各単語をタップすると「Explorer」パネルが開き、その単語を使った他の例文がいくつか表示されます。文脈の中で単語の使い方を学べます。",
        icon: <TapExploreDemo />
    },
    {
        title: "Shift+クリックで範囲選択",
        description: "熟語やフレーズの一部を保存したい場合は、Shiftキーを押しながら最初の単語をクリックし、そのままShiftを押したままで最後の単語をクリックすると範囲選択・保存できます。",
        icon: <ShiftClickDemo />
    },
    {
        title: "選択範囲を詳しく調べる",
        description: "複数単語を選択した状態で、その範囲をクリックすると、選択したフレーズ全体について調べることができます。",
        icon: <RangeExploreDemo />
    },
    {
        title: "Shiftキーで選択解除",
        description: "選択を解除したい場合は、Shiftキーを一度押して離すだけでリセットされます。",
        icon: <ShiftClearDemo />
    },
    {
        title: "ドラッグ＆ドロップでメモ",
        description: "気になった単語は、上部の「Drop words here」エリアへドラッグして保存できます。保存した単語は全ページでハイライト表示されます。",
        icon: <DragDropDemo />
    },
    {
        title: "音声を聞いてみよう",
        description: "各カードの再生ボタンで、高品質な音声合成によるネイティブ発音を確認できます。何度も聞いてリズムを身につけましょう！",
        icon: <AudioPlayDemo />
    }
];

export default function PhrasesPage() {
    const { activeLanguageCode, user, nativeLanguage, showPinyin, togglePinyin, speakingGender, setSpeakingGender } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode, clearSelection } = useAwarenessStore();
    const { drawerState, closeExplorer } = useExplorer();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [tutorialKey, setTutorialKey] = useState(0);

    const handleShowTutorial = () => {
        localStorage.removeItem("poly-lang-page-tutorial-phrases-v1");
        setTutorialKey(k => k + 1); // Force re-mount of PageTutorial
    };

    useEffect(() => {
        if (user) {
            fetchMemos(user.id, activeLanguageCode);
        }
        return () => {
            clearSelection();
        };
    }, [user, activeLanguageCode, fetchMemos, clearSelection]);

    // Localize categories (use PARENT_CATEGORIES for broader grouping)
    const t = translations[nativeLanguage] || translations.ja;
    const localizedCategories = PARENT_CATEGORIES.map(cat => ({
        ...cat,
        name: (t as any)[cat.id] || cat.name
    }));

    const phrases = PHRASES.filter(p => p.translations?.[activeLanguageCode]);

    const filteredPhrases = selectedCategory === "all"
        ? phrases
        : phrases.filter(p => getParentCategoryId(p.categoryId) === selectedCategory);

    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;

    return (
        <div className={clsx(styles.container, isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed)}>
            {/* Left Area */}
            <div className={styles.leftArea}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <h1 className={styles.title}>{t.phrases}</h1>
                                {/* Test Button - Remove after testing */}
                                <button
                                    onClick={handleShowTutorial}
                                    style={{
                                        fontSize: "0.7rem",
                                        padding: "4px 8px",
                                        background: "#f59e0b",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Tutorial
                                </button>
                            </div>
                            <CategoryTabs
                                categories={localizedCategories}
                                selectedCategoryId={selectedCategory}
                                onSelect={setSelectedCategory}
                                allLabel={t.all}
                            />
                        </div>

                        {/* Pinyin Toggle Button - Only show for Chinese */}
                        {activeLanguageCode === "zh" && (
                            <button
                                onClick={togglePinyin}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 12px",
                                    borderRadius: "var(--radius-md)",
                                    border: showPinyin ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                                    background: showPinyin ? "var(--color-accent-subtle)" : "var(--color-surface)",
                                    color: showPinyin ? "var(--color-accent)" : "var(--color-fg-muted)",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    transition: "all 0.2s",
                                    marginLeft: "auto",
                                }}
                                title={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
                            >
                                <Languages size={18} />
                                <span>拼音</span>
                            </button>
                        )}

                        {/* Gender Toggle */}
                        {GENDER_SUPPORTED_LANGUAGES.includes(activeLanguageCode) && (
                            <div style={{
                                display: "flex",
                                background: "var(--color-surface-hover)",
                                borderRadius: "var(--radius-sm)",
                                padding: "2px",
                                gap: "2px",
                                marginRight: "var(--space-2)"
                            }}>
                                <button
                                    onClick={() => setSpeakingGender("male")}
                                    style={{
                                        border: "none",
                                        background: speakingGender === "male" ? "var(--color-surface)" : "transparent",
                                        color: speakingGender === "male" ? "var(--color-fg)" : "var(--color-fg-muted)",
                                        padding: "4px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        boxShadow: speakingGender === "male" ? "var(--shadow-sm)" : "none",
                                        fontWeight: speakingGender === "male" ? 700 : 400,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Man
                                </button>
                                <button
                                    onClick={() => setSpeakingGender("female")}
                                    style={{
                                        border: "none",
                                        background: speakingGender === "female" ? "var(--color-surface)" : "transparent",
                                        color: speakingGender === "female" ? "var(--color-fg)" : "var(--color-fg-muted)",
                                        padding: "4px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        boxShadow: speakingGender === "female" ? "var(--shadow-sm)" : "none",
                                        fontWeight: speakingGender === "female" ? 700 : 400,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Woman
                                </button>
                            </div>
                        )}

                        <MemoDropZone />
                    </div>
                </div>

                <motion.div
                    layout
                    className={clsx(styles.grid, isPanelOpen ? styles.gridOpen : styles.gridClosed)}
                >
                    {filteredPhrases.length > 0 ? (
                        filteredPhrases.map((phrase) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={`${phrase.id}-${selectedCategory}`}
                            >
                                <PhraseCard phrase={phrase} />
                            </motion.div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            No phrases found for this category.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Right Panel: Explorer Side Panel Only (Memo Overlay Removed) */}
            {isPanelOpen && (
                <>
                    {/* Overlay for mobile */}
                    <div className={styles.overlay} onClick={() => closeExplorer()} />

                    <div className={styles.rightPanel}>
                        <ExplorerSidePanel />
                    </div>
                </>
            )}

            {/* Page Tutorial */}
            <PageTutorial key={tutorialKey} pageId="phrases" steps={PHRASES_TUTORIAL_STEPS} />
        </div>
    );
}
