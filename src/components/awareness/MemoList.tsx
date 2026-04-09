"use client";

import React, { useState, useMemo } from "react";
import MemoCard from "./MemoCard";
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

    const combinedVerified = useMemo(() => {
        const now = new Date();
        return [...attempted, ...verified].sort((a, b) => {
            // Due-for-review memos first
            const aDue = a.next_review_at && new Date(a.next_review_at) <= now ? 1 : 0;
            const bDue = b.next_review_at && new Date(b.next_review_at) <= now ? 1 : 0;
            if (bDue !== aDue) return bDue - aDue;
            // Then by updated_at
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        });
    }, [attempted, verified]);

    const filteredUnverified = useMemo(() => {
        if (confidenceFilter === 'all') return unverified;
        return unverified.filter(m => m.confidence === confidenceFilter);
    }, [unverified, confidenceFilter]);

    const filteredVerified = useMemo(() => {
        if (confidenceFilter === 'all') return combinedVerified;
        return combinedVerified.filter(m => m.confidence === confidenceFilter);
    }, [combinedVerified, confidenceFilter]);

    const confidenceOptions: { id: ConfidenceFilter; label: string; color: string }[] = [
        { id: 'all', label: t.all || "All", color: "var(--color-fg-muted)" },
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
                gap: "var(--space-3)",
                marginBottom: "var(--space-4)"
            }}>
                <span style={{
                    fontSize: "0.75rem",
                    color: "var(--color-fg-muted)",
                    fontWeight: 500
                }}>
                    {(t as any).filterByConfidence || "Confidence"}
                </span>
                <div style={{
                    display: "flex",
                    gap: "6px",
                    background: "var(--color-surface)",
                    padding: "4px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)"
                }}>
                    {confidenceOptions.map(opt => {
                        const isActive = confidenceFilter === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setConfidenceFilter(opt.id)}
                                style={{
                                    padding: "6px 14px",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: isActive ? "#fff" : opt.color,
                                    background: isActive ? opt.color : "transparent",
                                    border: isActive ? "none" : `1px solid transparent`,
                                    borderRadius: "var(--radius-md)",
                                    transition: "all 0.15s ease",
                                    whiteSpace: "nowrap",
                                    cursor: "pointer"
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
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