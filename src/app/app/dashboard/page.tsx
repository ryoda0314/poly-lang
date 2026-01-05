"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store"; // Import store
import Link from "next/link";
import { ChevronRight, Check, MessageSquare, Calendar, BookOpen, Map, Trophy, ChevronDown } from "lucide-react";
import { DashboardResponse } from "@/lib/gamification";
import { LANGUAGES } from "@/lib/data";
import styles from "./page.module.css";
import ToReviewCard from "@/components/awareness/ToReviewCard"; // Import Card
import ToVerifyCard from "@/components/awareness/ToVerifyCard"; // Import Card

export default function DashboardPage() {
    const { activeLanguage, activeLanguageCode, profile, user, setActiveLanguage } = useAppStore();
    const { memos, fetchMemos, isLoading: isAwarenessLoading } = useAwarenessStore(); // Use store
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLangOpen, setIsLangOpen] = useState(false);

    // Fetch Dashboard Data
    useEffect(() => {
        async function fetchDashboard() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/dashboard?lang=${activeLanguageCode}`);
                if (response.ok) {
                    const dashboardData = await response.json();
                    setData(dashboardData);
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDashboard();
    }, [user?.id, activeLanguageCode]);

    // Fetch Awareness Data
    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchMemos]);

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

    // Calendar Data Generation (Mocking for visual consistency)
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    if (isLoading) return <div className={styles.loading}>Loading dashboard...</div>;
    if (!data) return null;

    const { level, quests, badges, streak } = data;

    return (
        <div className={styles.container}>
            {/* Header - Compact */}
            <header className={styles.header}>
                <h1 className={styles.title}>Welcome back, {displayName}.</h1>
                <div className={styles.subtitleWrapper}>
                    <div className={styles.langSelector}>
                        <button
                            className={styles.langButton}
                            onClick={() => setIsLangOpen(!isLangOpen)}
                        >
                            <span className={styles.langName}>{activeLanguage.name}</span>
                            <ChevronDown size={16} className={`${styles.chevron} ${isLangOpen ? styles.rotate : ''}`} />
                        </button>

                        {isLangOpen && (
                            <div className={styles.langDropdown}>
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        className={`${styles.langOption} ${activeLanguageCode === lang.code ? styles.activeLang : ''}`}
                                        onClick={() => {
                                            setActiveLanguage(lang.code);
                                            setIsLangOpen(false);
                                        }}
                                    >
                                        <span>{lang.name}</span>
                                        {activeLanguageCode === lang.code && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span>is waiting for you.</span>
                </div>
            </header>

            {/* ACTION ZONE: Priority Tasks (Review / Verify) */}
            {(dueReviews.length > 0 || unverified.length > 0) && (
                <div style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
                            <div className={styles.levelLabel}>Level {level.current.level}</div>
                            <div className={styles.levelTitle}>{level.current.title}</div>
                        </div>

                        <div className={styles.xpBarWrapper}>
                            <div className={styles.xpBar}>
                                <div className={styles.xpProgress} style={{ width: `${level.progressPercent}%` }} />
                                <span className={styles.xpText}>{Math.floor(level.currentXp)} XP</span>
                            </div>
                        </div>

                        <div className={styles.nextUnlock}>
                            <span className={styles.nextUnlockLabel}>Next:</span>
                            <Trophy size={14} className={styles.nextUnlockIcon} />
                            <span className={styles.nextUnlockText}>{level.next ? `Level ${level.next.level}` : 'Max Level'}</span>
                        </div>

                        <div className={styles.statsFooter}>
                            <span className={styles.statBold}>{data.stats.totalWords}</span>&nbsp;Words •&nbsp;
                            <span className={styles.statBold}>{streak.current}</span>&nbsp;Streak
                        </div>
                    </div>

                    {/* Today's Quest Card */}
                    <div className={`${styles.card} ${styles.flexGrow}`}>
                        <div className={styles.questCardHeader}>
                            <div className={styles.questCardTitle}>Today&apos;s Quest</div>
                            <div className={styles.questCardCount}>{quests.filter(q => q.completed).length}/{quests.length}</div>
                        </div>

                        <div className={styles.questList}>
                            {quests.length > 0 ? quests.map((q, i) => (
                                <div key={q.id || i} className={styles.questItem}>
                                    <div className={`${styles.questCheckbox} ${q.completed ? styles.questCheckboxDone : ''}`}>
                                        {q.completed && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.questContent}>
                                        <span style={{
                                            textDecoration: q.completed ? 'line-through' : 'none',
                                            color: q.completed ? '#9CA3AF' : 'inherit'
                                        }}>
                                            {q.title}
                                        </span>
                                        <span className={styles.questXP}>+{q.xp_reward}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className={styles.emptyState}>No quests active</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Streak + Action 1 */}
                <div className={styles.column}>
                    <div className={styles.card}>
                        <div className={styles.streakHeader}>
                            <div className={styles.streakTitle}>Streak</div>
                            <div className={styles.streakPage}>{streak.current > 0 ? streak.current : 0} Days</div>
                        </div>

                        <div className={styles.calendarWrapper}>
                            <div className={styles.weekDays}>
                                {weekDays.map((d, i) => <span key={i}>{d}</span>)}
                            </div>
                            <div className={styles.calendarDays}>
                                {[14, 15, 16, 17, 18, 19, 20].map(d => <span key={d}>{d}</span>)}
                            </div>
                            <div className={styles.activityGrid}>
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={`r1-${i}`} className={styles.activityCell} style={{ opacity: 0.5 }} />
                                ))}
                                {/* Mocking visual activity for now based on streak logic placeholder */}
                                {[14, 15, 16, 17, 18, 19, 20].map((d, i) => (
                                    <div
                                        key={`r2-${i}`}
                                        className={`${styles.activityCell} ${i > 3 ? styles.activityCellGreenMedium : styles.activityCellGreenLight}`}
                                    />
                                ))}
                                {[21, 22, 23, 24, 25, 26, 27].map((d, i) => (
                                    <div
                                        key={`r3-${i}`}
                                        className={`${styles.activityCell} ${d === 26 ? styles.activityCellNum : (d < 26 ? styles.activityCellGreenLight : '')}`}
                                    >
                                        {d === 26 ? '26' : ''}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.streakInfoBox}>
                            <div className={styles.streakBigNum}>{streak.current} Day Streak</div>
                            <div className={styles.streakMessageBox}>
                                Keep going! 5分やるだけで<br />記録がつながります
                            </div>
                        </div>
                    </div>

                    {/* Action Card 1: Phrases */}
                    <Link href="/app/phrases" className={styles.actionCard}>
                        <div className={styles.actionIcon}><Map size={24} /></div>
                        <div className={styles.actionContent}>
                            <h3 className={styles.actionTitle}>Explore</h3>
                            <p className={styles.actionDesc}>Start saying phrases.</p>
                        </div>
                    </Link>
                </div>

                {/* RIGHT COLUMN: Badges + Action 2 */}
                <div className={styles.column}>
                    <div className={`${styles.card} ${styles.flexGrow}`}>
                        <div className={styles.badgesHeader}>
                            <span className={styles.badgesTitle}>Badges</span>
                        </div>

                        <div className={styles.badgeList}>
                            {badges.length > 0 ? badges.slice(0, 3).map((badge) => (
                                <Link href="#" key={badge.id} className={styles.badgeItem} style={{ opacity: badge.earned ? 1 : 0.5 }}>
                                    <div className={styles.badgeIconBox}>
                                        <MessageSquare size={24} className={styles.badgeIcon} fill={badge.earned ? "#F0E6D2" : "none"} stroke={badge.earned ? "#D4A368" : "#9CA3AF"} />
                                    </div>
                                    <div className={styles.badgeTexts}>
                                        <span className={styles.badgeName}>{badge.title}</span>
                                        <span className={styles.badgeSub}>{badge.description}</span>
                                    </div>
                                </Link>
                            )) : (
                                <div className={styles.emptyState}>No badges yet</div>
                            )}
                        </div>
                        <Link href="#" className={styles.seeAll}>See all <ChevronRight size={14} /></Link>
                    </div>

                    {/* Action Card 2: Corrections */}
                    <Link href="/app/corrections" className={styles.actionCard}>
                        <div className={styles.actionIcon}><BookOpen size={24} /></div>
                        <div className={styles.actionContent}>
                            <h3 className={styles.actionTitle}>Corrections</h3>
                            <p className={styles.actionDesc}>Say it naturally.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
