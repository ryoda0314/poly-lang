"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle } from "lucide-react";
import type { LongText, UserLongTextProgress } from "@/types/long-text";
import styles from "./TextCard.module.css";

interface TextCardProps {
    text: LongText;
    progress?: UserLongTextProgress;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: "#22c55e",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
};

const DIFFICULTY_LABELS: Record<string, string> = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級",
};

export default function TextCard({ text, progress }: TextCardProps) {
    const progressPercent = progress && text.sentence_count > 0
        ? Math.round((progress.completed_sentences.length / text.sentence_count) * 100)
        : 0;

    const isCompleted = progress?.completed_at != null;
    const isStarted = progress != null && !isCompleted;

    return (
        <Link href={`/app/long-text/${text.id}`} className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                    {isCompleted ? (
                        <CheckCircle size={24} className={styles.completedIcon} />
                    ) : (
                        <BookOpen size={24} />
                    )}
                </div>
                {text.difficulty_level && (
                    <span
                        className={styles.difficultyBadge}
                        style={{ background: DIFFICULTY_COLORS[text.difficulty_level] }}
                    >
                        {DIFFICULTY_LABELS[text.difficulty_level] || text.difficulty_level}
                    </span>
                )}
            </div>

            <h3 className={styles.title}>{text.title}</h3>
            {text.title_translation && (
                <p className={styles.translation}>{text.title_translation}</p>
            )}

            <div className={styles.meta}>
                <span className={styles.sentenceCount}>
                    {text.sentence_count}文
                </span>
                {text.category && (
                    <span className={styles.category}>{text.category}</span>
                )}
            </div>

            {(isStarted || isCompleted) && (
                <div className={styles.progressWrapper}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${isCompleted ? 100 : progressPercent}%`,
                                background: isCompleted ? "#22c55e" : "var(--color-primary)",
                            }}
                        />
                    </div>
                    <span className={styles.progressText}>
                        {isCompleted ? "完了" : `${progressPercent}%`}
                    </span>
                </div>
            )}
        </Link>
    );
}
