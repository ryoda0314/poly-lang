'use client';

import React, { useMemo } from 'react';
import styles from './SessionHistoryChart.module.css';
import type { StudySession } from '@/actions/learning-stats';

interface SessionHistoryChartProps {
    sessions: StudySession[];
    metric?: 'accuracy' | 'itemsReviewed' | 'studyTime';
}

export function SessionHistoryChart({ sessions, metric = 'accuracy' }: SessionHistoryChartProps) {
    const chartData = useMemo(() => {
        if (!sessions || sessions.length === 0) return [];

        return sessions.slice().reverse().map((session, index) => {
            let value: number;
            switch (metric) {
                case 'accuracy':
                    value = session.accuracy_percentage || 0;
                    break;
                case 'itemsReviewed':
                    value = session.items_reviewed || 0;
                    break;
                case 'studyTime':
                    value = Math.round((session.duration_seconds || 0) / 60); // minutes
                    break;
                default:
                    value = 0;
            }

            return {
                index,
                value,
                date: new Date(session.started_at).toLocaleDateString(),
                session
            };
        });
    }, [sessions, metric]);

    const maxValue = useMemo(() => {
        if (chartData.length === 0) return 100;
        const max = Math.max(...chartData.map(d => d.value));
        return metric === 'accuracy' ? 100 : Math.ceil(max * 1.2);
    }, [chartData, metric]);

    const avgValue = useMemo(() => {
        if (chartData.length === 0) return 0;
        const sum = chartData.reduce((acc, d) => acc + d.value, 0);
        return Math.round(sum / chartData.length);
    }, [chartData]);

    const getMetricLabel = () => {
        switch (metric) {
            case 'accuracy': return 'Accuracy';
            case 'itemsReviewed': return 'Items Reviewed';
            case 'studyTime': return 'Study Time (min)';
            default: return '';
        }
    };

    const getMetricUnit = () => {
        switch (metric) {
            case 'accuracy': return '%';
            case 'itemsReviewed': return '';
            case 'studyTime': return 'min';
            default: return '';
        }
    };

    if (chartData.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>No session history available</p>
            </div>
        );
    }

    // SVG dimensions
    const width = 100;
    const height = 60;
    const padding = { top: 5, right: 5, bottom: 5, left: 5 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate points for the line
    const points = chartData.map((d, i) => {
        const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
        const y = padding.top + ((maxValue - d.value) / maxValue) * chartHeight;
        return { x, y, ...d };
    });

    const pathD = points.map((p, i) => {
        const command = i === 0 ? 'M' : 'L';
        return `${command} ${p.x} ${p.y}`;
    }).join(' ');

    // Area path (for fill under the line)
    const areaD = points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
        : '';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>{getMetricLabel()} Trend</span>
                <span className={styles.average}>Avg: {avgValue}{getMetricUnit()}</span>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart}>
                {/* Grid lines */}
                <line
                    x1={padding.left}
                    y1={padding.top + chartHeight / 2}
                    x2={padding.left + chartWidth}
                    y2={padding.top + chartHeight / 2}
                    stroke="var(--color-border, #e5e7eb)"
                    strokeWidth="0.2"
                    strokeDasharray="1,1"
                />

                {/* Area fill */}
                <path
                    d={areaD}
                    fill="url(#gradient)"
                    opacity="0.2"
                />

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="var(--color-primary, #6366f1)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="1.5"
                        fill="var(--color-primary, #6366f1)"
                        className={styles.point}
                    >
                        <title>{p.date}: {p.value}{getMetricUnit()}</title>
                    </circle>
                ))}

                {/* Gradient definition */}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            <div className={styles.footer}>
                <span className={styles.footerLabel}>Last {chartData.length} sessions</span>
            </div>
        </div>
    );
}
