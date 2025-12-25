"use client";

import React, { useEffect, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import ToVerifyCard from "@/components/awareness/ToVerifyCard";
import { Loader2 } from "lucide-react";

export default function AwarenessPage() {
    const { user, profile, activeLanguageCode } = useAppStore();
    const { memos, fetchMemos, isLoading } = useAwarenessStore();

    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchMemos]);

    const memoList = useMemo(() => {
        return Object.values(memos).flat();
    }, [memos]);

    const unverified = useMemo(() => memoList.filter(m => m.status === 'unverified'), [memoList]);
    const attempted = useMemo(() => memoList.filter(m => m.status === 'attempted'), [memoList]);
    const verified = useMemo(() => memoList.filter(m => m.status === 'verified'), [memoList]);

    if (isLoading && memoList.length === 0) {
        return (
            <div style={{ padding: "var(--space-8)", display: "flex", justifyContent: "center" }}>
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "var(--space-6)"
        }}>
            <header style={{ marginBottom: "var(--space-8)" }}>
                <h1 style={{
                    fontSize: "2rem",
                    fontFamily: "var(--font-display)",
                    marginBottom: "var(--space-2)"
                }}>
                    Awareness Memos
                </h1>
                <p style={{ color: "var(--color-fg-muted)" }}>
                    Track your gap, hypotheses, and verifications.
                </p>
            </header>

            {/* To Verify Queue - Always visible here if items exist */}
            {unverified.length > 0 && (
                <ToVerifyCard unverifiedMemos={unverified} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-8)" }}>

                {/* Attempted Column */}
                <section>
                    <h3 style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                        Attempted ({attempted.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {attempted.map(m => (
                            <div key={m.id} style={cardStyle}>
                                <div style={{ fontWeight: 600 }}>{m.token_text}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>{m.memo}</div>
                            </div>
                        ))}
                        {attempted.length === 0 && <div style={emptyStyle}>No attempted items yet.</div>}
                    </div>
                </section>

                {/* Verified Column */}
                <section>
                    <h3 style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                        Verified ({verified.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {verified.map(m => (
                            <div key={m.id} style={cardStyle}>
                                <div style={{ fontWeight: 600, color: "var(--color-accent)" }}>{m.token_text}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>{m.memo}</div>
                            </div>
                        ))}
                        {verified.length === 0 && <div style={emptyStyle}>No verified items yet.</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    padding: "var(--space-4)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
};

const emptyStyle: React.CSSProperties = {
    color: "var(--color-fg-muted)",
    fontStyle: "italic",
    fontSize: "0.9rem"
};
