"use client";

import type { ExpressionEntry } from "@/actions/phrasal-verbs";
import { ArrowLeft, BookOpen, History, Lightbulb, Link2, ArrowRight } from "lucide-react";
import CoreImageCard from "./CoreImageCard";
import styles from "./ExpressionDetail.module.css";

interface Props {
    entry: ExpressionEntry;
    onBack: () => void;
    onRelatedClick: (expression: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
    phrasal_verb: "Phrasal Verb",
    idiom: "Idiom",
    collocation: "Collocation",
};

const FORMALITY_LABELS: Record<string, string> = {
    formal: "Formal",
    neutral: "Standard",
    informal: "Casual",
    slang: "Slang",
};

export default function ExpressionDetail({ entry, onBack, onRelatedClick }: Props) {
    return (
        <div className={styles.container}>
            {/* Hero Header */}
            <div className={styles.hero}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div className={styles.heroBody}>
                    <span className={`${styles.typeBadge} ${styles[`type_${entry.type}`]}`}>
                        {TYPE_LABELS[entry.type] || entry.type}
                    </span>
                    <h1 className={styles.expression}>{entry.expression}</h1>
                    <span className={styles.baseVerbLabel}>
                        base: <strong>{entry.baseVerb}</strong>
                    </span>
                </div>
            </div>

            {/* Core Image — prominent, before meanings */}
            {entry.coreImage && (
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>
                        <Lightbulb size={14} />
                        <span>核イメージ</span>
                    </div>
                    <CoreImageCard
                        coreImage={entry.coreImage}
                        expression={entry.expression}
                    />
                </section>
            )}

            {/* Meanings */}
            <section className={styles.section}>
                <div className={styles.sectionLabel}>
                    <span className={styles.sectionDot} />
                    <span>{entry.coreImage ? "派生した意味" : "意味"}</span>
                    <span className={styles.sectionCount}>{entry.meanings.length}</span>
                </div>
                <div className={styles.meaningsList}>
                    {entry.meanings.map((m, i) => (
                        <div key={i} className={styles.meaningCard}>
                            <div className={styles.meaningLeft}>
                                <span className={styles.meaningNum}>{i + 1}</span>
                                {i < entry.meanings.length - 1 && (
                                    <div className={styles.meaningLine} />
                                )}
                            </div>
                            <div className={styles.meaningBody}>
                                <div className={styles.meaningTop}>
                                    <p className={styles.meaningText}>{m.meaning}</p>
                                    <span className={`${styles.formalityTag} ${styles[`f_${m.formality}`]}`}>
                                        {FORMALITY_LABELS[m.formality] || m.formality}
                                    </span>
                                </div>
                                {m.examples.length > 0 && (
                                    <div className={styles.exampleList}>
                                        {m.examples.map((ex, j) => (
                                            <p key={j} className={styles.exampleLine}>{ex}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Origin + History — side by side on wider screens, stacked on mobile */}
            {(entry.origin || entry.history) && (
                <section className={styles.infoGrid}>
                    {entry.origin && (
                        <div className={styles.infoCard}>
                            <div className={styles.infoCardHeader}>
                                <BookOpen size={14} />
                                <span>成り立ち</span>
                            </div>
                            <p className={styles.infoCardText}>{entry.origin}</p>
                        </div>
                    )}
                    {entry.history && (
                        <div className={styles.infoCard}>
                            <div className={styles.infoCardHeader}>
                                <History size={14} />
                                <span>歴史</span>
                            </div>
                            <p className={styles.infoCardText}>{entry.history}</p>
                        </div>
                    )}
                </section>
            )}

            {/* Related Expressions */}
            {entry.relatedExpressions.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>
                        <Link2 size={14} />
                        <span>関連表現</span>
                    </div>
                    <div className={styles.relatedList}>
                        {entry.relatedExpressions.map((expr) => (
                            <button
                                key={expr}
                                className={styles.relatedItem}
                                onClick={() => onRelatedClick(expr)}
                            >
                                <span>{expr}</span>
                                <ArrowRight size={14} className={styles.relatedArrow} />
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
