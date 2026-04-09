"use client";

import { Bookmark } from "lucide-react";
import type { VocabItem } from "@/types/news";
import styles from "./VocabularyPanel.module.css";

interface Props {
    vocabulary: VocabItem[];
    onToggleSaved: (index: number) => void;
}

export default function VocabularyPanel({ vocabulary, onToggleSaved }: Props) {
    if (vocabulary.length === 0) return null;

    return (
        <div className={styles.container}>
            {vocabulary.map((item, i) => (
                <div key={i} className={styles.card}>
                    <div className={styles.wordRow}>
                        <div className={styles.wordInfo}>
                            <span className={styles.word}>{item.word}</span>
                            {item.reading && <span className={styles.reading}>{item.reading}</span>}
                            <span className={styles.pos}>{item.pos}</span>
                        </div>
                        <button
                            className={`${styles.saveBtn} ${item.saved ? styles.saved : ''}`}
                            onClick={() => onToggleSaved(i)}
                        >
                            <Bookmark size={16} fill={item.saved ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <p className={styles.definition}>{item.definition}</p>
                    {item.example_sentence && (
                        <p className={styles.example}>{item.example_sentence}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
