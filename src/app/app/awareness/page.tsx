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
            title: "気づきのページへようこそ",
            description: "ここでは、あなたが「意識」したい単語やフレーズ（Awareness Memos）を一元管理します。学習の進捗を可視化し、語彙力の向上をサポートします。",
            icon: <Brain size={48} style={{ color: "var(--color-accent)" }} />
        },
        {
            title: "未確認（Unverified）とは",
            description: "新しく追加されたメモはここから始まります。「使いたいけれど、まだ実践で使えていない」言葉たちです。",
            icon: <Search size={48} style={{ color: "var(--color-warning)" }} />
        },
        {
            title: "確認済み（Verified）にする方法",
            description: "メモを「確認済み」にするには、AI添削ページでその単語を使って文章を作ってください。AIが使用を自動検知し、ステータスを更新します。",
            icon: <CheckCircle size={48} style={{ color: "var(--color-success)" }} />
        },
        {
            title: "学習管理と定着",
            description: "「確認済み」になった言葉は、忘却曲線に基づいた定期的な復習サイクル（SRS）に入ります。適切なタイミングで復習を促し、長期記憶への定着を図ります。",
            icon: <Calendar size={48} style={{ color: "#3b82f6" }} />
        },
        {
            title: "進捗の確認",
            description: "上部のステータスバーやタブで、学習中の単語数や定着度を確認できます。自分の成長を実感しながら学習を続けましょう！",
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
