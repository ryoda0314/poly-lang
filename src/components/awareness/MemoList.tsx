"use client";

import React, { useState } from "react";
import MemoCard from "./MemoCard";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { Database } from "@/types/supabase";

type Memo = Database['public']['Tables']['awareness_memos']['Row'];

interface MemoListProps {
    unverified: Memo[];
    attempted: Memo[];
    verified: Memo[];
}

type Tab = 'unverified' | 'verified';

export default function MemoList({ unverified, attempted, verified }: MemoListProps) {
    const [activeTab, setActiveTab] = useState<Tab>('unverified');

    const combinedVerified = [...attempted, ...verified].sort((a, b) =>
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    );

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'unverified', label: 'Unverified', count: unverified.length },
        { id: 'verified', label: 'Verified', count: combinedVerified.length },
    ];

    const currentList = activeTab === 'unverified' ? unverified : combinedVerified;

    return (
        <div style={{ marginTop: "var(--space-8)" }}>
            {/* Tabs Header */}
            <div style={{
                display: "flex",
                gap: "var(--space-2)",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "var(--space-6)"
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "var(--space-3) var(--space-4)",
                            fontSize: "1rem",
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            color: activeTab === tab.id ? "var(--color-fg)" : "var(--color-fg-muted)",
                            borderBottom: activeTab === tab.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                            marginBottom: "-1px",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab.label} <span style={{
                            fontSize: "0.8rem",
                            background: activeTab === tab.id ? "var(--color-surface-hover)" : "transparent",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            marginLeft: "4px"
                        }}>{tab.count}</span>
                    </button>
                ))}
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
                    {activeTab === 'unverified' && "You're all caught up! No unverified items."}
                    {activeTab === 'verified' && "Start practicing to verify more items!"}
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
