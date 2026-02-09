"use client";

import type { VerbExplorerItem } from "@/actions/phrasal-verbs";
import { ArrowLeft, ChevronRight } from "lucide-react";
import styles from "./VerbExpressionList.module.css";

interface Props {
    verb: string;
    expressions: VerbExplorerItem[];
    onBack: () => void;
    onExpressionClick: (expression: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
    phrasal_verb: "句動詞",
    idiom: "イディオム",
    collocation: "コロケーション",
};

const FORMALITY_LABELS: Record<string, string> = {
    formal: "Formal",
    neutral: "Standard",
    informal: "Casual",
    slang: "Slang",
};

export default function VerbExpressionList({ verb, expressions, onBack, onExpressionClick }: Props) {
    const grouped = expressions.reduce<Record<string, VerbExplorerItem[]>>((acc, item) => {
        const key = item.type || "phrasal_verb";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const typeOrder = ["phrasal_verb", "idiom", "collocation"];
    const sortedGroups = typeOrder
        .filter((t) => grouped[t]?.length)
        .map((t) => ({ type: t, items: grouped[t] }));

    return (
        <div className={styles.container}>
            {/* Hero */}
            <div className={styles.hero}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div className={styles.heroBody}>
                    <span className={styles.heroLabel}>Verb Explorer</span>
                    <h1 className={styles.heroVerb}>{verb}</h1>
                    <span className={styles.heroCount}>{expressions.length} expressions</span>
                </div>
            </div>

            {/* Groups */}
            <div className={styles.groups}>
                {sortedGroups.map(({ type, items }) => (
                    <div key={type} className={styles.group}>
                        <div className={styles.groupHeader}>
                            <span className={`${styles.groupBadge} ${styles[`type_${type}`]}`}>
                                {TYPE_LABELS[type] || type}
                            </span>
                            <span className={styles.groupCount}>{items.length}</span>
                            <div className={styles.groupLine} />
                        </div>
                        <div className={styles.list}>
                            {items.map((item) => (
                                <button
                                    key={item.expression}
                                    className={styles.card}
                                    onClick={() => onExpressionClick(item.expression)}
                                >
                                    <div className={styles.cardTop}>
                                        <span className={styles.cardExpr}>{item.expression}</span>
                                        <span className={`${styles.cardFormality} ${styles[`f_${item.formality}`]}`}>
                                            {FORMALITY_LABELS[item.formality] || item.formality}
                                        </span>
                                    </div>
                                    <p className={styles.cardMeaning}>{item.briefMeaning}</p>
                                    <ChevronRight size={14} className={styles.cardArrow} />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
