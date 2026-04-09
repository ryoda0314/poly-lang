"use client";

import React from 'react';
import styles from './StreakCard.module.css';
import { useAppStore } from '@/store/app-context';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import DailyActivityPanel from './DailyActivityPanel';

interface StreakCardProps {
    streak: {
        current: number;
        longest: number;
        lastActiveDate: string | null;
    };
    loginDays: string[]; // "YYYY-MM-DD" array
    compact?: boolean;
}

export default function StreakCard({ streak, loginDays, compact }: StreakCardProps) {
    const { nativeLanguage } = useAppStore();
    const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const weekDays = nativeLanguage === 'ja'
        ? ['日', '月', '火', '水', '木', '金', '土']
        : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const today = new Date();
    const [viewMonth, setViewMonth] = React.useState(today.getMonth());
    const [viewYear, setViewYear] = React.useState(today.getFullYear());

    // Build login day set for O(1) lookup
    const loginDaySet = new Set<string>(loginDays);

    // Calendar calculations
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const goToPrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const getDateStr = (day: number) => {
        return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const hasActivity = (day: number) => {
        return loginDaySet.has(getDateStr(day));
    };

    const isToday = (day: number) => {
        return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    };

    const isSelected = (day: number) => {
        return selectedDate === getDateStr(day);
    };

    // Calculate this week's activity (Sunday to Saturday)
    const getThisWeekActivity = () => {
        const todayDate = new Date();
        const dayOfWeek = todayDate.getDay(); // 0 = Sunday
        const weekStart = new Date(todayDate);
        weekStart.setDate(todayDate.getDate() - dayOfWeek);

        const weekActivity: boolean[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            weekActivity.push(loginDaySet.has(dateStr));
        }
        return weekActivity;
    };

    const thisWeekActivity = getThisWeekActivity();
    const thisWeekCount = thisWeekActivity.filter(Boolean).length;

    const handleDayClick = (e: React.MouseEvent, day: number) => {
        e.stopPropagation();
        const dateStr = getDateStr(day);
        setSelectedDate(dateStr);
    };

    const handleCardClick = () => {
        if (compact && !isExpanded) {
            setIsExpanded(true);
        }
    };

    const handleCloseExpanded = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(false);
    };

    const monthLabel = nativeLanguage === 'ja'
        ? `${viewYear}年${viewMonth + 1}月`
        : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][viewMonth]} ${viewYear}`;

    return (
        <>
            {/* Expanded overlay for mobile */}
            {compact && isExpanded && (
                <div className={styles.expandedOverlay} onClick={() => setIsExpanded(false)}>
                    <div className={styles.expandedCard} onClick={e => e.stopPropagation()}>
                        {/* Month Navigation */}
                        <div className={styles.monthNav}>
                            <button className={styles.navBtn} onClick={goToPrevMonth}>
                                <ChevronLeft size={20} />
                            </button>
                            <span className={styles.monthLabel}>{monthLabel}</span>
                            <button className={styles.navBtn} onClick={goToNextMonth}>
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Day Labels */}
                        <div className={styles.dayLabels}>
                            {weekDays.map((d, i) => (
                                <span key={i} className={styles.dayLabel}>{d}</span>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className={styles.grid}>
                            {calendarDays.map((day, i) => (
                                <div key={i} className={styles.cellWrapper}>
                                    {day !== null && (
                                        <button
                                            className={clsx(
                                                styles.dayNum,
                                                styles.clickable,
                                                hasActivity(day) && styles.active,
                                                isToday(day) && styles.today,
                                                isSelected(day) && styles.selected
                                            )}
                                            onClick={(e) => handleDayClick(e, day)}
                                        >
                                            {day}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Compact view - Weekly progress bar */}
            {compact ? (
                <div
                    className={styles.compactCard}
                    onClick={handleCardClick}
                >
                    <div className={styles.compactTop}>
                        <div className={styles.streakInfo}>
                            <span className={styles.streakNumber}>{streak.current}</span>
                            <span className={styles.streakLabel}>
                                {nativeLanguage === 'ja' ? '日連続' : 'days'}
                            </span>
                        </div>
                        <div className={styles.weekLabels}>
                            {weekDays.map((d, i) => (
                                <span key={i} className={styles.weekLabelItem}>{d}</span>
                            ))}
                        </div>
                        <span className={styles.weekCount}>{thisWeekCount}/7</span>
                    </div>
                    <div className={styles.weeklyProgress}>
                        {thisWeekActivity.map((active, i) => (
                            <div key={i} className={clsx(styles.dot, active && styles.dotActive)} />
                        ))}
                    </div>
                </div>
            ) : (
                /* Full calendar view */
                <div
                    className={styles.card}
                    onClick={handleCardClick}
                >
                    {/* Month Navigation */}
                    <div className={styles.monthNav}>
                        <button className={styles.navBtn} onClick={goToPrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <span className={styles.monthLabel}>{monthLabel}</span>
                        <button className={styles.navBtn} onClick={goToNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Day Labels */}
                    <div className={styles.dayLabels}>
                        {weekDays.map((d, i) => (
                            <span key={i} className={styles.dayLabel}>{d}</span>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className={styles.grid}>
                        {calendarDays.map((day, i) => (
                            <div key={i} className={styles.cellWrapper}>
                                {day !== null && (
                                    <button
                                        className={clsx(
                                            styles.dayNum,
                                            styles.clickable,
                                            hasActivity(day) && styles.active,
                                            isToday(day) && styles.today,
                                            isSelected(day) && styles.selected
                                        )}
                                        onClick={(e) => handleDayClick(e, day)}
                                    >
                                        {day}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Panel Modal */}
            {selectedDate && (
                <DailyActivityPanel
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </>
    );
}
