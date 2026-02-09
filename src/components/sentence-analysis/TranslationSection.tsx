"use client";

import styles from "./TranslationSection.module.css";

interface Props {
    translation: string;
    structuralTranslation: string;
    structureExplanation: string;
    difficulty: "beginner" | "intermediate" | "advanced";
}

const DIFFICULTY_LABELS: Record<string, string> = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級",
};

export default function TranslationSection({ translation, structuralTranslation, structureExplanation, difficulty }: Props) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <span className={styles.label}>和訳・構造解説</span>
                <span className={`${styles.difficultyBadge} ${styles[difficulty]}`}>
                    {DIFFICULTY_LABELS[difficulty]}
                </span>
            </div>

            <div className={styles.card}>
                <div className={styles.section}>
                    <div className={styles.sectionLabel}>自然な和訳</div>
                    <p className={styles.translationText}>{translation}</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.section}>
                    <div className={styles.sectionLabel}>構造的和訳</div>
                    <p className={styles.structuralText}>{structuralTranslation}</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.section}>
                    <div className={styles.sectionLabel}>構造解説</div>
                    <p className={styles.explanationText}>{structureExplanation}</p>
                </div>
            </div>
        </div>
    );
}
