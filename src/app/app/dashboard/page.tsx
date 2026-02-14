"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store"; // Import store
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import Link from "next/link";
import { ChevronRight, Check, BookOpen, ChevronDown, Settings, ShoppingBag, Volume2, Compass, PenTool, ImagePlus, Zap, Crown } from "lucide-react";
import { useSettingsStore, NavItemKey } from "@/store/settings-store";
import { NAV_ITEM_REGISTRY, getMiddleNavKeys } from "@/lib/nav-items";
import { DashboardResponse } from "@/lib/gamification";
import { LANGUAGES } from "@/lib/data";
import styles from "./page.module.css";
import ToReviewCard from "@/components/awareness/ToReviewCard"; // Import Card
import ToVerifyCard from "@/components/awareness/ToVerifyCard"; // Import Card
import { translations } from "@/lib/translations";
import StreakCard from "@/components/dashboard/StreakCard";
import AnnouncementBell from "@/components/dashboard/AnnouncementBell";
import GiftButton from "@/components/dashboard/GiftButton";
import LevelCardC from "@/components/dashboard/LevelCardC";


const ALL_NAV_KEYS: NavItemKey[] = Object.keys(NAV_ITEM_REGISTRY) as NavItemKey[];

const NAV_ITEM_COLORS: Record<NavItemKey, string> = {
    phrases: "#3b82f6",
    corrections: "#10b981",
    awareness: "#8b5cf6",
    "learning-review": "#22c55e",
    chat: "#f59e0b",
    expressions: "#06b6d4",
    "sentence-analysis": "#ef4444",
    "vocabulary-sets": "#f97316",
    etymology: "#8b5cf6",
    "swipe-deck": "#ec4899",
    "script-learning": "#6366f1",
    "long-text": "#14b8a6",
    "grammar-diagnostic": "#10b981",
    "phrasal-verbs": "#f59e0b",
    "vocab-generator": "#a855f7",
    "my-vocabulary": "#0ea5e9",
};

export default function DashboardPage() {
    const { activeLanguage, activeLanguageCode, profile, user, setActiveLanguage, nativeLanguage } = useAppStore();
    const { memos, fetchMemos, isLoading: isAwarenessLoading } = useAwarenessStore(); // Use store
    const { logEvent } = useHistoryStore();
    const { learningGoal, customNavItems } = useSettingsStore();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLangOpen, setIsLangOpen] = useState(false);
    // Fetch Dashboard & Awareness Data in parallel
    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }
        const userId = user.id;

        async function fetchAllData() {
            try {
                // Fetch all data in parallel (checkin, dashboard, memos)
                await Promise.all([
                    // Record today's login and log event
                    fetch('/api/checkin', { method: 'POST' })
                        .then(res => {
                            if (res.ok) {
                                logEvent(TRACKING_EVENTS.DAILY_CHECKIN, 0, {
                                    date: new Date().toISOString().split('T')[0],
                                });
                            }
                        })
                        .catch(() => {}),
                    fetch(`/api/dashboard?lang=${nativeLanguage}&learning_lang=${activeLanguageCode}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(dashboardData => { if (dashboardData) setData(dashboardData); }),
                    fetchMemos(userId, activeLanguageCode)
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllData();
    }, [user?.id, activeLanguageCode, nativeLanguage, fetchMemos]);

    // Computed Awareness Lists
    const memoList = useMemo(() => Object.values(memos).flat(), [memos]);

    // Only show unverified and due reviews on dashboard to keep it focused
    const unverified = useMemo(() => memoList.filter(m => m.status === 'unverified'), [memoList]);
    const dueReviews = useMemo(() => {
        const now = new Date();
        return memoList.filter(m => {
            // Ensure we only count verified items that are actually due
            if (m.status !== 'verified' || !m.next_review_at) return false;
            return new Date(m.next_review_at) <= now;
        });
    }, [memoList]);

    const middleKeys = useMemo(() => getMiddleNavKeys(learningGoal, customNavItems), [learningGoal, customNavItems]);
    const secondaryKeys = useMemo(() => ALL_NAV_KEYS.filter(k => !middleKeys.includes(k) && k !== "my-vocabulary"), [middleKeys]);

    if (!activeLanguage) return null;

    const displayName = data?.profile.displayName || profile?.username || user?.email?.split("@")[0] || "Learner";

    if (isLoading) return (
        <div className={styles.loadingContainer}>
            {/* Animated skeleton header */}
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonPulse} style={{ width: '200px', height: '32px', borderRadius: '8px' }} />
                <div className={styles.skeletonPulse} style={{ width: '150px', height: '20px', borderRadius: '6px', marginTop: '8px' }} />
            </div>

            {/* Skeleton grid */}
            <div className={styles.skeletonGrid}>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonPulse} style={{ width: '100%', height: '24px', borderRadius: '4px' }} />
                    <div className={styles.skeletonPulse} style={{ width: '60%', height: '16px', borderRadius: '4px', marginTop: '12px' }} />
                    <div className={styles.skeletonPulse} style={{ width: '80%', height: '12px', borderRadius: '4px', marginTop: '8px' }} />
                </div>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonPulse} style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
                </div>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonPulse} style={{ width: '100%', height: '24px', borderRadius: '4px' }} />
                    <div className={styles.skeletonPulse} style={{ width: '70%', height: '16px', borderRadius: '4px', marginTop: '12px' }} />
                </div>
            </div>
        </div>
    );
    if (!data) return null;

    const { level, streak } = data;

    const t = translations[nativeLanguage];

    return (
        <div className={styles.container}>
            {/* Mobile Header Buttons */}
            <div className={styles.mobileHeaderButtons}>
                <GiftButton />
                <AnnouncementBell />
                <Link href="/app/settings" className={styles.mobileSettingsBtn}>
                    <Settings size={20} />
                </Link>
            </div>

            {/* Header - Compact */}
            <header className={styles.header}>
                <h1 className={styles.title}>{t.welcomeBack}<br />{displayName}.</h1>
                <div className={styles.subtitleWrapper}>
                    <div className={styles.langSelector}>
                        <button
                            className={styles.langButton}
                            onClick={() => setIsLangOpen(!isLangOpen)}
                        >
                            <span className={styles.langName}>{(t as any)[`language_${activeLanguageCode}`] || activeLanguage.name}</span>
                            <ChevronDown size={16} className={`${styles.chevron} ${isLangOpen ? styles.rotate : ''}`} />
                        </button>

                        {isLangOpen && (
                            <div className={styles.langDropdown}>
                                {LANGUAGES.filter(lang => lang.code !== nativeLanguage).map((lang) => (
                                    <button
                                        key={lang.code}
                                        className={`${styles.langOption} ${activeLanguageCode === lang.code ? styles.activeLang : ''}`}
                                        onClick={() => {
                                            setActiveLanguage(lang.code);
                                            setIsLangOpen(false);
                                        }}
                                    >
                                        <span>{(t as any)[`language_${lang.code}`] || lang.name}</span>
                                        {activeLanguageCode === lang.code && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span>{t.waitingForYou}</span>
                </div>
            </header>

            {/* ACTION ZONE: Priority Tasks (Review / Verify) */}
            {/* ACTION ZONE: Priority Tasks (Review / Verify) */}
            {(dueReviews.length > 0 || unverified.length > 0) && (
                <div style={{
                    marginBottom: 'var(--space-4)', // Reduced margin
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive grid
                    gap: 'var(--space-4)'
                }}>
                    {dueReviews.length > 0 && <ToReviewCard dueMemos={dueReviews} />}
                    {unverified.length > 0 && <ToVerifyCard unverifiedMemos={unverified} />}
                </div>
            )}


            {/* Main Grid - Optimized for Single Screen */}
            <div className={styles.mainGrid}>

                {/* LEFT COLUMN: Level + Quest */}
                <div className={styles.column}>
                    {/* Level Card - Variant C */}
                    <LevelCardC
                        level={level.current.level}
                        title={level.current.title}
                        currentXp={level.currentXp}
                        nextLevelXp={level.nextLevelXp}
                        progressPercent={level.progressPercent}
                        totalWords={data.stats.totalWords}
                        streak={streak.current}
                        labels={{
                            streak: t.streak,
                            words: t.words,
                        }}
                    />

                    {/* Today's Quest Card (Hidden) */}
                </div>

                {/* CENTER + RIGHT: Streak & Account (side by side on mobile) */}
                <div className={styles.mobileRow}>
                    {/* Streak Card */}
                    <div className={styles.streakContainer}>
                        <StreakCard streak={streak} loginDays={data.loginDays || []} compact />
                    </div>

                    {/* Account Status Card */}
                    <div className={styles.accountCardCompact}>
                        <div className={styles.accountHeader}>
                            <div className={styles.accountPlanBadge} data-plan={data.usage?.plan || "free"}>
                                {(data.usage?.plan === "pro") ? <Crown size={14} /> : <Zap size={14} />}
                                <span>
                                    {(data.usage?.plan === "pro")
                                        ? (t as any).planPro || "プロ"
                                        : (data.usage?.plan === "standard")
                                            ? (t as any).planStandard || "スタンダード"
                                            : (t as any).freePlan || "無料プラン"}
                                </span>
                            </div>
                            <Link href="/app/account" className={styles.accountUpgrade}>
                                {(t as any).viewDetails || "詳細を見る"}
                                <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div className={styles.creditsHeader}>
                            <span className={styles.creditsHeaderLabel}>{(t as any).todayRemaining || "今日の残り"}</span>
                        </div>

                        <div className={styles.creditsGrid}>
                            <div className={styles.creditItem}>
                                <div className={styles.creditIcon} style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)" }}>
                                    <Volume2 size={16} />
                                </div>
                                <div className={styles.creditInfo}>
                                    <span className={styles.creditLabel}>{(t as any).singleAudio || "音声"}</span>
                                    <span className={styles.creditValue}>
                                        {data.usage?.remaining.audio ?? 0}
                                        <span className={styles.creditLimit}>/{data.usage?.limits.audio ?? 5}</span>
                                    </span>
                                </div>
                            </div>
                            <div className={styles.creditItem}>
                                <div className={styles.creditIcon} style={{ color: "#10b981", background: "rgba(16,185,129,0.1)" }}>
                                    <Compass size={16} />
                                </div>
                                <div className={styles.creditInfo}>
                                    <span className={styles.creditLabel}>{(t as any).singleExplorer || "単語解析"}</span>
                                    <span className={styles.creditValue}>
                                        {data.usage?.remaining.explorer ?? 0}
                                        <span className={styles.creditLimit}>/{data.usage?.limits.explorer ?? 5}</span>
                                    </span>
                                </div>
                            </div>
                            <div className={styles.creditItem}>
                                <div className={styles.creditIcon} style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.1)" }}>
                                    <PenTool size={16} />
                                </div>
                                <div className={styles.creditInfo}>
                                    <span className={styles.creditLabel}>{(t as any).singleCorrection || "添削"}</span>
                                    <span className={styles.creditValue}>
                                        {data.usage?.remaining.correction ?? 0}
                                        <span className={styles.creditLimit}>/{data.usage?.limits.correction ?? 3}</span>
                                    </span>
                                </div>
                            </div>
                            <div className={styles.creditItem}>
                                <div className={styles.creditIcon} style={{ color: "#f97316", background: "rgba(249,115,22,0.1)" }}>
                                    <ImagePlus size={16} />
                                </div>
                                <div className={styles.creditInfo}>
                                    <span className={styles.creditLabel}>{(t as any).singleExtract || "画像抽出"}</span>
                                    <span className={styles.creditValue}>
                                        {data.usage?.remaining.extraction ?? 0}
                                        <span className={styles.creditLimit}>/{data.usage?.limits.extraction ?? 1}</span>
                                    </span>
                                </div>
                            </div>
                            <div className={styles.creditItem}>
                                <div className={styles.creditIcon} style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
                                    <BookOpen size={16} />
                                </div>
                                <div className={styles.creditInfo}>
                                    <span className={styles.creditLabel}>{(t as any).singleExplanation || "文法解説"}</span>
                                    <span className={styles.creditValue}>
                                        {data.usage?.remaining.explanation ?? 0}
                                        <span className={styles.creditLimit}>/{data.usage?.limits.explanation ?? 1}</span>
                                    </span>
                                </div>
                            </div>
                            <Link href="/app/shop" className={styles.creditItemBuy}>
                                <ShoppingBag size={18} />
                                <span>{(t as any).upgradePlan || "アップグレード"}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Other Learning Features (dynamic based on learning goal) */}
            {secondaryKeys.length > 0 && (
                <div className={styles.bonusSection}>
                    <h3 className={styles.bonusSectionTitle}>{(t as any).otherFeatures || "その他の学習機能"}</h3>
                    <div className={styles.bonusGrid}>
                        {secondaryKeys.map(key => {
                            const def = NAV_ITEM_REGISTRY[key];
                            if (!def) return null;
                            const color = NAV_ITEM_COLORS[key];
                            const Icon = def.icon;
                            return (
                                <Link key={def.href} href={def.href} className={styles.bonusGridItem}>
                                    <div className={styles.bonusGridIcon} style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, boxShadow: `0 2px 8px ${color}4d` }}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={styles.bonusGridLabel}>{def.getLabel(t)}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}
