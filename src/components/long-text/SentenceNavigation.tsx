"use client";

import React from "react";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import styles from "./SentenceNavigation.module.css";

interface SentenceNavigationProps {
    currentIndex: number;
    totalSentences: number;
    onPrev: () => void;
    onNext: () => void;
    onOpenList?: () => void;
    completedSentences?: number[];
}

export default function SentenceNavigation({
    currentIndex,
    totalSentences,
    onPrev,
    onNext,
    onOpenList,
    completedSentences = [],
}: SentenceNavigationProps) {
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === totalSentences - 1;

    return (
        <div className={styles.container}>
            <button
                className={styles.navBtn}
                onClick={onPrev}
                disabled={isFirst}
                title="前の文"
            >
                <ChevronLeft size={24} />
            </button>

            <div className={styles.progressIndicator}>
                {onOpenList && (
                    <button
                        className={styles.listBtn}
                        onClick={onOpenList}
                        title="文一覧"
                    >
                        <List size={18} />
                    </button>
                )}
                <div className={styles.dots}>
                    {Array.from({ length: Math.min(totalSentences, 10) }).map((_, i) => {
                        const sentenceIndex = totalSentences <= 10
                            ? i
                            : Math.floor((i / 9) * (totalSentences - 1));
                        const isActive = currentIndex === sentenceIndex;
                        const isCompleted = completedSentences.includes(sentenceIndex);

                        return (
                            <div
                                key={i}
                                className={`${styles.dot} ${isActive ? styles.dotActive : ''} ${isCompleted ? styles.dotCompleted : ''}`}
                            />
                        );
                    })}
                </div>
            </div>

            <button
                className={styles.navBtn}
                onClick={onNext}
                disabled={isLast}
                title="次の文"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
}
