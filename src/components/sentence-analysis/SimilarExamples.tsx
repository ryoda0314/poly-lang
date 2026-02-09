"use client";

import type { SimilarExample } from "@/actions/sentence-analysis";
import styles from "./SimilarExamples.module.css";

interface Props {
    examples: SimilarExample[];
    onAnalyze?: (sentence: string) => void;
}

export default function SimilarExamples({ examples, onAnalyze }: Props) {
    if (!examples.length) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>類似構文の例文</div>
            <div className={styles.list}>
                {examples.map((ex, i) => (
                    <div key={i} className={styles.item}>
                        <div className={styles.patternBadge}>{ex.pattern}</div>
                        <p className={styles.sentence}>{ex.sentence}</p>
                        <p className={styles.translation}>{ex.translation}</p>
                        {onAnalyze && (
                            <button
                                className={styles.analyzeButton}
                                onClick={() => onAnalyze(ex.sentence)}
                            >
                                この文を解析
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
