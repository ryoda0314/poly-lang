"use client";

import React, { useState } from "react";
import { Category } from "@/lib/data";
import { motion } from "framer-motion";
import { Filter, ChevronDown, Check } from "lucide-react";

interface Props {
    categories: Category[];
    selectedCategoryId: string;
    onSelect: (id: string) => void;
    allLabel?: string;
}

export default function CategoryTabs({ categories, selectedCategoryId, onSelect, allLabel = "All" }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedName = selectedCategoryId === "all"
        ? allLabel
        : categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId;

    return (
        <div style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "var(--color-bg)",
            paddingBottom: "var(--space-4)",
            paddingTop: "var(--space-2)",
        }}>
            <div style={{ position: "relative" }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: "8px 12px 8px 16px",
                        borderRadius: "24px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface)",
                        color: "var(--color-fg)",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontWeight: 500,
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-fg-muted)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-border)";
                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    }}
                >
                    <Filter size={16} className="text-muted-foreground" />
                    <span>{selectedName}</span>
                    <ChevronDown size={16} style={{ marginLeft: "4px", opacity: 0.5 }} />
                </button>

                {isOpen && (
                    <>
                        <div
                            style={{ position: "fixed", inset: 0, zIndex: 90 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <div style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: 0,
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "16px",
                            padding: "8px",
                            boxShadow: "var(--shadow-lg)",
                            zIndex: 1000,
                            minWidth: "220px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px"
                        }}>
                            <button
                                onClick={() => { onSelect("all"); setIsOpen(false); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    background: selectedCategoryId === "all" ? "var(--color-bg-sub)" : "transparent",
                                    border: "none",
                                    textAlign: "left",
                                    color: "var(--color-fg)",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    fontWeight: selectedCategoryId === "all" ? 600 : 400
                                }}
                            >
                                <span>{allLabel}</span>
                                {selectedCategoryId === "all" && <Check size={16} />}
                            </button>

                            <div style={{ height: 1, background: "var(--color-border-sub)", margin: "4px 8px" }} />

                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { onSelect(cat.id); setIsOpen(false); }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        background: selectedCategoryId === cat.id ? "var(--color-bg-sub)" : "transparent",
                                        border: "none",
                                        textAlign: "left",
                                        color: "var(--color-fg)",
                                        cursor: "pointer",
                                        fontSize: "0.9rem",
                                        fontWeight: selectedCategoryId === cat.id ? 600 : 400
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedCategoryId !== cat.id) e.currentTarget.style.background = "var(--color-surface-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedCategoryId !== cat.id) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <span>{cat.name}</span>
                                    {selectedCategoryId === cat.id && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
