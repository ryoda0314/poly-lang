"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { CATEGORIES, PHRASES } from "@/lib/data";
import PhraseCard from "@/components/PhraseCard";
import CategoryTabs from "@/components/CategoryTabs";
import AwarenessPanel from "@/components/AwarenessPanel";
import AwarenessMemoPanel from "@/components/AwarenessMemoPanel";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import MemoDropZone from "@/components/MemoDropZone";
import { motion } from "framer-motion";
import { useExplorer } from "@/hooks/use-explorer";
import Link from "next/link";
import { Settings } from "lucide-react";
import styles from "./phrases.module.css";
import clsx from "clsx";

export default function PhrasesPage() {
    const { activeLanguageCode, user } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode } = useAwarenessStore();
    const { drawerState, closeExplorer } = useExplorer();
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        if (user) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchMemos]);

    const phrases = PHRASES[activeLanguageCode] || [];

    const filteredPhrases = selectedCategory === "all"
        ? phrases
        : phrases.filter(p => p.categoryId === selectedCategory);

    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;

    return (
        <div className={clsx(styles.container, isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed)}>
            {/* Left Area */}
            <div className={styles.leftArea}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div>
                            <h1 className={styles.title}>Phrases</h1>
                            <CategoryTabs
                                categories={CATEGORIES}
                                selectedCategoryId={selectedCategory}
                                onSelect={setSelectedCategory}
                            />
                        </div>

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
