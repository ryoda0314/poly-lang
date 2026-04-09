'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-context';
import {
    getUnifiedReviewQueue,
    getMasteryDistribution,
    getWeakItems,
    getSessionHistory,
    getReviewCalendar
} from '@/actions/learning-review';
import { MasteryDonutChart } from '@/components/learning-review/MasteryDonutChart';
import { ReviewCalendarHeatmap } from '@/components/learning-review/ReviewCalendarHeatmap';
import { WeakItemCard, type WeakItem } from '@/components/learning-review/WeakItemCard';
import { SessionHistoryChart } from '@/components/learning-review/SessionHistoryChart';
import { SessionHistoryItem } from '@/components/learning-review/SessionHistoryItem';
import { ReviewScheduleList } from '@/components/learning-review/ReviewScheduleList';
import styles from './page.module.css';
import type {
    UnifiedReviewQueue,
    MasteryDistribution,
    WeakItemsResult,
    SessionHistoryResult,
    ReviewCalendar
} from '@/actions/learning-review';

export default function LearningReviewPage() {
    const { user, activeLanguageCode } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'today' | 'week' | 'all'>('week');

    // Data state
    const [reviewQueue, setReviewQueue] = useState<UnifiedReviewQueue | null>(null);
    const [mastery, setMastery] = useState<MasteryDistribution | null>(null);
    const [weakItems, setWeakItems] = useState<WeakItemsResult | null>(null);
    const [sessionHistory, setSessionHistory] = useState<SessionHistoryResult | null>(null);
    const [calendar, setCalendar] = useState<ReviewCalendar | null>(null);

    useEffect(() => {
        if (!user || !activeLanguageCode) return;

        async function fetchData() {
            setLoading(true);

            try {
                const [queueData, masteryData, weakData, historyData, calendarData] = await Promise.all([
                    getUnifiedReviewQueue(timeframe, activeLanguageCode),
                    getMasteryDistribution(activeLanguageCode),
                    getWeakItems(activeLanguageCode, 20),
                    getSessionHistory(activeLanguageCode, 10),
                    getReviewCalendar(activeLanguageCode, 30)
                ]);

                setReviewQueue(queueData);
                setMastery(masteryData);
                setWeakItems(weakData);
                setSessionHistory(historyData);
                setCalendar(calendarData);
            } catch (error) {
                console.error('Error fetching learning review data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, activeLanguageCode, timeframe]);

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <p>Please log in to view your learning review</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <p>Loading your learning data...</p>
                </div>
            </div>
        );
    }

    // Combine weak items into unified format
    const allWeakItems: WeakItem[] = [
        ...(weakItems?.awarenessWeak.map(memo => ({ type: 'awareness' as const, memo })) || []),
        ...(weakItems?.phraseWeak.map(item => ({ type: 'phrase' as const, item })) || [])
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Learning Review</h1>
                <div className={styles.timeframeTabs}>
                    <button
                        className={`${styles.timeframeTab} ${timeframe === 'today' ? styles.active : ''}`}
                        onClick={() => setTimeframe('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`${styles.timeframeTab} ${timeframe === 'week' ? styles.active : ''}`}
                        onClick={() => setTimeframe('week')}
                    >
                        This Week
                    </button>
                    <button
                        className={`${styles.timeframeTab} ${timeframe === 'all' ? styles.active : ''}`}
                        onClick={() => setTimeframe('all')}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Mastery Overview Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Mastery Overview</h2>
                <div className={styles.masteryGrid}>
                    {mastery && (
                        <>
                            <div className={styles.masteryChart}>
                                <MasteryDonutChart data={mastery.combined} />
                            </div>
                            <div className={styles.masteryStats}>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Total Items</span>
                                    <span className={styles.statValue}>
                                        {mastery.combined.weak + mastery.combined.learning + mastery.combined.strong + mastery.combined.mastered}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Mastery Rate</span>
                                    <span className={styles.statValue}>
                                        {Math.round((mastery.combined.mastered / Math.max(mastery.combined.weak + mastery.combined.learning + mastery.combined.strong + mastery.combined.mastered, 1)) * 100)}%
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Vocab Items</span>
                                    <span className={styles.statValue}>
                                        {mastery.awareness.unverified + mastery.awareness.learning + mastery.awareness.mastered}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Phrase Items</span>
                                    <span className={styles.statValue}>
                                        {mastery.phrases.new + mastery.phrases.learning + mastery.phrases.reviewing + mastery.phrases.mastered}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Review Schedule Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Review Schedule</h2>
                {calendar && <ReviewCalendarHeatmap reviewDays={calendar} days={30} />}
                {reviewQueue && <ReviewScheduleList reviewQueue={reviewQueue} timeframe={timeframe} />}
            </section>

            {/* Weak Points Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Weak Points</h2>
                {allWeakItems.length > 0 ? (
                    <div className={styles.weakItemsGrid}>
                        {allWeakItems.map((item, index) => (
                            <WeakItemCard
                                key={`${item.type}-${index}`}
                                item={item}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyCard}>
                        <p>No weak items identified. Great job!</p>
                    </div>
                )}
            </section>

            {/* Session History Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Session History</h2>
                {sessionHistory && sessionHistory.sessions.length > 0 ? (
                    <>
                        <SessionHistoryChart sessions={sessionHistory.sessions} metric="accuracy" />
                        <div className={styles.sessionList}>
                            {sessionHistory.sessions.map((session, index) => (
                                <SessionHistoryItem key={index} session={session} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyCard}>
                        <p>No study sessions recorded yet. Start studying to see your progress!</p>
                    </div>
                )}
            </section>
        </div>
    );
}
