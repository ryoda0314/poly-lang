"use client";

import type { NuanceNote } from "@/actions/etymology";
import { Scale } from "lucide-react";
import styles from "./NuanceComparison.module.css";

interface Props {
    notes: NuanceNote[];
}

export default function NuanceComparison({ notes }: Props) {
    if (!notes || notes.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.label}>
                <Scale size={14} />
                <span>ニュアンス比較</span>
            </div>
            {notes.map((note, i) => (
                <div key={i} className={styles.card}>
                    <div className={styles.wordsRow}>
                        {note.words.map((w, j) => (
                            <span key={j}>
                                <span className={styles.word}>{w}</span>
                                {j < note.words.length - 1 && <span className={styles.vs}>vs</span>}
                            </span>
                        ))}
                    </div>
                    <p className={styles.explanation}>{note.explanation}</p>
                </div>
            ))}
        </div>
    );
}
