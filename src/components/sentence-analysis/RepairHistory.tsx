"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { RepairLog } from "@/lib/sentence-parser/types";
import styles from "./RepairHistory.module.css";

interface Props {
    log: RepairLog;
}

function formatValue(val: unknown): string {
    if (val === null || val === undefined) return "null";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
}

export default function RepairHistory({ log }: Props) {
    const [expanded, setExpanded] = useState(false);

    if (!log.actions.length) return null;

    return (
        <div className={styles.wrapper}>
            <button
                className={styles.toggleButton}
                onClick={() => setExpanded(!expanded)}
            >
                <span>自動修正履歴 ({log.actions.length}件)</span>
                <ChevronDown
                    size={14}
                    className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
                />
            </button>

            {expanded && (
                <>
                    <div className={styles.list}>
                        {log.actions.map((action, i) => (
                            <div key={i} className={styles.item}>
                                <div className={styles.reason}>{action.reason}</div>
                                <div className={styles.diff}>
                                    <span className={styles.before}>
                                        {Object.entries(action.before).map(([k, v]) => `${k}: ${formatValue(v)}`).join(", ")}
                                    </span>
                                    <span className={styles.arrow}>&rarr;</span>
                                    <span className={styles.after}>
                                        {Object.entries(action.after).map(([k, v]) => `${k}: ${formatValue(v)}`).join(", ")}
                                    </span>
                                </div>
                                <div className={styles.meta}>
                                    <span>{action.type}</span>
                                    <span>{action.clauseId}</span>
                                    {action.elementIndex != null && (
                                        <span>elem[{action.elementIndex}]</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {log.cascadeCount > 0 && (
                        <div className={styles.cascadeNote}>
                            カスケード修正: {log.cascadeCount}回
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
