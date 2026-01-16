"use client";

import React, { useState } from "react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { StickyNote, Trash2, CheckSquare } from "lucide-react";

interface Props {
}

export default function MemoDropZone({ }: Props) {
    const { addMemo, isMultiSelectMode, toggleMultiSelectMode } = useAwarenessStore();
    const { user, activeLanguageCode } = useAppStore();
    const [draft, setDraft] = useState<{ text: string, phraseId: string, index: number, confidence: "high" | "medium" | "low", note: string } | null>(null);
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;

        try {
            const { text, phraseId, index } = JSON.parse(data);
            setDraft({ text, phraseId, index, confidence: "low", note: "" });
        } catch (err) {
            console.error("Invalid drag data", err);
        }
    };

    // Listen for custom touch-drop events from TokenizedSentence
    React.useEffect(() => {
        const handleTouchDrop = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                const { text, phraseId, index } = customEvent.detail;
                setDraft({ text, phraseId, index, confidence: "low", note: "" });
                setIsOver(false);
            }
        };

        const zone = document.getElementById('memo-drop-zone');
        if (zone) {
            zone.addEventListener('touch-drop', handleTouchDrop);
        }

        // Also listen on window/document just in case bubbling is weird, or ensure bubbling works.
        // Actually, TokenizedSentence dispatches on the zone element found via elementFromPoint.
        // But we need to make sure we attach the listener to the RIGHT element.
        // Let's add an ID to the div.

        return () => {
            if (zone) zone.removeEventListener('touch-drop', handleTouchDrop);
        };
    }, []);

    const handleRegister = async () => {
        if (!draft || !user) return;
        await addMemo(user.id, draft.phraseId, draft.index, draft.text, draft.confidence, activeLanguageCode, draft.note);
        setDraft(null); // Clear draft after registration
    };

    const CONFIDENCE_COLORS = {
        high: { color: "#22c55e", bg: "#dcfce7", label: "High" },
        medium: { color: "#f97316", bg: "#ffedd5", label: "Med" },
        low: { color: "#ef4444", bg: "#fee2e2", label: "Low" }
    };

    const activeConf = draft ? CONFIDENCE_COLORS[draft.confidence] : CONFIDENCE_COLORS.low;

    return (
        <div
            id="memo-drop-zone"
            data-drop-zone="true"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                flex: 1,
                maxWidth: draft ? "400px" : "300px",
                minWidth: "200px",
                height: draft ? "auto" : "50px",
                minHeight: "50px",
                // Remove border/background when draft is active to let the card stand out? 
                // Alternatively, container is invisible, card is visible.
                border: draft ? "none" : "2px dashed var(--color-border)",
                borderColor: isOver ? "var(--color-accent)" : (draft ? "transparent" : "var(--color-border)"),
                borderRadius: "var(--radius-md)",
                background: isOver && !draft ? "var(--color-bg-subtle)" : "transparent",
                display: "flex",
                alignItems: draft ? "stretch" : "center",
                justifyContent: draft ? "flex-start" : "center",
                transition: "all 0.2s",
                marginLeft: "var(--space-4)",
                padding: 0,
                position: "relative",
                cursor: draft ? "default" : "default",
                zIndex: 20,
                overflow: "hidden"
            }}
        >
            {!draft ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: '0' }}>
                    {/* Left Half: Drop Zone Indicator */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        borderRight: '1px dashed var(--color-border)',
                        color: isOver ? "var(--color-accent)" : "var(--color-fg-muted)",
                        fontSize: "0.85rem",
                    }}>
                        Drop words here
                    </div>

                    {/* Right Half: Multi-Select Toggle - Mobile Only */}
                    <div
                        className="mobile-only"
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                toggleMultiSelectMode();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isMultiSelectMode ? "var(--color-accent)" : "transparent",
                                color: isMultiSelectMode ? "#fff" : "var(--color-fg-muted)",
                                border: `1px solid ${isMultiSelectMode ? "var(--color-accent)" : "var(--color-border)"}`,
                                borderRadius: "var(--radius-sm)",
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            <CheckSquare size={14} />
                            <span>複数選択</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{
                    width: "100%",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderLeft: `5px solid ${activeConf.color}`,
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3)",
                    boxShadow: "var(--shadow-lg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    position: "relative", // Changed from absolute to relative to push content down
                    zIndex: 50,
                    minWidth: "300px"
                }}>
                    {/* Header: Text + Confidence */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-fg)" }}>
                            {draft.text}
                        </span>
                        <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", padding: "2px" }}>
                            {(["high", "medium", "low"] as const).map(level => {
                                const config = CONFIDENCE_COLORS[level];
                                const isActive = draft.confidence === level;
                                return (
                                    <button
                                        key={level}
                                        onClick={() => setDraft({ ...draft, confidence: level })}
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
                                    >
                                        {config.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Note Input */}
                    <input
                        type="text"
                        value={draft.note}
                        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                        placeholder="Add a note..."
                        style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.95rem",
                            outline: "none",
                            color: "var(--color-fg-muted)",
                            height: "24px",
                            padding: 0
                        }}
                    />

                    {/* Footer: Date + Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-border-subtle)" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", opacity: 0.7 }}>
                            {new Date().toLocaleDateString()}
                        </span>

                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                            <button
                                onClick={() => setDraft(null)}
                                style={{
                                    background: "none", border: "none", cursor: "pointer", color: "var(--color-fg-muted)", opacity: 0.6
                                }}
                                title="Cancel"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={handleRegister}
                                style={{
                                    background: "var(--color-fg)",
                                    color: "var(--color-bg)",
                                    border: "none",
                                    borderRadius: "var(--radius-sm)",
                                    padding: "6px 16px",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
