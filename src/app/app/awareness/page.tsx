"use client";

import React, { useEffect, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import ToVerifyCard from "@/components/awareness/ToVerifyCard";
import ToReviewCard from "@/components/awareness/ToReviewCard";
import AwarenessStats from "@/components/awareness/AwarenessStats";
import MemoList from "@/components/awareness/MemoList";
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
                    Track your language gap. Identify what you don't know, then master it.
                </p>
            </header>

            {/* Stats Overview */}
            <AwarenessStats counts={{
                unverified: unverified.length,
                attempted: attempted.length,
                verified: verified.length
            }} />

            {/* Main Content - Tabbed List */}
            <MemoList
                unverified={unverified}
                attempted={attempted}
                verified={verified}
            />
        </div>
    );
}
