"use client";

import type { VocabNote } from "@/actions/sentence-analysis";
import styles from "./VocabularyList.module.css";

interface Props {
    vocabulary: VocabNote[];
}

export default function VocabularyList({ vocabulary }: Props) {
    if (!vocabulary.length) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>語彙</div>
            <div className={styles.list}>
                {vocabulary.map((v, i) => (
                    <div key={i} className={styles.item}>
                        <div className={styles.wordRow}>
                            <span className={styles.word}>{v.word}</span>
                            <span className={styles.pronunciation}>{v.pronunciation}</span>
                            <span className={styles.pos}>{v.pos}</span>
                        </div>
                        <div className={styles.meaning}>{v.meaning}</div>
                        {v.note && <div className={styles.note}>{v.note}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}
