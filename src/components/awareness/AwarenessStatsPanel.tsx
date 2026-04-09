"use client";

import React, { useState, useEffect } from "react";
import { Database } from "@/types/supabase";
import { X, CheckCircle, Clock, RefreshCw, Activity, Calendar, Trash2, Save } from "lucide-react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";

type Memo = Database['public']['Tables']['awareness_memos']['Row'];

interface AwarenessStatsPanelProps {
    token: string;
    memo?: Memo;
    onClose: () => void;
}

export default function AwarenessStatsPanel({ token, memo, onClose }: AwarenessStatsPanelProps) {
    const { updateMemo, deleteMemo, addMemo } = useAwarenessStore();
    const { activeLanguageCode, user } = useAppStore();

    const [confidence, setConfidence] = useState<"high" | "medium" | "low">(
        (memo?.confidence as "high" | "medium" | "low") || "medium"
    );
    const [note, setNote] = useState(memo?.memo || "");
    const [isSaving, setIsSaving] = useState(false);

    // Sync state if memo prop changes (e.g. external update)
    useEffect(() => {
        if (memo) {
            setConfidence((memo.confidence as "high" | "medium" | "low") || "medium");
            setNote(memo.memo || "");
        }
    }, [memo]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            if (memo) {
                await updateMemo(memo.id, {
                    confidence,
                    memo: note,
                    updated_at: new Date().toISOString()
                });
            } else {
                // Should effectively not happen if we only open this via existing memo, 
                // but good for robustness if we allow "Stats" on non-memo tokens later.
                // For now, this component is mostly for viewing/editing EXISTING memos.
            }
            onClose();
        } catch (e) {
            console.error("Failed to save:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!memo) return;
        if (confirm("Are you sure you want to delete this memo?")) {
            await deleteMemo(memo.id);
            onClose();
        }
    };

    const timeAgo = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return `${diffDays}d ago`;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours > 0) return `${diffHours}h ago`;
        return "Just now";
    };

    if (!memo) {
        return (
            <div style={{ padding: "2rem", color: "var(--color-fg-muted)", textAlign: "center" }}>
                Loading or Data Unavailable...
                <button onClick={onClose} style={{ display: "block", margin: "1rem auto", padding: "0.5rem 1rem" }}>Close</button>
            </div>
        );
    }

    return (
        <div style={{ padding: "var(--space-4)", display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Header - Compact */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{token}</h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', marginTop: '2px' }}>
                        Added {new Date(memo.created_at || "").toLocaleDateString()}
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)', padding: 0 }}>
                    <X size={24} />
                </button>
            </div>

            {/* Confidence Selector - No Label, just bar */}
            <div style={{ display: 'flex', gap: '8px' }}>
                {(['high', 'medium', 'low'] as const).map(conf => (
                    <button
                        key={conf}
                        onClick={() => setConfidence(conf)}
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "6px",
                            border: confidence === conf
                                ? `2px solid ${conf === 'high' ? 'var(--color-success)' : conf === 'medium' ? 'var(--color-warning)' : 'var(--color-destructive)'} `
                                : "1px solid var(--color-border)",
                            background: confidence === conf
                                ? `color-mix(in srgb, ${conf === 'high' ? 'var(--color-success)' : conf === 'medium' ? 'var(--color-warning)' : 'var(--color-destructive)'} 10%, transparent)`
                                : "var(--color-bg)",
                            color: confidence === conf ? 'var(--color-fg)' : 'var(--color-fg-muted)',
                            fontWeight: confidence === conf ? 700 : 500,
                            cursor: "pointer",
                            textTransform: "capitalize",
                            fontSize: "0.85rem",
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                    >
                        {conf}
                    </button>
                ))}
            </div>

            {/* Stats Grid - Horizontal Scroll or 2x2 Tight */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <StatCard
                    icon={<Activity size={14} />}
                    label="Corrected"
                    value={`${memo.usage_count}x`}
                    compact
                />
                <StatCard
                    icon={<RefreshCw size={14} />}
                    label="Strength"
                    value={`${(memo.strength * 100).toFixed(0)}%`}
                    compact
                />
                <StatCard
                    icon={<Clock size={14} />}
                    label="Last"
                    value={timeAgo(memo.attempted_at)}
                    compact
                />
                <StatCard
                    icon={<Calendar size={14} />}
                    label="Review"
                    value={timeAgo(memo.next_review_at)}
                    highlight={memo.next_review_at && new Date(memo.next_review_at) <= new Date()}
                    compact
                />
            </div>

            {/* Editable Memo - Flexible Height */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '60px' }}>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Memo note..."
                    style={{
                        flex: 1,
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        fontFamily: "inherit",
                        fontSize: "0.95rem",
                        lineHeight: 1.4,
                        resize: "none",
                        background: "var(--color-surface)",
                        color: "var(--color-fg)"
                    }}
                />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                <button
                    onClick={handleDelete}
                    style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "transparent",
                        color: "var(--color-destructive)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    title="Delete"
                >
                    <Trash2 size={18} />
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "none",
                        background: "var(--color-accent)",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                    }}
                >
                    {isSaving ? "Subject..." : (
                        <>
                            <Save size={16} />
                            Save
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, highlight, compact }: any) {
    return (
        <div style={{
            background: 'var(--color-surface)',
            padding: compact ? '0.5rem 0.75rem' : '0.75rem',
            borderRadius: '8px',
            border: highlight ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: compact ? '8px' : '12px',
            minWidth: 0 // Allow shrinking
        }}>
            <div style={{ color: 'var(--color-fg-muted)' }}>{icon}</div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontSize: compact ? '1rem' : '1.1rem', fontWeight: 800, color: highlight ? 'var(--color-accent)' : 'var(--color-fg)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{value}</div>
            </div>
        </div>
    );
}
