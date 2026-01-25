"use client";

import React, { useState, useMemo } from "react";
import MemoCard from "./MemoCard";
import { Filter } from "lucide-react";
import { Database } from "@/types/supabase";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

type Memo = Database['public']['Tables']['awareness_memos']['Row'];
type Tab = 'unverified' | 'verified';
type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';

interface MemoListProps {
    unverified: Memo[];
    attempted: Memo[];
    verified: Memo[];
    activeTab: Tab;
}

export default function MemoList({ unverified, attempted, verified, activeTab }: MemoListProps) {
    const { nativeLanguage } = useAppStore();
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

    const confidenceOptions: { id: ConfidenceFilter; label: string; color: string }[] = [
        { id: 'all', label: t.all || "全て", color: "var(--color-fg-muted)" },
        { id: 'low', label: t.confidence_low, color: "#ef4444" },
        { id: 'medium', label: t.confidence_med, color: "#f59e0b" },
        { id: 'high', label: t.confidence_high, color: "#22c55e" },
    ];

    const currentList = activeTab === 'unverified' ? filteredUnverified : filteredVerified;

    return (
        <div>
            {/* Confidence Filter */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
                marginBottom: "var(--space-4)"
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