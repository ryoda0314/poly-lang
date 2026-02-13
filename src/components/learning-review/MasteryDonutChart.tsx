'use client';

import React, { useMemo } from 'react';
import styles from './MasteryDonutChart.module.css';

interface MasteryDonutChartProps {
    data: {
        weak: number;
        learning: number;
        strong: number;
        mastered: number;
    };
}

export function MasteryDonutChart({ data }: MasteryDonutChartProps) {
    const { weak, learning, strong, mastered } = data;
    const total = weak + learning + strong + mastered;

    // Calculate percentages and angles
    const segments = useMemo(() => {
        if (total === 0) return [];

        const colors = {
            weak: '#ef4444',      // red
            learning: '#f59e0b',  // orange
            strong: '#3b82f6',    // blue
            mastered: '#22c55e'   // green
        };

        let currentAngle = 0;
        const result = [];

        const items = [
            { label: 'Weak', value: weak, color: colors.weak },
            { label: 'Learning', value: learning, color: colors.learning },
            { label: 'Strong', value: strong, color: colors.strong },
            { label: 'Mastered', value: mastered, color: colors.mastered }
        ];

        for (const item of items) {
            if (item.value === 0) continue;

            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;

            result.push({
                ...item,
                percentage,
                startAngle: currentAngle,
                endAngle: currentAngle + angle
            });

            currentAngle += angle;
        }

        return result;
    }, [weak, learning, strong, mastered, total]);

    // Calculate SVG path for donut segment
    const getArcPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
        const start = polarToCartesian(100, 100, outerRadius, endAngle);
        const end = polarToCartesian(100, 100, outerRadius, startAngle);
        const innerStart = polarToCartesian(100, 100, innerRadius, endAngle);
        const innerEnd = polarToCartesian(100, 100, innerRadius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return [
            'M', start.x, start.y,
            'A', outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
            'L', innerEnd.x, innerEnd.y,
            'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
            'Z'
        ].join(' ');
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    if (total === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyCircle}>
                        <div className={styles.emptyCenter}>
                            <span className={styles.emptyText}>No Data</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <svg viewBox="0 0 200 200" className={styles.chart}>
                {segments.map((segment, index) => (
                    <path
                        key={index}
                        d={getArcPath(segment.startAngle, segment.endAngle, 90, 60)}
                        fill={segment.color}
                        className={styles.segment}
                    />
                ))}

                {/* Center circle */}
                <circle cx="100" cy="100" r="55" fill="var(--color-surface)" />

                {/* Center text */}
                <text x="100" y="90" textAnchor="middle" className={styles.totalLabel}>
                    Total
                </text>
                <text x="100" y="110" textAnchor="middle" className={styles.totalValue}>
                    {total}
                </text>
                <text x="100" y="125" textAnchor="middle" className={styles.totalSubtext}>
                    items
                </text>
            </svg>

            {/* Legend */}
            <div className={styles.legend}>
                {segments.map((segment, index) => (
                    <div key={index} className={styles.legendItem}>
                        <span
                            className={styles.legendColor}
                            style={{ backgroundColor: segment.color }}
                        />
                        <span className={styles.legendLabel}>{segment.label}</span>
                        <span className={styles.legendValue}>
                            {segment.value} ({Math.round(segment.percentage)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
