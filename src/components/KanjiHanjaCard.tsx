"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import styles from "./KanjiHanjaCard.module.css";

interface Props {
    kanji: string;
    hanja: string;
    koreanReading: string;
    hanjaMeaning: string;
    wordType: 'character' | 'compound';
    usageExamples?: { japanese: string; korean: string; meaning?: string }[];
    onReveal?: () => void;
}

export default function KanjiHanjaCard({
    kanji,
    hanja,
    koreanReading,
    hanjaMeaning,
    wordType,
    usageExamples,
    onReveal
}: Props) {
    const [isRevealed, setIsRevealed] = useState(false);

    const handleReveal = () => {
        setIsRevealed(true);
        onReveal?.();
    };

    return (
        <div className={styles.cardContainer}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Front: Japanese Kanji */}
                <div className={styles.front}>
                    <div className={styles.wordTypeTag}>
                        {wordType === 'character' ? '個別漢字' : '熟語'}
                    </div>
                    <div className={styles.kanji}>{kanji}</div>
                    {!isRevealed && (
                        <button onClick={handleReveal} className={styles.revealBtn}>
                            韓国語を表示
                        </button>
                    )}
                </div>

                {/* Back: Korean Hanja + Reading */}
                {isRevealed && (
                    <motion.div
                        className={styles.back}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <div className={styles.hanjaText}>{hanja}</div>
                        <div className={styles.koreanReading}>{koreanReading}</div>
                        <div className={styles.hanjaMeaning}>{hanjaMeaning}</div>

                        {usageExamples && usageExamples.length > 0 && (
                            <div className={styles.examples}>
                                <div className={styles.examplesTitle}>用例</div>
                                {usageExamples.slice(0, 2).map((ex, idx) => (
                                    <div key={idx} className={styles.example}>
                                        <div className={styles.exampleJa}>{ex.japanese}</div>
                                        <div className={styles.exampleKo}>{ex.korean}</div>
                                        {ex.meaning && (
                                            <div className={styles.exampleMeaning}>{ex.meaning}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
