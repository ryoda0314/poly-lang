"use client";

import { Bookmark } from "lucide-react";
import type { GrammarPattern } from "@/types/news";
import styles from "./GrammarPanel.module.css";

interface Props {
    patterns: GrammarPattern[];
    onToggleSaved: (index: number) => void;
}

export default function GrammarPanel({ patterns, onToggleSaved }: Props) {
    if (patterns.length === 0) return null;

    return (
        <div className={styles.container}>
            {patterns.map((item, i) => (
                <div key={i} className={styles.card}>
                    <div className={styles.headerRow}>
                        <div className={styles.patternInfo}>
                            <span className={styles.pattern}>{item.pattern}</span>
                            <span className={styles.level}>{item.level}</span>
                        </div>
                        <button
                            className={`${styles.saveBtn} ${item.saved ? styles.saved : ''}`}
                            onClick={() => onToggleSaved(i)}
                        >
                            <Bookmark size={16} fill={item.saved ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <p className={styles.explanation}>{item.explanation}</p>
                    {item.example && (
                        <p className={styles.example}>{item.example}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
