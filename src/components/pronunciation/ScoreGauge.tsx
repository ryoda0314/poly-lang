"use client";

import { motion } from "framer-motion";

export function ScoreGauge({ score }: { score: number }) {
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    let color = "var(--color-fg-muted)";
    if (score >= 90) color = "var(--color-success, #10b981)";
    else if (score >= 70) color = "var(--color-accent, #FF4F00)"; // Assuming orange for medium
    else if (score >= 50) color = "#f59e0b";
    else color = "#ef4444";

    return (
        <div style={{ position: 'relative', width: radius * 3, height: radius * 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg
                height={radius * 2}
                width={radius * 2}
                style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
            >
                {/* Background Ring */}
                <circle
                    stroke="var(--color-bg-panel, #eee)"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {/* Progress Ring */}
                <motion.circle
                    stroke={color}
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    strokeLinecap="round"
                    style={{ strokeDasharray: circumference + ' ' + circumference }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-fg)' }}
                >
                    {score}
                </motion.span>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-fg-muted)' }}>Score</div>
            </div>
        </div>
    );
}
