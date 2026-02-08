"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import Link from "next/link";
import { ArrowLeft, Volume2, Compass, PenTool, ImagePlus, BookOpen, History, Zap, Crown, ShoppingBag, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";

interface UsageData {
    plan: string;
    limits: {
        audio: number;
        explorer: number;
        correction: number;
        extraction: number;
        explanation: number;
        etymology: number;
    };
    today: {
        audio: number;
        explorer: number;
        correction: number;
        extraction: number;
        explanation: number;
        etymology: number;
    };
    remaining: {
        audio: number;
        explorer: number;
        correction: number;
        extraction: number;
        explanation: number;
        etymology: number;
    };
}

interface ProfileCredits {
    audio_credits: number;
    explorer_credits: number;
    correction_credits: number;
    extraction_credits: number;
    explanation_credits: number;
    etymology_credits: number;
}

export default function AccountPage() {
    const { user, profile, nativeLanguage } = useAppStore();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const t = translations[nativeLanguage] as any;

    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        async function fetchUsage() {
            try {
                const res = await fetch(`/api/dashboard?lang=${nativeLanguage}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data.usage);
                }
            } catch (error) {
                console.error("Error fetching usage:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUsage();
    }, [user?.id, nativeLanguage]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    const credits: ProfileCredits = {
        audio_credits: (profile as any)?.audio_credits || 0,
        explorer_credits: (profile as any)?.explorer_credits || 0,
        correction_credits: (profile as any)?.correction_credits || 0,
        extraction_credits: (profile as any)?.extraction_credits || 0,
        explanation_credits: (profile as any)?.explanation_credits || 0,
        etymology_credits: (profile as any)?.etymology_credits || 0,
    };

    const planName = usage?.plan === "pro"
        ? (t.planPro || "プロ")
        : usage?.plan === "standard"
            ? (t.planStandard || "スタンダード")
            : (t.freePlan || "無料プラン");

    const usageItems = [
        {
            key: "audio",
            label: t.singleAudio || "音声",
            icon: Volume2,
            color: "#3b82f6",
            limit: usage?.limits.audio || 0,
            used: usage?.today.audio || 0,
            remaining: usage?.remaining.audio || 0,
            credits: credits.audio_credits
        },
        {
            key: "explorer",
            label: t.singleExplorer || "単語解析",
            icon: Compass,
            color: "#10b981",
            limit: usage?.limits.explorer || 0,
            used: usage?.today.explorer || 0,
            remaining: usage?.remaining.explorer || 0,
            credits: credits.explorer_credits
        },
        {
            key: "correction",
            label: t.singleCorrection || "添削",
            icon: PenTool,
            color: "#8b5cf6",
            limit: usage?.limits.correction || 0,
            used: usage?.today.correction || 0,
            remaining: usage?.remaining.correction || 0,
            credits: credits.correction_credits
        },
        {
            key: "extraction",
            label: t.singleExtract || "画像抽出",
            icon: ImagePlus,
            color: "#f97316",
            limit: usage?.limits.extraction || 0,
            used: usage?.today.extraction || 0,
            remaining: usage?.remaining.extraction || 0,
            credits: credits.extraction_credits
        },
        {
            key: "explanation",
            label: t.singleExplanation || "文法解説",
            icon: BookOpen,
            color: "#ef4444",
            limit: usage?.limits.explanation || 0,
            used: usage?.today.explanation || 0,
            remaining: usage?.remaining.explanation || 0,
            credits: credits.explanation_credits
        },
        {
            key: "etymology",
            label: t.singleEtymology || "語源",
            icon: History,
            color: "#6366f1",
            limit: usage?.limits.etymology || 0,
            used: usage?.today.etymology || 0,
            remaining: usage?.remaining.etymology || 0,
            credits: credits.etymology_credits
        },
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/app/dashboard" className={styles.backButton}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>{t.accountUsage || "利用状況"}</h1>
            </header>

            {/* Plan Card */}
            <div className={styles.planCard} data-plan={usage?.plan || "free"}>
                <div className={styles.planHeader}>
                    <div className={styles.planIconWrap}>
                        {usage?.plan === "pro" ? <Crown size={20} /> : <Zap size={20} />}
                    </div>
                    <div className={styles.planInfo}>
                        <span className={styles.planLabel}>{t.currentPlan || "現在のプラン"}</span>
                        <span className={styles.planName}>{planName}</span>
                    </div>
                </div>

                {usage?.plan !== "free" && (
                    <div className={styles.planRenewal}>
                        <Calendar size={13} />
                        <span>{t.nextRenewal || "次回更新日"}: —</span>
                    </div>
                )}

                <div className={styles.planLimitsGrid}>
                    {[
                        { label: t.singleAudio || "音声", value: usage?.limits.audio || 0, icon: Volume2, color: "#3b82f6" },
                        { label: t.singleExplorer || "解析", value: usage?.limits.explorer || 0, icon: Compass, color: "#10b981" },
                        { label: t.singleCorrection || "添削", value: usage?.limits.correction || 0, icon: PenTool, color: "#8b5cf6" },
                        { label: t.singleExtract || "抽出", value: usage?.limits.extraction || 0, icon: ImagePlus, color: "#f97316" },
                        { label: t.singleExplanation || "解説", value: usage?.limits.explanation || 0, icon: BookOpen, color: "#ef4444" },
                        { label: t.singleEtymology || "語源", value: usage?.limits.etymology || 0, icon: History, color: "#6366f1" },
                    ].map(item => {
                        const Icon = item.icon;
                        return (
                            <div key={item.label} className={styles.planLimitItem}>
                                <Icon size={14} style={{ color: item.color }} />
                                <span className={styles.planLimitLabel}>{item.label}</span>
                                <span className={styles.planLimitValue}>{item.value}<span className={styles.planLimitUnit}>{t.perDay || "/日"}</span></span>
                            </div>
                        );
                    })}
                </div>

                <Link href="/app/shop" className={styles.upgradeButton} data-plan={usage?.plan || "free"}>
                    <ShoppingBag size={15} />
                    <span>{usage?.plan === "free" ? (t.upgradePlan || "アップグレード") : (t.managePlan || "プラン管理")}</span>
                    <ChevronRight size={14} />
                </Link>
            </div>

            {/* Today's Usage Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.todayUsage || "今日の使用状況"}</h2>
                <p className={styles.sectionDesc}>{t.todayUsageDesc || "プランの日次上限がリセットされるまでの残り使用回数"}</p>

                <div className={styles.usageGrid}>
                    {usageItems.map(item => {
                        const Icon = item.icon;
                        const percentage = item.limit > 0 ? ((item.limit - item.remaining) / item.limit) * 100 : 0;

                        return (
                            <div key={item.key} className={styles.usageCard}>
                                <div className={styles.usageCardHeader}>
                                    <div className={styles.usageIcon} style={{ color: item.color, background: `${item.color}15` }}>
                                        <Icon size={18} />
                                    </div>
                                    <span className={styles.usageLabel}>{item.label}</span>
                                </div>

                                <div className={styles.usageProgress}>
                                    <div className={styles.usageBar}>
                                        <div
                                            className={styles.usageBarFill}
                                            style={{
                                                width: `${percentage}%`,
                                                background: item.color
                                            }}
                                        />
                                    </div>
                                    <div className={styles.usageNumbers}>
                                        <span className={styles.usageUsed}>{item.used}</span>
                                        <span className={styles.usageDivider}>/</span>
                                        <span className={styles.usageLimit}>{item.limit}</span>
                                    </div>
                                </div>

                                <div className={styles.usageRemaining}>
                                    {t.remaining || "残り"}: <strong>{item.remaining}</strong>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Purchased Credits Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.purchasedCredits || "購入クレジット"}</h2>
                <p className={styles.sectionDesc}>{t.purchasedCreditsDesc || "プランの上限を超えた場合に自動的に消費されます"}</p>

                <div className={styles.creditsGrid}>
                    {usageItems.map(item => {
                        const Icon = item.icon;

                        return (
                            <div key={item.key} className={styles.creditCard}>
                                <div className={styles.creditIcon} style={{ color: item.color, background: `${item.color}15` }}>
                                    <Icon size={16} />
                                </div>
                                <div className={styles.creditInfo}>
                                    <span className={styles.creditLabel}>{item.label}</span>
                                    <span className={styles.creditValue}>
                                        <CreditCard size={12} />
                                        {item.credits}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Link href="/app/shop" className={styles.buyCreditsButton}>
                    <ShoppingBag size={16} />
                    <span>{t.buyCredits || "クレジットを購入"}</span>
                </Link>
            </section>

            {/* Usage Explanation */}
            <section className={styles.infoSection}>
                <h3 className={styles.infoTitle}>{t.howItWorks || "クレジットの仕組み"}</h3>
                <ul className={styles.infoList}>
                    <li>{t.usageInfo1 || "各機能には日次の使用上限があります"}</li>
                    <li>{t.usageInfo2 || "上限に達すると、購入クレジットが自動で消費されます"}</li>
                    <li>{t.usageInfo3 || "日次上限は毎日0時にリセットされます"}</li>
                    <li>{t.usageInfo4 || "上位プランにアップグレードすると上限が増えます"}</li>
                </ul>
            </section>
        </div>
    );
}
