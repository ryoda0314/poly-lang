"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SyntaxTestEvidence } from "@/lib/sentence-parser/types";
import styles from "./SyntaxTests.module.css";

const TEST_NAME_LABELS: Record<string, string> = {
    aux_in_v_chain: "助動詞チェーン",
    finite_verb_exists: "定動詞の存在",
    pattern_consistency: "文型整合性",
    relative_gap: "関係節ギャップ",
    noun_clause_completeness: "名詞節完全性",
    to_inf_function: "to不定詞の機能",
    span_exact_match: "スパン一致",
    expandsTo_integrity: "展開先の整合性",
    m_has_target: "修飾語の係り先",
};

interface Props {
    tests: SyntaxTestEvidence[];
}

export default function SyntaxTests({ tests }: Props) {
    const [expanded, setExpanded] = useState(false);

    if (!tests.length) return null;

    const passCount = tests.filter(t => t.status === "pass").length;
    const warnCount = tests.filter(t => t.status === "warn").length;
    const failCount = tests.filter(t => t.status === "fail").length;

    // Show fails/warns first, then passes
    const sorted = [...tests].sort((a, b) => {
        const order = { fail: 0, warn: 1, pass: 2 };
        return order[a.status] - order[b.status];
    });

    // In collapsed mode, show only fails and warns
    const visible = expanded ? sorted : sorted.filter(t => t.status !== "pass");

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>構文テスト</div>

            <div className={styles.summary}>
                {passCount > 0 && (
                    <span className={`${styles.badge} ${styles.badgePass}`}>
                        {passCount} pass
                    </span>
                )}
                {warnCount > 0 && (
                    <span className={`${styles.badge} ${styles.badgeWarn}`}>
                        {warnCount} warn
                    </span>
                )}
                {failCount > 0 && (
                    <span className={`${styles.badge} ${styles.badgeFail}`}>
                        {failCount} fail
                    </span>
                )}
            </div>

            {visible.length > 0 && (
                <div className={styles.list}>
                    {visible.map((test, i) => (
                        <div key={i} className={styles.item}>
                            <div
                                className={`${styles.statusDot} ${
                                    test.status === "pass" ? styles.dotPass
                                    : test.status === "warn" ? styles.dotWarn
                                    : styles.dotFail
                                }`}
                            />
                            <div className={styles.itemContent}>
                                <span className={styles.testName}>
                                    {TEST_NAME_LABELS[test.testName] ?? test.testName}
                                </span>
                                <span className={styles.message}>{test.message}</span>
                                <div className={styles.meta}>
                                    <span>{test.ruleId}</span>
                                    <span>{test.clauseId}</span>
                                    {test.evidenceText && (
                                        <span className={styles.evidence}>{test.evidenceText}</span>
                                    )}
                                    <span>{Math.round(test.confidence * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {passCount > 0 && (
                <button
                    className={styles.toggleButton}
                    onClick={() => setExpanded(!expanded)}
                >
                    <span>{expanded ? "合格テストを隠す" : `合格テスト ${passCount}件を表示`}</span>
                    <ChevronDown
                        size={14}
                        className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
                    />
                </button>
            )}
        </div>
    );
}
