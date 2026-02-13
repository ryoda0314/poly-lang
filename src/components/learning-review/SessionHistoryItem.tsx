'use client';

import React from 'react';
import styles from './SessionHistoryItem.module.css';
import type { StudySession } from '@/actions/learning-stats';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface SessionHistoryItemProps {
    session: StudySession;
}

export function SessionHistoryItem({ session }: SessionHistoryItemProps) {
    const formatDuration = (seconds: number | null): string => {
        if (!seconds) return '0m';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes === 0) return `${secs}s`;
        if (secs === 0) return `${minutes}m`;
        return `${minutes}m ${secs}s`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    const accuracy = session.accuracy_percentage || 0;
    const accuracyColor = accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <div className={styles.card}>
            {/* Date/Time Header */}
            <div className={styles.header}>
                <div className={styles.dateSection}>
                    <span className={styles.date}>{formatDate(session.started_at)}</span>
                    <span className={styles.time}>{formatTime(session.started_at)}</span>
                </div>
                <span className={styles.languageBadge}>{session.language_code}</span>
            </div>

            {/* Stats Grid */}
            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <Clock size={16} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{formatDuration(session.duration_seconds)}</span>
                        <span className={styles.statLabel}>Duration</span>
                    </div>
                </div>

                <div className={styles.statItem}>
                    <CheckCircle size={16} className={styles.statIcon} style={{ color: accuracyColor }} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue} style={{ color: accuracyColor }}>
                            {accuracy}%
                        </span>
                        <span className={styles.statLabel}>Accuracy</span>
                    </div>
                </div>

                <div className={styles.statItem}>
                    <TrendingUp size={16} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{session.items_reviewed || 0}</span>
                        <span className={styles.statLabel}>Reviewed</span>
                    </div>
                </div>
            </div>

            {/* Details Bar */}
            <div className={styles.details}>
                <div className={styles.detailItem}>
                    <span className={styles.detailValue} style={{ color: '#22c55e' }}>
                        {session.items_correct || 0}
                    </span>
                    <span className={styles.detailLabel}>correct</span>
                </div>
                <span className={styles.detailSeparator}>•</span>
                <div className={styles.detailItem}>
                    <span className={styles.detailValue} style={{ color: '#ef4444' }}>
                        {session.items_incorrect || 0}
                    </span>
                    <span className={styles.detailLabel}>incorrect</span>
                </div>
                {session.items_mastered > 0 && (
                    <>
                        <span className={styles.detailSeparator}>•</span>
                        <div className={styles.detailItem}>
                            <span className={styles.detailValue} style={{ color: '#6366f1' }}>
                                +{session.items_mastered}
                            </span>
                            <span className={styles.detailLabel}>mastered</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
