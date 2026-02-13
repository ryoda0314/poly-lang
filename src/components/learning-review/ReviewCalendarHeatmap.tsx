'use client';

import React, { useMemo } from 'react';
import styles from './ReviewCalendarHeatmap.module.css';
import type { ReviewCalendar } from '@/actions/learning-review';

interface ReviewCalendarHeatmapProps {
    reviewDays: ReviewCalendar;
    onDateClick?: (date: string) => void;
    days?: number;
}

export function ReviewCalendarHeatmap({
    reviewDays,
    onDateClick,
    days = 30
}: ReviewCalendarHeatmapProps) {
    // Generate array of dates for the next N days
    const dateRange = useMemo(() => {
        const today = new Date();
        const dates = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push({
                date: dateStr,
                dayOfMonth: date.getDate(),
                dayOfWeek: date.getDay(),
                month: date.getMonth(),
                count: reviewDays[dateStr]?.total || 0,
                isToday: i === 0
            });
        }

        return dates;
    }, [reviewDays, days]);

    // Find max count for color scaling
    const maxCount = useMemo(() => {
        return Math.max(...Object.values(reviewDays).map(d => d.total), 1);
    }, [reviewDays]);

    // Get color intensity based on review count
    const getColorIntensity = (count: number): string => {
        if (count === 0) return styles.intensity0;
        const ratio = count / maxCount;
        if (ratio <= 0.25) return styles.intensity1;
        if (ratio <= 0.5) return styles.intensity2;
        if (ratio <= 0.75) return styles.intensity3;
        return styles.intensity4;
    };

    // Group dates by week
    const weeks = useMemo(() => {
        const result: typeof dateRange[] = [];
        let currentWeek: typeof dateRange = [];

        // Pad first week if needed
        const firstDayOfWeek = dateRange[0]?.dayOfWeek || 0;
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null as any);
        }

        dateRange.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        // Add remaining days
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null as any);
            }
            result.push(currentWeek);
        }

        return result;
    }, [dateRange]);

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>Upcoming Reviews (Next {days} Days)</span>
                <div className={styles.legend}>
                    <span className={styles.legendLabel}>Less</span>
                    <div className={styles.legendColors}>
                        <div className={`${styles.legendBox} ${styles.intensity0}`} />
                        <div className={`${styles.legendBox} ${styles.intensity1}`} />
                        <div className={`${styles.legendBox} ${styles.intensity2}`} />
                        <div className={`${styles.legendBox} ${styles.intensity3}`} />
                        <div className={`${styles.legendBox} ${styles.intensity4}`} />
                    </div>
                    <span className={styles.legendLabel}>More</span>
                </div>
            </div>

            <div className={styles.calendar}>
                {/* Day labels */}
                <div className={styles.dayLabels}>
                    {weekDays.map((day, i) => (
                        <span key={i} className={styles.dayLabel}>{day}</span>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className={styles.grid}>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className={styles.week}>
                            {week.map((day, dayIndex) => {
                                if (!day) {
                                    return <div key={dayIndex} className={styles.emptyDay} />;
                                }

                                return (
                                    <button
                                        key={dayIndex}
                                        className={`
                                            ${styles.day}
                                            ${getColorIntensity(day.count)}
                                            ${day.isToday ? styles.today : ''}
                                        `}
                                        onClick={() => onDateClick?.(day.date)}
                                        title={`${day.date}: ${day.count} items`}
                                    >
                                        <span className={styles.dayNumber}>{day.dayOfMonth}</span>
                                        {day.count > 0 && (
                                            <span className={styles.dayCount}>{day.count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary stats */}
            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total Reviews</span>
                    <span className={styles.summaryValue}>
                        {Object.values(reviewDays).reduce((sum, d) => sum + d.total, 0)}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Busiest Day</span>
                    <span className={styles.summaryValue}>
                        {maxCount} items
                    </span>
                </div>
            </div>
        </div>
    );
}
