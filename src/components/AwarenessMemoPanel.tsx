"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { X, StickyNote, Trash2 } from "lucide-react";

// Sub-component for individual editable memo
function MemoItem({ text, memo, onUpdate, onDelete }: { text: string, memo: any, onUpdate: (id: string, updates: any) => void, onDelete: (id: string) => void }) {
    const [localMemo, setLocalMemo] = useState(memo.memo || "");
    const [localConfidence, setLocalConfidence] = useState(memo.confidence);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync if external updates happen
    useEffect(() => {
        setLocalMemo(memo.memo || "");
        setLocalConfidence(memo.confidence);
    }, [memo]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [localMemo]);

    const handleBlur = () => {
        if (localMemo !== memo.memo) {
            onUpdate(memo.id, { memo: localMemo });
        }
    };

    const handleConfidenceChange = (newConf: string) => {
        setLocalConfidence(newConf);
        onUpdate(memo.id, { confidence: newConf });
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this memo?")) {
            onDelete(memo.id);
        }
    }

    const CONFIDENCE_COLORS = {
        high: { color: "#22c55e", bg: "#dcfce7", label: "High" },
        medium: { color: "#f97316", bg: "#ffedd5", label: "Med" },
        low: { color: "#ef4444", bg: "#fee2e2", label: "Low" }
    };

    const confStyle = CONFIDENCE_COLORS[localConfidence as keyof typeof CONFIDENCE_COLORS] || CONFIDENCE_COLORS.medium;

    return (
        <div style={{
            padding: "var(--space-3)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            borderLeft: `4px solid ${confStyle.color}`,
            background: "var(--color-bg)",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-fg)" }}>{text}</span>
                {/* Confidence Selector */}
                <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", padding: "2px" }}>
                    {Object.entries(CONFIDENCE_COLORS).map(([key, config]) => {
                        const isActive = localConfidence === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handleConfidenceChange(key)}
                                style={{
                                    border: "none",
                                    padding: "2px 6px",
                                    fontSize: "0.65rem",
                                    cursor: "pointer",
                                    borderRadius: "2px",
                                    background: isActive ? config.color : "transparent",
                                    color: isActive ? "#fff" : "var(--color-fg-muted)",
                                    fontWeight: isActive ? 600 : 400,
                                    textTransform: "uppercase"
                                }}
                                title={`Set confidence to ${config.label}`}
                            >
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <textarea
                ref={textareaRef}
                value={localMemo}
                onChange={(e) => setLocalMemo(e.target.value)}
                onBlur={handleBlur}
                placeholder="Add a note..."
                style={{
                    width: "100%",
                    minHeight: "24px",
                    border: "none",
                    background: "transparent",
                    resize: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    color: "var(--color-fg-muted)",
                    outline: "none",
                    padding: 0,
                    lineHeight: 1.5
                }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)", opacity: 0.6 }}>
                    {new Date(memo.created_at).toLocaleDateString()}
                </div>
                <button
                    onClick={handleDelete}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-fg-muted)",
                        cursor: "pointer",
                        padding: "4px",
                        opacity: 0.5,
                        transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                    title="Delete Memo"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

export default function AwarenessMemoPanel() {
    const { user, activeLanguageCode } = useAppStore();
    const { memosByText, fetchMemos, toggleMemoMode, updateMemo, deleteMemo } = useAwarenessStore();
    const [sortedItems, setSortedItems] = useState<{ text: string, memo: any }[]>([]);

    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchMemos]);

    useEffect(() => {
        const items: { text: string, memo: any }[] = [];
        Object.entries(memosByText).forEach(([text, memoList]) => {
            memoList.forEach(m => {
                items.push({ text, memo: m });
            });
        });

        // Sort by date (newest first)
        const sorted = items.sort((a, b) => new Date(b.memo.created_at).getTime() - new Date(a.memo.created_at).getTime());
        setSortedItems(sorted);
    }, [memosByText]);

    return (
        <div style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-surface)",
            borderLeft: "1px solid var(--color-border)",
            overflow: "hidden"
        }}>
            <div style={{
                padding: "var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-bg-subtle)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <StickyNote size={20} color="var(--color-accent)" />
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>My Memos</h3>
                </div>
                <button
                    onClick={toggleMemoMode}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-fg-muted)",
                        cursor: "pointer",
                        padding: "var(--space-1)"
                    }}
                    title="Close Memo Mode"
                >
                    <X size={20} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4)" }}>
                {sortedItems.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--color-fg-muted)", marginTop: "var(--space-8)", fontStyle: "italic" }}>
                        <p>No memos yet.</p>
                        <p style={{ fontSize: "0.9rem" }}>Click words in phrases to add them here.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {sortedItems.map(({ text, memo }) => (
                            <MemoItem
                                key={memo.id}
                                text={text}
                                memo={memo}
                                onUpdate={updateMemo}
                                onDelete={deleteMemo}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
