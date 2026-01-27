"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

const SPEED_PRESETS = [0.5, 0.75, 0.8, 0.9, 1.0, 1.1, 1.2, 1.25, 1.5, 2.0];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentSpeed: number;
    onSpeedChange: (speed: number) => void;
}

export function SpeedControlModal({ isOpen, onClose, currentSpeed, onSpeedChange }: Props) {
    if (!isOpen) return null;

    const handleSelect = (speed: number) => {
        onSpeedChange(speed);
        onClose();
    };

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
                paddingRight: "25%",
                animation: "ctxFadeIn 0.15s ease-out",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "16px",
                    minWidth: "200px",
                    maxWidth: "240px",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.12))",
                    animation: "ctxScaleIn 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "12px 16px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--color-fg-muted)",
                    textTransform: "uppercase",
                }}>
                    再生速度
                </div>

                {/* Speed Items */}
                {SPEED_PRESETS.map((speed, i) => {
                    const isActive = Math.abs(currentSpeed - speed) < 0.01;
                    return (
                        <button
                            key={speed}
                            onClick={() => handleSelect(speed)}
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
                            <span>{speed === 1.0 ? "標準 (1.0x)" : `${speed}x`}</span>
                            {isActive && <Check size={16} strokeWidth={2.5} color="var(--color-accent)" />}
                        </button>
                    );
                })}
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