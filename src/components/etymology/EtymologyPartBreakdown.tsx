"use client";

import type { PartBreakdown, LearningHint } from "@/actions/etymology";
import { Info } from "lucide-react";
import styles from "./EtymologyPartBreakdown.module.css";

interface Props {
    parts: PartBreakdown[];
    hints: LearningHint[] | null;
    onPartClick?: (part: string, type: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
    prefix: "#3498db",
    root: "#27ae60",
    suffix: "#e67e22",
    combining_form: "#9b59b6",
};

const TYPE_LABELS: Record<string, string> = {
    prefix: "接頭辞",
    root: "語根",
    suffix: "接尾辞",
    combining_form: "結合形",
};

export default function EtymologyPartBreakdown({ parts, hints, onPartClick }: Props) {
    if (!parts || parts.length === 0) return null;

    const hintMap = new Map(
        (hints || []).map((h) => [h.part.toLowerCase(), h.hint])
    );

    return (
        <div className={styles.container}>
            <div className={styles.label}>部品分解</div>
            <div className={styles.parts}>
                {parts.map((p, i) => {
                    const color = TYPE_COLORS[p.type] || "#888";
                    const hint = hintMap.get(p.part.toLowerCase());
                    return (
                        <button
                            key={i}
                            className={styles.part}
                            style={{ borderColor: color }}
                            onClick={() => onPartClick?.(p.part, p.type)}
                        >
                            <span className={styles.partText} style={{ color }}>{p.part}</span>
                            <span className={styles.partType} style={{ background: color }}>
                                {TYPE_LABELS[p.type] || p.type}
                            </span>
                            <span className={styles.partMeaning}>{p.meaning}</span>
                            <span className={styles.partOrigin}>{p.origin}</span>
                            {hint && (
                                <div className={styles.hint}>
                                    <Info size={12} />
                                    <span>{hint}</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
