"use client";

import { Flame, Star } from "lucide-react";
import styles from "./LevelCardC.module.css";

interface LevelCardCProps {
    level: number;
    title: string;
    currentXp: number;
    nextLevelXp: number;
    progressPercent: number;
    totalWords: number;
    streak: number;
    labels?: {
        level?: string;
        words?: string;
        streak?: string;
    };
}

export default function LevelCardC({
    level,
    title,
    currentXp,
    nextLevelXp,
    progressPercent,
    totalWords,
    streak,
    labels = {}
}: LevelCardCProps) {
    return (
        <div className={styles.card}>
            <div className={styles.left}>
                <span className={styles.levelNum}>{level}</span>
                <span className={styles.levelLabel}>LEVEL</span>
            </div>
            <div className={styles.right}>
                <div className={styles.title}>{title}</div>
                <div className={styles.xpRow}>
                    <span className={styles.xpCurrent}>{Math.floor(currentXp)}</span>
                    <span className={styles.xpTotal}>/ {nextLevelXp} XP</span>
                </div>
                <div className={styles.bar}>
                    <div className={styles.progress} style={{ width: `${progressPercent}%` }} />
                </div>
                <div className={styles.stats}>
                    <span><Flame size={12} /> {streak}{labels.streak || "日"}</span>
                    <span><Star size={12} /> {totalWords}{labels.words || "語"}</span>
                </div>
            </div>
        </div>
    );
}
