"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { CATEGORIES, PHRASES } from "@/lib/data";
import PhraseCard from "@/components/PhraseCard";
import CategoryTabs from "@/components/CategoryTabs";
import AwarenessPanel from "@/components/AwarenessPanel";
import AwarenessMemoPanel from "@/components/AwarenessMemoPanel";
import { motion } from "framer-motion";

export default function PhrasesPage() {
    const { activeLanguageCode, user } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode } = useAwarenessStore();
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

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: isMemoMode ? "3fr 1fr" : "1fr", // 3:1 ratio when memo mode
            gap: isMemoMode ? "0" : "var(--space-6)",
            alignItems: "flex-start",
            position: "relative",
            minHeight: "calc(100vh - 64px)"
        }}>
            <div style={{
                flex: 1,
                paddingRight: isMemoMode ? "var(--space-4)" : 0,
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", color: "var(--color-fg)", marginBottom: "var(--space-2)" }}>Phrases</h1>
                        <CategoryTabs
                            categories={CATEGORIES}
                            selectedCategoryId={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    </div>

                    {!isMemoMode && (
                        <button
                            onClick={toggleMemoMode}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-2)",
                                padding: "var(--space-2) var(--space-3)",
                                borderRadius: "var(--radius-full)",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-surface)",
                                color: "var(--color-fg-muted)",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-accent)";
                                e.currentTarget.style.color = "var(--color-accent)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-border)";
                                e.currentTarget.style.color = "var(--color-fg-muted)";
                            }}
                        >
                            Open Memos
                        </button>
                    )}
                </div>

                <motion.div
                    layout
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMemoMode ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(280px, 1fr))",
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

            {/* Right Panel Logic */}
            {isMemoMode && (
                // Split Screen: Memo Panel
                <div style={{
                    position: "sticky",
                    top: 0,
                    height: "calc(100vh - 64px)",
                    borderLeft: "1px solid var(--color-border)",
                    marginLeft: "-1px"
                }}>
                    <AwarenessMemoPanel />
                </div>
            )}
        </div>
    );
}
