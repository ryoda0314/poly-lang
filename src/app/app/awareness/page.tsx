"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import AwarenessStats from "@/components/awareness/AwarenessStats";
import MemoList from "@/components/awareness/MemoList";
import { Loader2, Brain, Search, CheckCircle, Calendar, BarChart } from "lucide-react";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";

import { translations } from "@/lib/translations";

type Tab = 'unverified' | 'verified';

export default function AwarenessPage() {
    const { user, profile, activeLanguageCode, nativeLanguage } = useAppStore();
    const { memos, fetchMemos, isLoading } = useAwarenessStore();
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('unverified');

    useEffect(() => {
        setIsLayoutReady(true);
    }, []);

    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchMemos]);

    const t = translations[nativeLanguage] || translations.ja;

    const AWARENESS_TUTORIAL_STEPS: TutorialStep[] = [
        {
            title: (t as any).awarenessTutorial_welcome_title || "Welcome to Awareness",
            description: (t as any).awarenessTutorial_welcome_desc || "Here you can manage all the words and phrases you want to be conscious of.",
            icon: <Brain size={48} style={{ color: "var(--color-accent)" }} />
        },
        {
            title: (t as any).awarenessTutorial_unverified_title || "What is Unverified?",
            description: (t as any).awarenessTutorial_unverified_desc || "Newly added memos start here.",
            icon: <Search size={48} style={{ color: "var(--color-warning)" }} />
        },
        {
            title: (t as any).awarenessTutorial_verified_title || "How to Verify",
            description: (t as any).awarenessTutorial_verified_desc || "Use the word in a sentence on the AI Corrections page.",
            icon: <CheckCircle size={48} style={{ color: "var(--color-success)" }} />
        },
        {
            title: (t as any).awarenessTutorial_srs_title || "Learning Management & Retention",
            description: (t as any).awarenessTutorial_srs_desc || "Verified words enter a spaced repetition system.",
            icon: <Calendar size={48} style={{ color: "#3b82f6" }} />
        },
        {
            title: (t as any).awarenessTutorial_progress_title || "Check Your Progress",
            description: (t as any).awarenessTutorial_progress_desc || "Check the status bar and tabs to see your learning progress.",
            icon: <BarChart size={48} style={{ color: "#8b5cf6" }} />
        }
    ];

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
            padding: "var(--space-6)",
            paddingBottom: "100px",
            height: "100%",
            overflowY: "auto",
            position: "relative"
        }}>
            {/* Stats Overview - clickable tabs */}
            <AwarenessStats
                counts={{
                    unverified: unverified.length,
                    attempted: attempted.length,
                    verified: verified.length
                }}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <hr style={{
                border: "none",
                borderTop: "1px solid var(--color-border)",
                margin: "0 0 var(--space-6) 0"
            }} />

            {/* Main Content - List */}
            <MemoList
                unverified={unverified}
                attempted={attempted}
                verified={verified}
                activeTab={activeTab}
            />

            {isLayoutReady && <PageTutorial pageId="awareness" steps={AWARENESS_TUTORIAL_STEPS} />}
        </div>
    );
}
