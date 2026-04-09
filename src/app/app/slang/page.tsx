"use client";

import React, { useEffect } from "react";
import { Sparkles, Hash } from "lucide-react";
import { useSlangStore } from "@/store/slang-store";
import { useAppStore } from "@/store/app-context";

export default function SlangPage() {
    const { terms, isLoading, fetchSlang } = useSlangStore();
    const { activeLanguageCode } = useAppStore();

    useEffect(() => {
        fetchSlang(activeLanguageCode);
    }, [fetchSlang, activeLanguageCode]);

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px", paddingBottom: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <Sparkles size={32} color="var(--color-primary)" />
                <h1 style={{ fontSize: "2rem", margin: 0 }}>Slang Database</h1>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--color-fg-muted)" }}>Loading...</div>
            ) : terms.length === 0 ? (
                <div style={{
                    background: "var(--color-surface)",
                    padding: "32px",
                    borderRadius: "16px",
                    textAlign: "center",
                    border: "1px dashed var(--color-border)"
                }}>
                    <p style={{ fontSize: "1.2rem", color: "var(--color-fg-muted)" }}>No slang terms added for this language yet.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {terms.map(t => (
                        <div key={t.id} style={{
                            background: "var(--color-surface)",
                            borderRadius: "16px",
                            border: "1px solid var(--color-border)",
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--color-fg)" }}>{t.term}</h3>
                                {t.tags && t.tags.length > 0 && (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {t.tags.map((tag, i) => (
                                            <span key={i} style={{
                                                fontSize: "0.75rem",
                                                background: "var(--color-bg)",
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                color: "var(--color-fg-muted)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                <Hash size={12} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Definition */}
                            <div style={{ fontSize: "1rem", color: "var(--color-fg)", lineHeight: 1.5 }}>
                                {t.definition}
                            </div>

                            {/* Example */}
                            <div style={{
                                background: "var(--color-bg-sub)",
                                padding: "16px",
                                borderRadius: "12px",
                                marginTop: "8px",
                                borderLeft: "4px solid var(--color-accent)"
                            }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-fg-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Example</div>
                                <div style={{ fontSize: "1.1rem", fontStyle: "italic", fontFamily: "serif" }}>
                                    "{t.example}"
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
