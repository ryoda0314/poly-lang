"use client";

import type { ExpressionEntry } from "@/actions/phrasal-verbs";
import { ArrowLeft, MessageCircle, BookOpen, History, Lightbulb, Link2 } from "lucide-react";
import styles from "./ExpressionDetail.module.css";

interface Props {
    entry: ExpressionEntry;
    onBack: () => void;
    onRelatedClick: (expression: string) => void;
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

export default function ExpressionDetail({ entry, onBack, onRelatedClick }: Props) {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div className={styles.headerContent}>
                    <h1 className={styles.expression}>{entry.expression}</h1>
                    <div className={styles.badges}>
                        <span className={`${styles.typeBadge} ${styles[`type_${entry.type}`]}`}>
                            {TYPE_LABELS[entry.type] || entry.type}
                        </span>
                        <span className={styles.verbBadge}>
                            {entry.baseVerb}
                        </span>
                    </div>
                </div>
            </div>

            {/* Meanings */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <MessageCircle size={16} />
                    <h2 className={styles.sectionTitle}>意味</h2>
                </div>
                <div className={styles.meaningsList}>
                    {entry.meanings.map((m, i) => (
                        <div key={i} className={styles.meaningCard}>
                            <div className={styles.meaningHeader}>
                                <span className={styles.meaningNumber}>{i + 1}</span>
                                <span className={`${styles.formalityBadge} ${styles[`formality_${m.formality}`]}`}>
                                    {FORMALITY_LABELS[m.formality] || m.formality}
                                </span>
                            </div>
                            <p className={styles.meaningText}>{m.meaning}</p>
                            {m.examples.length > 0 && (
                                <div className={styles.examples}>
                                    {m.examples.map((ex, j) => (
                                        <p key={j} className={styles.example}>{ex}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Particle Imagery */}
            {entry.particleImagery && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Lightbulb size={16} />
                        <h2 className={styles.sectionTitle}>前置詞のイメージ</h2>
                    </div>
                    <div className={styles.particleCard}>
                        <div className={styles.particleHeader}>
                            <span className={styles.particleWord}>{entry.particleImagery.particle}</span>
                            <span className={styles.particleCoreImage}>{entry.particleImagery.coreImage}</span>
                        </div>
                        <p className={styles.particleExplanation}>{entry.particleImagery.explanation}</p>
                    </div>
                </section>
            )}

            {/* Origin */}
            {entry.origin && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <BookOpen size={16} />
                        <h2 className={styles.sectionTitle}>成り立ち</h2>
                    </div>
                    <div className={styles.textCard}>
                        <p className={styles.textContent}>{entry.origin}</p>
                    </div>
                </section>
            )}

            {/* History */}
            {entry.history && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <History size={16} />
                        <h2 className={styles.sectionTitle}>歴史</h2>
                    </div>
                    <div className={styles.textCard}>
                        <p className={styles.textContent}>{entry.history}</p>
                    </div>
                </section>
            )}

            {/* Related Expressions */}
            {entry.relatedExpressions.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Link2 size={16} />
                        <h2 className={styles.sectionTitle}>関連表現</h2>
                    </div>
                    <div className={styles.relatedChips}>
                        {entry.relatedExpressions.map((expr) => (
                            <button
                                key={expr}
                                className={styles.relatedChip}
                                onClick={() => onRelatedClick(expr)}
                            >
                                {expr}
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
