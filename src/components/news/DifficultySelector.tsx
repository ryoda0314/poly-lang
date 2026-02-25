"use client";

import type { NewsDifficulty } from "@/types/news";
import styles from "./DifficultySelector.module.css";

interface Props {
    value: NewsDifficulty;
    onChange: (d: NewsDifficulty) => void;
    nativeLanguage: string;
}

const LABELS: Record<string, Record<NewsDifficulty, string>> = {
    ja: { beginner: '初級', intermediate: '中級', advanced: '上級' },
    en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    ko: { beginner: '초급', intermediate: '중급', advanced: '고급' },
    zh: { beginner: '初级', intermediate: '中级', advanced: '高级' },
    fr: { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' },
    es: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
    de: { beginner: 'Anfänger', intermediate: 'Mittelstufe', advanced: 'Fortgeschritten' },
    ru: { beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' },
    vi: { beginner: 'Sơ cấp', intermediate: 'Trung cấp', advanced: 'Cao cấp' },
};

const DIFFICULTIES: NewsDifficulty[] = ['beginner', 'intermediate', 'advanced'];

export default function DifficultySelector({ value, onChange, nativeLanguage }: Props) {
    const labels = LABELS[nativeLanguage] || LABELS.en;

    return (
        <div className={styles.container}>
            {DIFFICULTIES.map((d) => (
                <button
                    key={d}
                    className={`${styles.pill} ${value === d ? styles.active : ''}`}
                    onClick={() => onChange(d)}
                >
                    {labels[d]}
                </button>
            ))}
        </div>
    );
}
