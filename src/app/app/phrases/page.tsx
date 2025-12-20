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
import { motion } from "framer-motion";
import { useExplorer } from "@/hooks/use-explorer";

export default function PhrasesPage() {
    const { activeLanguageCode, user } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode } = useAwarenessStore();
    const { drawerState } = useExplorer();
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        if (user) {
            fetchMemos(user.id);
        }
    }, [user, fetchMemos]);

    const phrases = PHRASES[activeLanguageCode] || [];

    const filteredPhrases = selectedCategory === "all"
        ? phrases
        : phrases.filter(p => p.categoryId === selectedCategory);

    const isPanelOpen = drawerState !== "UNOPENED";

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: isPanelOpen ? "2fr 1fr" : "1fr",
            gap: "var(--space-6)",
            alignItems: "flex-start",
            position: "relative",
            minHeight: "calc(100vh - 64px)"
        }}>
            {/* Left Area */}
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", color: "var(--color-fg)", marginBottom: "var(--space-2)" }}>Phrases</h1>
                        <CategoryTabs
                            categories={CATEGORIES}
                            selectedCategoryId={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    </div>
                </div>

                <motion.div
                    layout
                    style={{
                        display: "grid",
                        gridTemplateColumns: isPanelOpen ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                        gap: "var(--space-4)",
                        paddingTop: "var(--space-2)"
                    }}
                >
                    {filteredPhrases.length > 0 ? (
                        filteredPhrases.map((phrase) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={phrase.id}
                            >
                                <PhraseCard phrase={phrase} />
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ color: "var(--color-fg-muted)", fontStyle: "italic", gridColumn: "1 / -1", marginTop: "var(--space-8)" }}>
                            No phrases found for this category.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Right Panel: Explorer Side Panel */}
            {isPanelOpen && (
                <div style={{
                    position: "sticky",
                    top: 0,
                    height: "calc(100vh - 64px)",
                    borderLeft: "1px solid var(--color-border)",
                    marginLeft: "-1px",
                    paddingLeft: "var(--space-6)",
                    overflow: "hidden"
                }}>
                    <ExplorerSidePanel />
                </div>
            )}
        </div>
    );
}
