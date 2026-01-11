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
        <div style={{ padding: "var(--space-4)", height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, lineHeight: 1 }}>{token}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
                        Added {new Date(memo.created_at || "").toLocaleDateString()}
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)' }}>
                    <X size={24} />
                </button>
            </div>

            {/* Confidence Selector */}
            <div style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-fg-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Confidence Level
                </label>
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
                                fontSize: "0.9rem",
                                transition: 'all 0.2s'
                            }}
                        >
                            {conf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Compact Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <StatCard
                    icon={<Activity size={16} />}
                    label="Corrected"
                    value={`${memo.usage_count} x`}
                />
                <StatCard
                    icon={<RefreshCw size={16} />}
                    label="Strength"
                    value={`${(memo.strength * 100).toFixed(0)}% `}
                />
                <StatCard
                    icon={<Clock size={16} />}
                    label="Last Attempt"
                    value={timeAgo(memo.attempted_at)}
                />
                <StatCard
                    icon={<Calendar size={16} />}
                    label="Next Review"
                    value={timeAgo(memo.next_review_at)}
                    highlight={memo.next_review_at && new Date(memo.next_review_at) <= new Date()}
                />
            </div>

            {/* Editable Memo */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note about this word..."
                    style={{
                        flex: 1,
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        fontFamily: "inherit",
                        fontSize: "1rem",
                        lineHeight: 1.5,
                        resize: "none",
                        background: "var(--color-surface)",
                        color: "var(--color-fg)"
                    }}
                />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
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
                    title="Delete Memo"
                >
                    <Trash2 size={20} />
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
                        fontSize: "1rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "var(--shadow-md)"
                    }}
                >
                    {isSaving ? "Saving..." : (
                        <>
                            <Save size={18} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, highlight }: any) {
    return (
        <div style={{
            background: 'var(--color-surface)',
            padding: '0.75rem',
            borderRadius: '8px',
            border: highlight ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            <div style={{ color: 'var(--color-fg-muted)' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: highlight ? 'var(--color-accent)' : 'var(--color-fg)' }}>{value}</div>
            </div>
        </div>
    );
}
