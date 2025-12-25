"use client";

import React, { useEffect, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import ToVerifyCard from "@/components/awareness/ToVerifyCard";
import ToReviewCard from "@/components/awareness/ToReviewCard";
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

    const dueReviews = useMemo(() => {
        const now = new Date();
        return verified.filter(m => {
            if (!m.next_review_at) return false;
            return new Date(m.next_review_at) <= now;
        });
    }, [verified]);

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

            {/* To Verify Queue */}
            {unverified.length > 0 && (
                <ToVerifyCard unverifiedMemos={unverified} />
            )}

            {/* To Review Queue */}
            {dueReviews.length > 0 && (
                <ToReviewCard dueMemos={dueReviews} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-8)" }}>

                {/* Unverified Column (Added per user request) */}
                <section>
                    <h3 style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                        Unverified ({unverified.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {unverified.map(m => (
                            <MemoCard key={m.id} memo={m} />
                        ))}
                        {unverified.length === 0 && <div style={emptyStyle}>No unverified items.</div>}
                    </div>
                </section>

                {/* Attempted Column */}
                <section>
                    <h3 style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                        Attempted ({attempted.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {attempted.map(m => (
                            <MemoCard key={m.id} memo={m} />
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
                            <MemoCard key={m.id} memo={m} />
                        ))}
                        {verified.length === 0 && <div style={emptyStyle}>No verified items yet.</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}

const CONFIDENCE_COLORS: Record<string, string> = {
    high: "var(--color-success)",
    medium: "var(--color-warning)",
    low: "var(--color-destructive)",
    default: "var(--color-info)"
};

function MemoCard({ memo }: { memo: any }) {
    const confidence = memo.confidence || 'low';
    const color = CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS.default;

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid var(--color-border)',
            borderLeft: `6px solid ${color}`
        }}>
            <div style={{ flex: 1, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-fg)' }}>
                        {memo.token_text}
                    </h4>

                    <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: color,
                        color: 'white',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                    }}>
                        {confidence}
                    </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--color-fg)', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                    {memo.memo || <span style={{ color: 'var(--color-fg-muted)', fontStyle: 'italic' }}>No note...</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>
                        {new Date(memo.created_at || 0).toLocaleDateString()}
                    </span>
                    {memo.usage_count > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Used: <strong>{memo.usage_count}</strong>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

const emptyStyle: React.CSSProperties = {
    color: "var(--color-fg-muted)",
    fontStyle: "italic",
    fontSize: "0.9rem"
};
