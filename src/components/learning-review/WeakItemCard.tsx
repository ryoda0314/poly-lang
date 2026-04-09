'use client';

import React from 'react';
import styles from './WeakItemCard.module.css';
import type { Database } from '@/types/supabase';
import type { PhraseSetItemWithReview } from '@/actions/learning-review';

type AwarenessMemo = Database['public']['Tables']['awareness_memos']['Row'];

export type WeakItem =
    | { type: 'awareness'; memo: AwarenessMemo }
    | { type: 'phrase'; item: PhraseSetItemWithReview };

interface WeakItemCardProps {
    item: WeakItem;
    onReview?: () => void;
}

export function WeakItemCard({ item, onReview }: WeakItemCardProps) {
    const getWeaknessReason = (): string => {
        if (item.type === 'awareness') {
            const { memo } = item;
            if (memo.status === 'unverified') return 'Unverified';
            if (memo.strength < 2) return 'Very Weak';
            if (memo.usage_count > 5 && memo.strength < 3) return 'Needs Practice';
            return 'Low Confidence';
        } else {
            const { review } = item.item;
            if (!review) return 'New';
            if (review.incorrect_count > review.correct_count) return 'Low Accuracy';
            if (review.strength < 2 && review.review_count > 3) return 'Struggling';
            if (review.status === 'learning' && review.review_count > 5) return 'Stuck in Learning';
            return 'Needs Review';
        }
    };

    const getWeaknessColor = (): string => {
        const reason = getWeaknessReason();
        if (reason === 'Unverified' || reason === 'New') return '#94a3b8'; // gray
        if (reason === 'Very Weak' || reason === 'Low Accuracy') return '#ef4444'; // red
        if (reason === 'Struggling' || reason === 'Stuck in Learning') return '#f59e0b'; // orange
        return '#f97316'; // amber
    };

    const getStrength = (): number => {
        if (item.type === 'awareness') {
            return item.memo.strength;
        } else {
            return item.item.review?.strength || 0;
        }
    };

    const getAccuracy = (): number | null => {
        if (item.type === 'phrase') {
            const { review } = item.item;
            if (!review || review.review_count === 0) return null;
            return Math.round((review.correct_count / review.review_count) * 100);
        }
        return null;
    };

    const getText = (): string => {
        return item.type === 'awareness'
            ? item.memo.token_text || ''
            : item.item.target_text;
    };

    const getTranslation = (): string => {
        return item.type === 'awareness'
            ? item.memo.memo || ''
            : item.item.translation;
    };

    const strength = getStrength();
    const accuracy = getAccuracy();
    const weaknessReason = getWeaknessReason();
    const weaknessColor = getWeaknessColor();

    return (
        <div className={styles.card} onClick={onReview}>
            {/* Status indicator line */}
            <div className={styles.statusLine} style={{ background: weaknessColor }} />

            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h4 className={styles.title}>{getText()}</h4>
                        <div className={styles.badges}>
                            <span
                                className={styles.badge}
                                style={{
                                    background: `color-mix(in srgb, ${weaknessColor} 15%, transparent)`,
                                    color: weaknessColor
                                }}
                            >
                                {weaknessReason}
                            </span>
                            <span className={styles.typeBadge}>
                                {item.type === 'awareness' ? 'Vocab' : 'Phrase'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Translation/Memo */}
                {getTranslation() && (
                    <p className={styles.translation}>{getTranslation()}</p>
                )}

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Strength</span>
                        <div className={styles.strengthBar}>
                            <div
                                className={styles.strengthFill}
                                style={{
                                    width: `${(strength / 5) * 100}%`,
                                    background: strength < 2 ? '#ef4444' : strength < 3 ? '#f59e0b' : '#22c55e'
                                }}
                            />
                        </div>
                        <span className={styles.statValue}>{strength.toFixed(1)}/5</span>
                    </div>

                    {accuracy !== null && (
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Accuracy</span>
                            <span
                                className={styles.statValue}
                                style={{
                                    color: accuracy < 50 ? '#ef4444' : accuracy < 75 ? '#f59e0b' : '#22c55e'
                                }}
                            >
                                {accuracy}%
                            </span>
                        </div>
                    )}

                    {item.type === 'phrase' && item.item.review && (
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Reviews</span>
                            <span className={styles.statValue}>
                                {item.item.review.review_count}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action button */}
                {onReview && (
                    <button className={styles.reviewButton} onClick={(e) => { e.stopPropagation(); onReview(); }}>
                        Review Now
                    </button>
                )}
            </div>
        </div>
    );
}
