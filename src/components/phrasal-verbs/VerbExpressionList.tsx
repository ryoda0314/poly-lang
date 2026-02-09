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
    formal: "フォーマル",
    neutral: "標準",
    informal: "カジュアル",
    slang: "スラング",
};

export default function VerbExpressionList({ verb, expressions, onBack, onExpressionClick }: Props) {
    // Group by type
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
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>
                        <span className={styles.verbHighlight}>{verb}</span> の表現一覧
                    </h1>
                    <p className={styles.count}>{expressions.length} 件の表現</p>
                </div>
            </div>

            {/* Expression list */}
            <div className={styles.groups}>
                {sortedGroups.map(({ type, items }) => (
                    <div key={type} className={styles.group}>
                        <div className={styles.groupHeader}>
                            <span className={`${styles.groupBadge} ${styles[`type_${type}`]}`}>
                                {TYPE_LABELS[type] || type}
                            </span>
                            <span className={styles.groupCount}>{items.length}</span>
                        </div>
                        <div className={styles.list}>
                            {items.map((item) => (
                                <button
                                    key={item.expression}
                                    className={styles.card}
                                    onClick={() => onExpressionClick(item.expression)}
                                >
                                    <div className={styles.cardMain}>
                                        <span className={styles.cardExpression}>{item.expression}</span>
                                        <span className={`${styles.cardFormality} ${styles[`formality_${item.formality}`]}`}>
                                            {FORMALITY_LABELS[item.formality] || item.formality}
                                        </span>
                                    </div>
                                    <p className={styles.cardMeaning}>{item.briefMeaning}</p>
                                    <ChevronRight size={16} className={styles.cardArrow} />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
