"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store"; // Import store
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import Link from "next/link";
import { ChevronRight, Check, BookOpen, ChevronDown, Settings, ShoppingBag, Volume2, Compass, PenTool, ImagePlus, Zap, Crown, X, Flame } from "lucide-react";
import { DashboardResponse } from "@/lib/gamification";
import { LANGUAGES } from "@/lib/data";
import styles from "./page.module.css";
import { translations } from "@/lib/translations";
import StreakCard from "@/components/dashboard/StreakCard";
import AnnouncementBell from "@/components/dashboard/AnnouncementBell";
import GiftButton from "@/components/dashboard/GiftButton";
import LevelCardC from "@/components/dashboard/LevelCardC";


export default function DashboardPage() {
    const { activeLanguage, activeLanguageCode, profile, user, setActiveLanguage, nativeLanguage } = useAppStore();
    const { fetchMemos } = useAwarenessStore();
    const { logEvent } = useHistoryStore();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
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
                const today = new Date().toISOString().split('T')[0];
                await Promise.all([
                    // Record today's login and log event
                    fetch('/api/checkin', { method: 'POST' })
                        .then(res => {
                            if (res.ok) {
                                logEvent(TRACKING_EVENTS.DAILY_CHECKIN, 0, {
                                    date: today,
                                });
                            }
                        })
                        .catch(() => {}),
                    fetch(`/api/dashboard?lang=${nativeLanguage}&learning_lang=${activeLanguageCode}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(dashboardData => { if (dashboardData) setData(dashboardData); }),
                    fetchMemos(userId, activeLanguageCode),
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllData();
    }, [user?.id, activeLanguageCode, nativeLanguage, fetchMemos]);

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
            {/* Header Row */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}><span className={styles.titleNoWrap}>{t.welcomeBack}</span><br />{displayName}.</h1>
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
                </div>
                <div className={styles.headerRight}>
                    <GiftButton />
                    <AnnouncementBell />
                    <button
                        className={styles.avatarBtn}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <svg className={styles.avatarRing} viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                            <circle
                                cx="24" cy="24" r="22"
                                fill="none"
                                stroke="#D96C45"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${2 * Math.PI * 22 * (1 - level.progressPercent / 100)}`}
                                transform="rotate(-90 24 24)"
                            />
                        </svg>
                        {data.profile.avatarUrl ? (
                            <img
                                src={data.profile.avatarUrl}
                                alt={displayName}
                                className={styles.avatarImage}
                            />
                        ) : (
                            <span className={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</span>
                        )}
                        {streak.current > 0 && (
                            <span className={styles.avatarStreakBadge}>
                                <Flame size={10} />
                                {streak.current}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Profile Panel (toggled by avatar) */}
            {isProfileOpen && (
                <>
                    <div className={styles.profileOverlay} onClick={() => setIsProfileOpen(false)} />
                    <div className={styles.profilePanel}>
                        <div className={styles.profilePanelHeader}>
                            <span className={styles.profilePanelName}>{displayName}</span>
                            <button className={styles.profilePanelClose} onClick={() => setIsProfileOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Level */}
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

                        {/* Streak */}
                        <StreakCard streak={streak} loginDays={data.loginDays || []} compact />

                        {/* Account / Credits */}
                        <div className={styles.profileCredits}>
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
                                <Link href="/app/account" className={styles.accountUpgrade} onClick={() => setIsProfileOpen(false)}>
                                    {(t as any).viewDetails || "詳細を見る"}
                                    <ChevronRight size={14} />
                                </Link>
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
                                <Link href="/app/shop" className={styles.creditItemBuy} onClick={() => setIsProfileOpen(false)}>
                                    <ShoppingBag size={18} />
                                    <span>{(t as any).upgradePlan || "アップグレード"}</span>
                                </Link>
                            </div>
                        </div>

                        {/* Settings link */}
                        <Link href="/app/settings" className={styles.profileSettingsLink} onClick={() => setIsProfileOpen(false)}>
                            <Settings size={18} />
                            <span>{(t as any).settings || "設定"}</span>
                            <ChevronRight size={16} className={styles.featureListChevron} />
                        </Link>
                    </div>
                </>
            )}




        </div>
    );
}
