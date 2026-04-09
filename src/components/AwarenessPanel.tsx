"use client";

import React, { useEffect, useState } from "react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { X, Save, Plus, Trash2 } from "lucide-react";

export default function AwarenessPanel() {
    const { user, activeLanguageCode } = useAppStore();
    const { selectedToken, memos, addMemo, clearSelection } = useAwarenessStore();

    const [memoText, setMemoText] = useState("");
    const [confidence, setConfidence] = useState<"high" | "medium" | "low" | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Computed existing memos for selected token range
    // Logic: If range is single token (start==end), use simple key.
    // If range is multiple, what is the key? 
    // CURRENTLY: Memos are attached to a specific single token_index.
    // Range selection is primarily for *creating* a new memo that spans text (but we store it on the start index? or store range?)
    // Re-reading awareness-store: addMemo takes `tokenIndex`.
    // PROPOSAL: We store the memo on the `startIndex` but we should probably store the `endIndex` or `length` in the DB in future.
    // FOR USER REQUEST: "multiple selection... create memo". 
    // Let's assume we store it on the start index for now, but the `text` field in DB will contain the full combined text, 
    // and we rely on `memosByText` for retrieval if we select the exact same text again.

    // Retrieval strategy for Panel:
    // 1. Exact match on `${phraseId}-${startIndex}` (if single tok)
    // 2. Or, if we want to show memos that *overlap* this selection? 
    // Let's keep it simple: Show memos linked to the `startIndex` of the selection. 
    // AND show memos that match the *text* of the selection.

    const tokenMemos = selectedToken
        ? (memos[`${selectedToken.phraseId}-${selectedToken.startIndex}`] || [])
        : [];

    // Also merge global text matches? 
    // The previous implementation used `memosByText` inside the TokenizedSentence to find *effective* memo for display color.
    // Here we probably want to see them too.
    const textMemos = selectedToken
        ? (useAwarenessStore.getState().memosByText[selectedToken.text.toLowerCase()] || [])
        : [];

    // Deduplicate by ID
    const allMemos = [...tokenMemos, ...textMemos].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    useEffect(() => {
        // Reset form when selection changes
        setMemoText("");
        setConfidence(undefined);
        setIsAdding(false);
    }, [selectedToken]);

    if (!selectedToken) {
        return (
            <div style={{ padding: "2rem", color: "var(--color-fg-muted)", textAlign: "center", fontStyle: "italic" }}>
                Select a word (or Shift+Click range) to view or add memos.
            </div>
        );
    }

    const handleSave = async () => {
        console.log('[AwarenessPanel] handleSave called', { user, confidence, selectedToken, memoText });

        if (!user || !confidence) {
            console.log('[AwarenessPanel] Missing user or confidence, aborting');
            return;
        }

        setIsSaving(true);
        console.log('[AwarenessPanel] Calling addMemo...');
        // We save it associated with the START index of the selection.
        await addMemo(user.id, selectedToken.phraseId, selectedToken.startIndex, selectedToken.text, confidence, activeLanguageCode, memoText);
        console.log('[AwarenessPanel] addMemo completed');
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
                    {/* Removed Awareness Map title */}
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
                {allMemos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                        {allMemos.map((memo) => {
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
                                            {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(memo.created_at || Date.now()))}
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

                {allMemos.length === 0 && !isAdding && (
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
