"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain } from "lucide-react";

interface ToVerifyCardProps {
    unverifiedMemos: { id: string, token_text: string | null }[];
}

export default function ToVerifyCard({ unverifiedMemos }: ToVerifyCardProps) {
    const router = useRouter();

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
                            Ready to Verify?
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            color: "var(--color-fg-muted)"
                        }}>
                            You have {unverifiedMemos.length} items waiting for practice.
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
                    Start Session <ArrowRight size={16} />
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
                Tip: Use these words in a sentence to move them to "Attempted".
            </div>
        </div>
    );
}
