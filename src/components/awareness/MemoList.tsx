"use client";

import React, { useState, useMemo } from "react";
import MemoCard from "./MemoCard";
import { LayoutGrid, List as ListIcon, Filter } from "lucide-react";
import { Database } from "@/types/supabase";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

type Memo = Database['public']['Tables']['awareness_memos']['Row'];

interface MemoListProps {
    unverified: Memo[];
    attempted: Memo[];
    verified: Memo[];
}

type Tab = 'unverified' | 'verified';
type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';

export default function MemoList({ unverified, attempted, verified }: MemoListProps) {
    const { nativeLanguage } = useAppStore();
    const [activeTab, setActiveTab] = useState<Tab>('unverified');
    const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');

    const t: any = translations[nativeLanguage] || translations.ja;

    const combinedVerified = useMemo(() =>
        [...attempted, ...verified].sort((a, b) =>
            new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        ), [attempted, verified]);

    const filteredUnverified = useMemo(() => {
        if (confidenceFilter === 'all') return unverified;
        return unverified.filter(m => m.confidence === confidenceFilter);
    }, [unverified, confidenceFilter]);

    const filteredVerified = useMemo(() => {
        if (confidenceFilter === 'all') return combinedVerified;
        return combinedVerified.filter(m => m.confidence === confidenceFilter);
    }, [combinedVerified, confidenceFilter]);

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'unverified', label: t.unverified, count: filteredUnverified.length },
        { id: 'verified', label: t.verified, count: filteredVerified.length },
    ];

    const confidenceOptions: { id: ConfidenceFilter; label: string; color: string }[] = [
        { id: 'all', label: t.all || "全て", color: "var(--color-fg-muted)" },
        { id: 'low', label: t.confidence_low, color: "#ef4444" },
        { id: 'medium', label: t.confidence_med, color: "#f59e0b" },
        { id: 'high', label: t.confidence_high, color: "#22c55e" },
    ];

    const currentList = activeTab === 'unverified' ? filteredUnverified : filteredVerified;

    return (
        <div style={{ marginTop: "var(--space-8)" }}>
            {/* Tabs Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "var(--space-6)",
                paddingBottom: "var(--space-2)"
            }}>
                <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", maxWidth: "100%" }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "var(--space-3) var(--space-4)",
                                fontSize: "1rem",
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                color: activeTab === tab.id ? "var(--color-fg)" : "var(--color-fg-muted)",
                                borderBottom: activeTab === tab.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                                marginBottom: "-1px",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                                flexShrink: 0
                            }}
                        >
                            {tab.label}
                            <span style={{
                                fontSize: "0.8rem",
                                background: activeTab === tab.id ? "var(--color-surface-hover)" : "var(--color-bg-subtle)",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                minWidth: "20px",
                                textAlign: "center",
                                transition: "background 0.2s"
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Confidence Filter */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    marginBottom: "-1px",
                    paddingBottom: "var(--space-1)"
                }}>
                    <Filter size={16} style={{ color: "var(--color-fg-muted)" }} />
                    <div style={{
                        display: "flex",
                        gap: "var(--space-1)",
                        background: "var(--color-surface)",
                        padding: "4px",
                        borderRadius: "var(--radius-md)"
                    }}>
                        {confidenceOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setConfidenceFilter(opt.id)}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: "0.8rem",
                                    fontWeight: confidenceFilter === opt.id ? 600 : 400,
                                    color: confidenceFilter === opt.id ? "#fff" : "var(--color-fg-muted)",
                                    background: confidenceFilter === opt.id ? opt.color : "transparent",
                                    borderRadius: "var(--radius-sm)",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Content */}
            {currentList.length === 0 ? (
                <div style={{
                    padding: "var(--space-12)",
                    textAlign: "center",
                    color: "var(--color-fg-muted)",
                    fontStyle: "italic",
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)"
                }}>
                    {activeTab === 'unverified' && t.allCaughtUp}
                    {activeTab === 'verified' && t.startPracticing}
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "var(--space-4)"
                }}>
                    {currentList.map(memo => (
                        <MemoCard key={memo.id} memo={memo} />
                    ))}
                </div>
            )}
        </div>
    );
}
