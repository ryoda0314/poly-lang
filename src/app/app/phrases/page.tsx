"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { CATEGORIES, PHRASES } from "@/lib/data";
import PhraseCard from "@/components/PhraseCard";
import CategoryTabs from "@/components/CategoryTabs";
import AwarenessPanel from "@/components/AwarenessPanel";
import { motion } from "framer-motion";

export default function PhrasesPage() {
    const { activeLanguageCode, user } = useAppStore();
    const { fetchMemos, selectedToken } = useAwarenessStore();
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
        <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "flex-start", position: "relative" }}>
            <div style={{ flex: 1 }}>
                <h1 style={{ marginBottom: "var(--space-4)", fontSize: "2rem", color: "var(--color-fg)" }}>Phrases</h1>

                <CategoryTabs
                    categories={CATEGORIES}
                    selectedCategoryId={selectedCategory}
                    onSelect={setSelectedCategory}
                />

                <motion.div
                    layout
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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

            {/* Right Panel - Sticky */}
            {selectedToken && (
                <div style={{
                    width: "320px",
                    position: "sticky",
                    top: "var(--space-4)",
                    flexShrink: 0
                }}>
                    <AwarenessPanel />
                </div>
            )}
        </div>
    );
}
