"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store"; // Import store
import Link from "next/link";
import { ChevronRight, Check, MessageSquare, Calendar, BookOpen, Map, Trophy, ChevronDown, Settings, ShoppingBag, Coins } from "lucide-react";
import { DashboardResponse } from "@/lib/gamification";
import { LANGUAGES } from "@/lib/data";
import styles from "./page.module.css";
import ToReviewCard from "@/components/awareness/ToReviewCard"; // Import Card
import ToVerifyCard from "@/components/awareness/ToVerifyCard"; // Import Card
import { translations } from "@/lib/translations";
import StreakCard from "@/components/dashboard/StreakCard";


export default function DashboardPage() {
    const { activeLanguage, activeLanguageCode, profile, user, setActiveLanguage, nativeLanguage } = useAppStore();
    const { memos, fetchMemos, isLoading: isAwarenessLoading } = useAwarenessStore(); // Use store
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
                // Record today's login (updates streak)
                await fetch('/api/checkin', { method: 'POST' }).catch(() => {});

                // Then fetch dashboard & memos in parallel
                await Promise.all([
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
            {/* Mobile Settings Button (Scrolls with page) */}
            <Link href="/app/settings" className={styles.mobileSettingsBtn}>
                <Settings size={20} />
            </Link>

            {/* Header - Compact */}
            <header className={styles.header}>
                <h1 className={styles.title}>{t.welcomeBack} {displayName}.</h1>
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
                    {/* Level Card */}
                    <div className={styles.card}>
                        <div className={styles.levelHeader}>
                            <div className={styles.levelLabel}>{t.level} {level.current.level}</div>
                            <div className={styles.levelTitle}>{level.current.title}</div>
                        </div>

                        <div className={styles.xpBarWrapper}>
                            <div className={styles.xpBar}>
                                <div className={styles.xpProgress} style={{ width: `${level.progressPercent}%` }} />
                                <span className={styles.xpText}>{Math.floor(level.currentXp)} XP</span>
                            </div>
                        </div>

                        <div className={styles.nextUnlock}>
                            <span className={styles.nextUnlockLabel}>{t.next}</span>
                            <Trophy size={14} className={styles.nextUnlockIcon} />
                            <span className={styles.nextUnlockText}>{level.next ? `${t.level} ${level.next.level}` : t.maxLevel}</span>
                            {level.next && (
                                <span className={styles.xpRemaining}>
                                    （{(t as any).xpToNext?.replace("{n}", String(Math.ceil(level.nextLevelXp - level.currentXp))) || `あと ${Math.ceil(level.nextLevelXp - level.currentXp)} XP`}）
                                </span>
                            )}
                        </div>

                        <div className={styles.statsFooter}>
                            <span className={styles.statBold}>{data.stats.totalWords}</span>&nbsp;{t.words} •&nbsp;
                            <span className={styles.statBold}>{streak.current}</span>&nbsp;{t.streak}
                        </div>
                    </div>

                    {/* Today's Quest Card (Hidden) */}
                </div>

                {/* CENTER COLUMN: Streak + Action 1 */}
                <div className={styles.column}>
                    {/* Streak Card */}
                    <div className={styles.streakContainer}>
                        <StreakCard streak={streak} loginDays={data.loginDays || []} />
                    </div>

                    {/* Action Card 1: Phrases */}
                    {/* Action Card 1: Phrases (Hidden) */}
                </div>

                {/* RIGHT COLUMN: Shop + Badges */}
                <div className={styles.column}>
                    {/* Shop Card */}
                    <Link href="/app/shop" className={styles.shopCard}>
                        <div className={styles.shopCardInner}>
                            <div className={styles.shopIconWrapper}>
                                <ShoppingBag size={24} />
                            </div>
                            <div className={styles.shopContent}>
                                <h3 className={styles.shopTitle}>{t.shop}</h3>
                                <p className={styles.shopDesc}>{(t as any).shopDesc}</p>
                            </div>
                            <div className={styles.shopBalance}>
                                <Coins size={16} className={styles.shopCoinIcon} />
                                <span className={styles.shopCoinAmount}>{profile?.coins || 0}</span>
                            </div>
                        </div>
                        <div className={styles.shopCta}>
                            <span>{(t as any).goToShop}</span>
                            <ChevronRight size={16} />
                        </div>
                    </Link>
                </div>
            </div>

        </div>
    );
}
