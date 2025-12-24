"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import Link from "next/link";
import { ArrowRight, BookOpen, Map } from "lucide-react";
import { createClient } from "@/lib/supa-client";
import styles from "./page.module.css";

interface DashboardStats {
    avgAccuracy: number | null;
    dayStreak: number;
    totalRuns: number;
    vocabulary: number;
}

function calculateDayStreak(visitDates: string[]): number {
    if (visitDates.length === 0) return 1; // First day = 1

    // Get unique dates (in YYYY-MM-DD format) sorted descending
    const uniqueDates = [...new Set(visitDates)].sort().reverse();

    const today = new Date().toISOString().split('T')[0];

    // If today is already in the list, count consecutive days
    // If not, we'll add it below
    let streak = 1;

    // Check if today is the most recent or if yesterday is
    const mostRecent = uniqueDates[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If no visit today yet, start from today (streak = 1)
    if (mostRecent !== today) {
        // If last visit was yesterday, we continue the streak
        if (mostRecent === yesterday) {
            streak = 1;
            for (let i = 0; i < uniqueDates.length; i++) {
                const expectedDate = new Date(Date.now() - (i + 1) * 86400000).toISOString().split('T')[0];
                if (uniqueDates[i] === expectedDate) {
                    streak++;
                } else {
                    break;
                }
            }
        }
        // Otherwise streak resets to 1
        return streak;
    }

    // Today is in the list, count consecutive days backwards
    for (let i = 1; i < uniqueDates.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        if (uniqueDates[i] === expectedDate) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

export default function DashboardPage() {
    const { activeLanguage, profile, user, refreshProfile } = useAppStore();
    const [stats, setStats] = useState<DashboardStats>({
        avgAccuracy: null,
        dayStreak: 1, // Start at 1
        totalRuns: 0,
        vocabulary: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function recordVisitAndFetchStats() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            const supabase = createClient();
            const today = new Date().toISOString().split('T')[0];

            try {
                // Get current profile settings
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('settings')
                    .eq('id', user.id)
                    .single();

                const currentSettings = (profileData?.settings as Record<string, unknown>) || {};
                const visitDates: string[] = (currentSettings.visitDates as string[]) || [];

                // Add today if not already recorded
                if (!visitDates.includes(today)) {
                    visitDates.push(today);

                    // Update profile with new visit date
                    await supabase
                        .from('profiles')
                        .update({
                            settings: {
                                ...currentSettings,
                                visitDates: visitDates.slice(-30) // Keep last 30 days only
                            }
                        })
                        .eq('id', user.id);
                }

                // Calculate day streak from visit dates
                const dayStreak = calculateDayStreak(visitDates);
                setStats(prev => ({ ...prev, dayStreak }));

                // Fetch pronunciation runs for accuracy
                const { data: runs, error: runsError } = await supabase
                    .from('pronunciation_runs')
                    .select('score, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!runsError && runs && runs.length > 0) {
                    const avgScore = runs.reduce((sum, run) => sum + run.score, 0) / runs.length;
                    setStats(prev => ({
                        ...prev,
                        avgAccuracy: Math.round(avgScore),
                        totalRuns: runs.length
                    }));
                }

                // Fetch awareness memos count
                const { count: memoCount, error: memoError } = await supabase
                    .from('awareness_memos')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!memoError && memoCount !== null) {
                    setStats(prev => ({ ...prev, vocabulary: memoCount }));
                }
            } catch (error) {
                console.error('Error in dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        }

        recordVisitAndFetchStats();
    }, [user?.id]);

    if (!activeLanguage) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Welcome back, {profile?.username || user?.email?.split("@")[0] || "Learner"}.</h1>
                <p className={styles.subtitle}>
                    <span className={styles.langName}>{activeLanguage.name}</span> is waiting for you.
                </p>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {isLoading ? "..." : stats.vocabulary.toLocaleString()}
                    </div>
                    <div className={styles.statLabel}>Words Learned</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {isLoading ? "..." : stats.dayStreak}
                    </div>
                    <div className={styles.statLabel}>Day Streak</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {isLoading ? "..." : (stats.avgAccuracy !== null ? `${stats.avgAccuracy}%` : "—")}
                    </div>
                    <div className={styles.statLabel}>Avg. Accuracy</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {isLoading ? "..." : stats.totalRuns}
                    </div>
                    <div className={styles.statLabel}>Practice Sessions</div>
                </div>
            </div>

            <h2 className={styles.sectionTitle}>Keep Going</h2>
            <div className={styles.actionsGrid}>
                <Link href="/app/phrases" className={styles.actionCard}>
                    <div className={styles.actionIcon}><Map size={24} /></div>
                    <div className={styles.actionContent}>
                        <h3>Explore phrases</h3>
                        <p>Little things you can start saying.</p>
                    </div>
                    <ArrowRight className={styles.arrow} size={20} />
                </Link>

                <Link href="/app/corrections" className={styles.actionCard}>
                    <div className={styles.actionIcon}><BookOpen size={24} /></div>
                    <div className={styles.actionContent}>
                        <h3>Say it your way</h3>
                        <p>We'll help you say it more naturally.</p>
                    </div>
                    <ArrowRight className={styles.arrow} size={20} />
                </Link>
            </div>
        </div>
    );
}
