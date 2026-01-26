"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { TTS_VOICES } from "@/lib/data";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentVoice: string;
    learnerMode: boolean;
    onVoiceChange: (voice: string) => void;
    onLearnerModeChange: (enabled: boolean) => void;
}

export function VoiceSettingsModal({
    isOpen,
    onClose,
    currentVoice,
    learnerMode,
    onVoiceChange,
    onLearnerModeChange,
}: Props) {
    const [tab, setTab] = useState<"female" | "male">(
        TTS_VOICES.find((v) => v.name === currentVoice)?.gender === "male" ? "male" : "female"
    );

    if (!isOpen) return null;

    const filteredVoices = TTS_VOICES.filter((v) => v.gender === tab);

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.3)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "ctxFadeIn 0.15s ease-out",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "16px",
                    minWidth: "220px",
                    maxWidth: "260px",
                    maxHeight: "70vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.12))",
                    animation: "ctxScaleIn 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
            >
                {/* Learner Mode - menu item with checkmark */}
                <button
                    onClick={() => onLearnerModeChange(!learnerMode)}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 16px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: learnerMode ? "var(--color-accent)" : "var(--color-fg)",
                        fontWeight: learnerMode ? 600 : 400,
                        fontFamily: "inherit",
                        textAlign: "left",
                    }}
                >
                    <span>はっきり読む</span>
                    {learnerMode && <Check size={16} strokeWidth={2.5} color="var(--color-accent)" />}
                </button>

                {/* Voice section header with gender tabs */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 16px 6px",
                    borderTop: "1px solid var(--color-border)",
                    flexShrink: 0,
                }}>
                    <div style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "var(--color-fg-muted)",
                        textTransform: "uppercase",
                    }}>
                        ボイス
                    </div>
                    <div style={{
                        display: "flex",
                        gap: "2px",
                        background: "var(--color-bg-sub)",
                        borderRadius: "999px",
                        padding: "2px",
                    }}>
                        {(["female", "male"] as const).map((gender) => (
                            <button
                                key={gender}
                                onClick={() => setTab(gender)}
                                style={{
                                    padding: "3px 10px",
                                    borderRadius: "999px",
                                    border: "none",
                                    background: tab === gender ? "var(--color-fg)" : "transparent",
                                    color: tab === gender ? "var(--color-surface)" : "var(--color-fg-muted)",
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {gender === "female" ? "女性" : "男性"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice List (scrollable) */}
                <div style={{
                    overflowY: "auto",
                    flex: 1,
                    minHeight: 0,
                }}>
                    {filteredVoices.map((voice) => {
                        const isActive = voice.name === currentVoice;
                        return (
                            <button
                                key={voice.name}
                                onClick={() => {
                                    onVoiceChange(voice.name);
                                    onClose();
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 16px",
                                    border: "none",
                                    borderTop: "1px solid var(--color-border)",
                                    background: isActive ? "var(--color-bg-sub)" : "transparent",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    color: isActive ? "var(--color-accent)" : "var(--color-fg)",
                                    fontWeight: isActive ? 600 : 400,
                                    fontFamily: "inherit",
                                    textAlign: "left",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                    <span>{voice.name}</span>
                                    <span style={{
                                        fontSize: "0.7rem",
                                        color: "var(--color-fg-muted)",
                                        fontWeight: 400,
                                    }}>
                                        {voice.label}
                                    </span>
                                </div>
                                {isActive && <Check size={16} strokeWidth={2.5} color="var(--color-accent)" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes ctxFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes ctxScaleIn {
                    from { transform: scale(0.92); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
}