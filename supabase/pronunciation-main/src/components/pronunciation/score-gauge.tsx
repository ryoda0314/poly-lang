'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
    score: number; // 0-100
    size?: number;
    animated?: boolean;
}

export function ScoreGauge({ score, size = 180, animated = true }: ScoreGaugeProps) {
    const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

    // Animate score count up
    useEffect(() => {
        if (!animated) {
            setDisplayScore(score);
            return;
        }

        const duration = 1500; // ms
        const startTime = Date.now();
        const startScore = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startScore + (score - startScore) * eased);

            setDisplayScore(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [score, animated]);

    // Calculate colors based on score
    const getScoreColor = (s: number) => {
        if (s >= 80) return { main: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' }; // green
        if (s >= 60) return { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' }; // yellow
        return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' }; // red
    };

    const colors = getScoreColor(score);

    // Circle calculations
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Background circle */}
            <svg
                width={size}
                height={size}
                className="rotate-[-90deg]"
                style={{ filter: `drop-shadow(0 0 20px ${colors.glow})` }}
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={strokeWidth}
                />

                {/* Progress */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.main}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{
                        duration: animated ? 1.5 : 0,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="font-display font-bold"
                    style={{
                        fontSize: size * 0.28,
                        color: colors.main,
                        lineHeight: 1,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    {displayScore}
                </motion.span>
                <motion.span
                    className="text-sm uppercase tracking-widest"
                    style={{ color: 'var(--foreground-muted)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Score
                </motion.span>
            </div>

            {/* Grade badge */}
            <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                    background: colors.main,
                    color: 'white',
                    boxShadow: `0 4px 15px ${colors.glow}`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                {score >= 90 ? 'Excellent' : score >= 80 ? 'Great' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Practice'}
            </motion.div>
        </div>
    );
}
