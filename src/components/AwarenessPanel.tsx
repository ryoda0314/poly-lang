"use client";

import React, { useEffect, useState } from "react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { X, Save, Plus, Trash2 } from "lucide-react";

export default function AwarenessPanel() {
    const { user } = useAppStore();
    const { selectedToken, memos, addMemo, clearSelection } = useAwarenessStore();

    const [memoText, setMemoText] = useState("");
    const [confidence, setConfidence] = useState<"high" | "medium" | "low" | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Computed existing memos for selected token
    const tokenMemos = selectedToken
        ? (memos[`${selectedToken.phraseId}-${selectedToken.tokenIndex}`] || [])
        : [];

    useEffect(() => {
        // Reset form when selection changes
        setMemoText("");
        setConfidence(undefined);
        setIsAdding(false);
    }, [selectedToken]);

    if (!selectedToken) {
        return (
            <div style={{ padding: "2rem", color: "var(--color-fg-muted)", textAlign: "center", fontStyle: "italic" }}>
                Select a word in a phrase to view or add memos.
            </div>
        );
    }

    const handleSave = async () => {
        if (!user || !confidence) return;

        setIsSaving(true);
        await addMemo(user.id, selectedToken.phraseId, selectedToken.tokenIndex, selectedToken.text, confidence, memoText);
        setIsSaving(false);
        setMemoText("");
        setConfidence(undefined);
        setIsAdding(false);
        clearSelection(); // Close panel after save
    };

    const CONFIDENCE_CONFIG = {
        high: { label: "High", color: "#22c55e", bg: "#dcfce7" },
        medium: { label: "Medium", color: "#f97316", bg: "#ffedd5" },
        low: { label: "Low", color: "#ef4444", bg: "#fee2e2" }
    };

    return (
        <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            height: "fit-content",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)"
        }}>
            {/* Header */}
            <div style={{
                padding: "var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-bg-subtle)"
            }}>
                <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Awareness Map</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-accent)" }}>
                        {selectedToken.text}
                    </div>
                </div>
                <button
                    onClick={clearSelection}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-fg-muted)",
                        cursor: "pointer",
                        padding: "var(--space-1)"
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div style={{ padding: "var(--space-4)", overflowY: "auto", flex: 1 }}>

                {/* List Existing Memos */}
                {tokenMemos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                        {tokenMemos.map((memo) => {
                            const conf = CONFIDENCE_CONFIG[memo.confidence as keyof typeof CONFIDENCE_CONFIG] || CONFIDENCE_CONFIG.medium;
                            return (
                                <div key={memo.id} style={{
                                    padding: "var(--space-3)",
                                    borderRadius: "var(--radius-sm)",
                                    borderLeft: `4px solid ${conf.color}`,
                                    background: "var(--color-bg)",
                                    boxShadow: "var(--shadow-sm)"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: conf.color, textTransform: "uppercase" }}>
                                            {conf.label} Confidence
                                        </span>
                                        <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)" }}>
                                            {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(memo.created_at))}
                                        </span>
                                    </div>
                                    {memo.memo && (
                                        <div style={{ fontSize: "0.95rem", lineHeight: 1.5, color: "var(--color-fg)", whiteSpace: "pre-wrap" }}>
                                            {memo.memo}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {tokenMemos.length === 0 && !isAdding && (
                    <div style={{ textAlign: "center", padding: "var(--space-4)", color: "var(--color-fg-muted)", fontSize: "0.9rem" }}>
                        No notes yet for this token.
                    </div>
                )}

                {/* Add Form or Button */}
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            width: "100%",
                            padding: "var(--space-3)",
                            border: "1px dashed var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-fg-muted)",
                            background: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-accent)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
                    >
                        <Plus size={16} /> Add Note
                    </button>
                ) : (
                    <div style={{ animation: "fadeIn 0.2s ease-out" }}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-fg-muted)", marginBottom: "0.5rem" }}>Confidence Level</label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {Object.entries(CONFIDENCE_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setConfidence(key as any)}
                                        style={{
                                            flex: 1,
                                            padding: "0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                            border: confidence === key ? `2px solid ${config.color}` : "1px solid var(--color-border)",
                                            background: confidence === key ? config.bg : "transparent",
                                            color: confidence === key ? config.color : "var(--color-fg-muted)",
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <textarea
                                value={memoText}
                                onChange={(e) => setMemoText(e.target.value)}
                                placeholder="Add a note (optional)..."
                                autoFocus
                                style={{
                                    width: "100%",
                                    minHeight: "80px",
                                    padding: "0.75rem",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border)",
                                    fontFamily: "var(--font-body)",
                                    resize: "vertical",
                                    fontSize: "0.95rem"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                onClick={() => setIsAdding(false)}
                                style={{
                                    flex: 1,
                                    padding: "0.6rem",
                                    border: "1px solid var(--color-border)",
                                    background: "transparent",
                                    color: "var(--color-fg)",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!confidence || isSaving}
                                style={{
                                    flex: 1,
                                    padding: "0.6rem",
                                    background: "var(--color-fg)",
                                    color: "var(--color-bg)",
                                    border: "none",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: "pointer",
                                    opacity: (!confidence || isSaving) ? 0.5 : 1,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                }}
                            >
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
