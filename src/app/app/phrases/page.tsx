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

export default function PhrasesPage() {
    const { activeLanguageCode, user, nativeLanguage, showPinyin, togglePinyin, speakingGender, setSpeakingGender } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode, clearSelection } = useAwarenessStore();
    const { drawerState, closeExplorer } = useExplorer();
    const [selectedCategory, setSelectedCategory] = useState("all");

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
                            <h1 className={styles.title}>{t.phrases}</h1>
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
        </div>
    );
}
