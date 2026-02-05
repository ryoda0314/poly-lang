"use client";

import { Flame, Target } from "lucide-react";
import styles from "./LevelCardD.module.css";

interface LevelCardDProps {
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

export default function LevelCardD({
    level,
    title,
    currentXp,
    nextLevelXp,
    progressPercent,
    totalWords,
    streak,
    labels = {}
}: LevelCardDProps) {
    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (progressPercent / 100) * circumference;

    return (
        <div className={styles.card}>
            <div className={styles.layout}>
                <div className={styles.ring}>
                    <svg viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r="38" fill="none" strokeWidth="6" className={styles.ringBg} />
                        <circle
                            cx="44" cy="44" r="38"
                            fill="none" strokeWidth="6"
                            className={styles.ringProgress}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 44 44)"
                        />
                    </svg>
                    <div className={styles.ringInner}>
                        <span className={styles.levelNum}>{level}</span>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.xp}>{Math.floor(currentXp)} / {nextLevelXp} XP</div>
                    <div className={styles.stats}>
                        <span><Flame size={14} /> {streak} {labels.streak || "日"}</span>
                        <span><Target size={14} /> {totalWords} {labels.words || "語"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
