"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain } from "lucide-react";

interface ToVerifyCardProps {
    unverifiedMemos: { id: string, token_text: string | null }[];
}

import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

export default function ToVerifyCard({ unverifiedMemos }: ToVerifyCardProps) {
    const router = useRouter();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage as "ja" | "ko" | "en"] || translations.en;

    if (unverifiedMemos.length === 0) return null;

    return (
        <div style={{
            background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%)",
            border: "1px solid var(--color-accent)",
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
                        background: "var(--color-accent)",
                        color: "white",
                        padding: "8px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Brain size={20} />
                    </div>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            fontFamily: "var(--font-display)"
                        }}>
                            {t.readyToVerify}
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            color: "var(--color-fg-muted)"
                        }}>
                            {t.yourAttempt ? `${t.yourAttempt.replace("あなたの発言", "") /* Hack if needed, but better use localized string with placeholder */}` : ""}
                            {/* Correct way: "You have X items..." -> "X items waiting..." */}
                            {unverifiedMemos.length} {t.verifyDesc}
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
                    {t.startSession} <ArrowRight size={16} />
                </button>
            </div>

            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                marginTop: "var(--space-2)"
            }}>
                {unverifiedMemos.slice(0, 10).map((memo, idx) => (
                    <span key={memo.id} style={{
                        background: "var(--color-surface-hover)",
                        border: "1px solid var(--color-border)",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "0.9rem",
                        color: "var(--color-fg)"
                    }}>
                        {memo.token_text || "???"}
                    </span>
                ))}
                {unverifiedMemos.length > 10 && (
                    <span style={{
                        fontSize: "0.8rem",
                        color: "var(--color-fg-muted)",
                        alignSelf: "center",
                        marginLeft: "var(--space-2)"
                    }}>
                        +{unverifiedMemos.length - 10} more
                    </span>
                )}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)', fontStyle: 'italic' }}>
                {t.verifyTip}
            </div>
        </div>
    );
}
