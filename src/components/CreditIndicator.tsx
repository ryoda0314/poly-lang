"use client";

import React from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import { Coins } from "lucide-react";

export type CreditType = "audio" | "correction" | "explanation" | "extraction" | "explorer" | "etymology";

interface CreditIndicatorProps {
    type: CreditType;
    showLabel?: boolean;
    size?: "sm" | "md";
}

const CREDIT_KEYS: Record<CreditType, keyof NonNullable<ReturnType<typeof useAppStore>["profile"]>> = {
    audio: "audio_credits",
    correction: "correction_credits",
    explanation: "explanation_credits",
    extraction: "extraction_credits",
    explorer: "explorer_credits",
    etymology: "etymology_credits",
};

export default function CreditIndicator({ type, showLabel = false, size = "sm" }: CreditIndicatorProps) {
    const { profile, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.en;

    const rawCredits = profile?.[CREDIT_KEYS[type]];
    const credits = typeof rawCredits === "number" ? rawCredits : 0;

    const isLow = credits <= 2;
    const isEmpty = credits <= 0;

    const iconSize = size === "sm" ? 12 : 14;
    const fontSize = size === "sm" ? "0.7rem" : "0.8rem";
    const padding = size === "sm" ? "2px 6px" : "4px 8px";

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding,
                borderRadius: "12px",
                background: isEmpty
                    ? "rgba(239, 68, 68, 0.1)"
                    : isLow
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                color: isEmpty
                    ? "#dc2626"
                    : isLow
                        ? "#d97706"
                        : "var(--color-fg-muted, #6b7280)",
                fontSize,
                fontWeight: 600,
                whiteSpace: "nowrap",
            }}
            title={`${(t as any)[`credit_${type}`] || type}: ${credits}`}
        >
            <Coins size={iconSize} />
            <span>{credits}</span>
            {showLabel && (
                <span style={{ fontWeight: 400, opacity: 0.8 }}>
                    {(t as any)[`credit_${type}_short`] || type}
                </span>
            )}
        </div>
    );
}
