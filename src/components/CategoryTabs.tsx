"use client";

import React from "react";
import { Category } from "@/lib/data";
import { motion } from "framer-motion";

interface Props {
    categories: Category[];
    selectedCategoryId: string;
    onSelect: (id: string) => void;
    allLabel?: string;
}

export default function CategoryTabs({ categories, selectedCategoryId, onSelect, allLabel = "All" }: Props) {
    return (
        <div style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "var(--color-bg)", /* Needs bg for sticky */
            paddingBottom: "var(--space-4)",
            paddingTop: "var(--space-2)",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
        }}>
            <button
                onClick={() => onSelect("all")}
                style={{
                    padding: "var(--space-2) var(--space-4)",
                    borderRadius: "var(--radius-full)",
                    border: selectedCategoryId === "all" ? "1px solid var(--color-fg)" : "1px solid var(--color-border)",
                    background: selectedCategoryId === "all" ? "var(--color-fg)" : "transparent",
                    color: selectedCategoryId === "all" ? "var(--color-surface)" : "var(--color-fg-muted)",
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                }}
            >
                {allLabel}
            </button>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    style={{
                        padding: "var(--space-2) var(--space-4)",
                        borderRadius: "var(--radius-full)",
                        border: selectedCategoryId === cat.id ? "1px solid var(--color-fg)" : "1px solid var(--color-border)",
                        background: selectedCategoryId === cat.id ? "var(--color-fg)" : "transparent",
                        color: selectedCategoryId === cat.id ? "var(--color-surface)" : "var(--color-fg-muted)",
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s"
                    }}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
