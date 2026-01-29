"use client";

import React from 'react';
import styles from './StreakCard.module.css';
import { useAppStore } from '@/store/app-context';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const hasActivity = (day: number) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return loginDaySet.has(dateStr);
    };

    const isToday = (day: number) => {
        return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    };

    const monthLabel = nativeLanguage === 'ja'
        ? `${viewYear}年${viewMonth + 1}月`
        : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][viewMonth]} ${viewYear}`;

    return (
        <div className={clsx(styles.card, compact && styles.compact)}>
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
                            <span className={clsx(
                                styles.dayNum,
                                hasActivity(day) && styles.active,
                                isToday(day) && styles.today
                            )}>
                                {day}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
