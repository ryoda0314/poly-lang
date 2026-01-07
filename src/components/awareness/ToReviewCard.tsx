"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Repeat, Clock } from "lucide-react";

interface ToReviewCardProps {
    dueMemos: { id: string, token_text: string | null }[];
}

import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

export default function ToReviewCard({ dueMemos }: ToReviewCardProps) {
    const router = useRouter();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage as "ja" | "ko" | "en"] || translations.en;

    if (dueMemos.length === 0) return null;

    return (
        <div style={{
            background: "linear-gradient(135deg, var(--color-surface) 0%, rgba(56, 189, 248, 0.1) 100%)",
            border: "1px solid var(--color-info)", // Assuming info color is blue/teal, or hardcode color
            borderColor: "rgba(56, 189, 248, 0.5)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)",
            marginBottom: "var(--space-8)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{
                        background: "rgba(56, 189, 248, 1)",
                        color: "white",
                        padding: "8px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Repeat size={20} />
                    </div>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            fontFamily: "var(--font-display)"
                        }}>
                            {t.timeToReview}
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            color: "var(--color-fg-muted)"
                        }}>
                            {dueMemos.length} {t.reviewDesc}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/app/corrections')}
                    style={{
                        background: "var(--color-fg)",
                        color: "var(--color-bg)",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        fontSize: "0.9rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                >
                    {t.startReview} <ArrowRight size={16} />
                </button>
            </div>

            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                marginTop: "var(--space-2)"
            }}>
                {dueMemos.slice(0, 10).map((memo, idx) => (
                    <span key={memo.id} style={{
                        background: "rgba(56, 189, 248, 0.1)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "0.9rem",
                        color: "var(--color-fg)"
                    }}>
                        {memo.token_text || "???"}
                    </span>
                ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} />
                {t.reviewTip}
            </div>
        </div>
    );
}
