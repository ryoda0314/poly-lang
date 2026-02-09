"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { GrammarPoint } from "@/actions/sentence-analysis";
import styles from "./GrammarPoints.module.css";

interface Props {
    points: GrammarPoint[];
}

export default function GrammarPoints({ points }: Props) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    if (!points.length) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>文法ポイント</div>
            <div className={styles.list}>
                {points.map((point, i) => {
                    const isExpanded = expandedIndex === i;
                    return (
                        <div key={i} className={`${styles.item} ${isExpanded ? styles.expanded : ""}`}>
                            <button
                                className={styles.itemHeader}
                                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                            >
                                <span className={styles.pointName}>{point.name}</span>
                                <ChevronDown size={16} className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`} />
                            </button>
                            {isExpanded && (
                                <div className={styles.itemBody}>
                                    <div className={styles.relevantPart}>
                                        <span className={styles.relevantLabel}>該当部分:</span>
                                        <span className={styles.relevantText}>{point.relevantPart}</span>
                                    </div>
                                    <p className={styles.explanation}>{point.explanation}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
