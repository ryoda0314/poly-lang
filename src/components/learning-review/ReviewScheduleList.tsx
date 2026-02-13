'use client';

import React, { useMemo } from 'react';
import styles from './ReviewScheduleList.module.css';
import type { UnifiedReviewQueue } from '@/actions/learning-review';

interface ReviewScheduleListProps {
    reviewQueue: UnifiedReviewQueue;
    timeframe: 'today' | 'week';
}

export function ReviewScheduleList({ reviewQueue, timeframe }: ReviewScheduleListProps) {
    // Sort items by priority (overdue first, then by weakness)
    const sortedItems = useMemo(() => {
        const getDaysOverdue = (nextReviewAt: string | null): number => {
            if (!nextReviewAt) return 0;
            const now = new Date();
            const reviewDate = new Date(nextReviewAt);
            const diffMs = now.getTime() - reviewDate.getTime();
            return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        };

        const awarenessItems = reviewQueue.awareness.map(memo => ({
            type: 'awareness' as const,
            id: memo.id,
            text: memo.token_text || '',
            translation: memo.memo || '',
            nextReviewAt: memo.next_review_at,
            strength: memo.strength,
            daysOverdue: getDaysOverdue(memo.next_review_at),
            reviewCount: memo.usage_count
        }));

        const phraseItems = reviewQueue.phrases.map(phrase => ({
            type: 'phrase' as const,
            id: phrase.id,
            text: phrase.target_text,
            translation: phrase.translation,
            nextReviewAt: phrase.review?.next_review_at || null,
            strength: phrase.review?.strength || 0,
            daysOverdue: getDaysOverdue(phrase.review?.next_review_at || null),
            reviewCount: phrase.review?.review_count || 0
        }));

        const allItems = [...awarenessItems, ...phraseItems];

        // Sort by priority
        allItems.sort((a, b) => {
            // 1. Overdue items first
            if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
            // 2. Weakest first
            if (a.strength !== b.strength) return a.strength - b.strength;
            // 3. Least reviewed first
            return a.reviewCount - b.reviewCount;
        });

        return allItems;
    }, [reviewQueue]);

    // Group items by source
    const groupedItems = useMemo(() => {
        const awareness = sortedItems.filter(item => item.type === 'awareness');
        const phrases = sortedItems.filter(item => item.type === 'phrase');
        return { awareness, phrases };
    }, [sortedItems]);

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const isOverdue = (dateStr: string | null): boolean => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const renderItem = (item: typeof sortedItems[0]) => (
        <div key={`${item.type}-${item.id}`} className={styles.item}>
            <div className={styles.itemHeader}>
                <span className={styles.itemText}>{item.text}</span>
                <span className={`${styles.typeBadge} ${styles[item.type]}`}>
                    {item.type === 'awareness' ? 'Vocab' : 'Phrase'}
                </span>
            </div>

            {item.translation && (
                <span className={styles.itemTranslation}>{item.translation}</span>
            )}

            <div className={styles.itemFooter}>
                <div className={styles.strengthIndicator}>
                    <span className={styles.strengthLabel}>Strength:</span>
                    <div className={styles.strengthBar}>
                        <div
                            className={styles.strengthFill}
                            style={{
                                width: `${(item.strength / 5) * 100}%`,
                                background: item.strength < 2 ? '#ef4444' : item.strength < 3 ? '#f59e0b' : '#22c55e'
                            }}
                        />
                    </div>
                    <span className={styles.strengthValue}>{item.strength.toFixed(1)}</span>
                </div>

                <span className={`${styles.dueDate} ${isOverdue(item.nextReviewAt) ? styles.overdue : ''}`}>
                    {isOverdue(item.nextReviewAt) ? 'Overdue' : formatDate(item.nextReviewAt)}
                </span>
            </div>
        </div>
    );

    if (sortedItems.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>No items due for review {timeframe === 'today' ? 'today' : 'this week'}!</p>
                <span className={styles.emptyEmoji}>🎉</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>
                    {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} due {timeframe === 'today' ? 'today' : 'this week'}
                </span>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${styles.active}`}>
                    All ({sortedItems.length})
                </button>
                <button className={styles.tab}>
                    Vocab ({groupedItems.awareness.length})
                </button>
                <button className={styles.tab}>
                    Phrases ({groupedItems.phrases.length})
                </button>
            </div>

            <div className={styles.list}>
                {sortedItems.map(renderItem)}
            </div>
        </div>
    );
}
