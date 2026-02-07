"use client";

import { useEffect } from "react";
import type { EtymologyEntry, TreeNode, ConfidenceLevel } from "@/actions/etymology";
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import EtymologyPartBreakdown from "./EtymologyPartBreakdown";
import EtymologyPartFlow from "./EtymologyPartFlow";
import EtymologyTree from "./EtymologyTree";
import EtymologyStory from "./EtymologyStory";
import NuanceComparison from "./NuanceComparison";
import CognateList from "./CognateList";
import styles from "./EtymologyWordDetail.module.css";

// Extract archaic/rare Unicode characters that standard fonts can't render
const ARCHAIC_CHAR_RE = /[\u1100-\u11FF\uA960-\uA97F\uD7B0-\uD7FF]/g;

function extractArchaicChars(text: string): string {
    const chars = new Set(text.match(ARCHAIC_CHAR_RE) || []);
    return [...chars].join("");
}

interface Props {
    entry: EtymologyEntry;
    onBack: () => void;
    onRelatedWordClick: (word: string) => void;
    onPartClick: (part: string, type: string) => void;
}

export default function EtymologyWordDetail({ entry, onBack, onRelatedWordClick, onPartClick }: Props) {
    // Dynamically load Google Fonts with only the exact archaic characters found in this entry
    const entryText = JSON.stringify(entry);
    const archaicChars = extractArchaicChars(entryText);

    useEffect(() => {
        if (!archaicChars) return;
        const href = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR&text=${encodeURIComponent(archaicChars)}&display=swap`;
        // Avoid duplicate links
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
        return () => { link.remove(); };
    }, [archaicChars]);

    const handleTreeNodeSelect = (node: TreeNode) => {
        // If it's a modern English word, search for it
        if (node.language.toLowerCase() === "english" && node.word !== entry.word) {
            onRelatedWordClick(node.word);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <div className={styles.headerInfo}>
                    <h1 className={styles.word}>{entry.word}</h1>
                    {entry.pronunciation && (
                        <span className={styles.pronunciation}>{entry.pronunciation}</span>
                    )}
                </div>
            </div>

            {/* Definition */}
            {entry.definition && (
                <p className={styles.definition}>{entry.definition}</p>
            )}

            {/* Origin, first use & confidence */}
            <div className={styles.metaRow}>
                {entry.origin_language && (
                    <span className={styles.metaBadge}>
                        {entry.origin_language}
                    </span>
                )}
                {entry.first_known_use && (
                    <span className={styles.metaText}>
                        初出: {entry.first_known_use}
                    </span>
                )}
                {entry.confidence && (
                    <span className={`${styles.confidenceBadge} ${styles[`confidence_${entry.confidence.overall}`]}`}
                        title={entry.confidence.reasoning || ""}>
                        {entry.confidence.overall === "high" ? <ShieldCheck size={12} /> :
                         entry.confidence.overall === "medium" ? <ShieldAlert size={12} /> :
                         <ShieldQuestion size={12} />}
                        {entry.confidence.overall === "high" ? "信頼度: 高" :
                         entry.confidence.overall === "medium" ? "信頼度: 中" : "信頼度: 低"}
                    </span>
                )}
                {entry.has_wiktionary_data === false && (
                    <span className={styles.noWikiBadge}>Wiktionaryデータなし</span>
                )}
            </div>

            {/* Etymology summary */}
            {entry.etymology_summary && (
                <div className={styles.section}>
                    <div className={styles.summary}>
                        {entry.etymology_summary.split("\n").map((line, i) => {
                            const trimmed = line.trim();
                            if (!trimmed) return null;
                            if (/^【.+】/.test(trimmed)) {
                                const label = trimmed.match(/^【(.+?)】/)?.[1] || "";
                                const rest = trimmed.replace(/^【.+?】/, "").trim();
                                return (
                                    <div key={i} className={styles.summarySection}>
                                        <h3 className={styles.summaryLabel}>{label}</h3>
                                        {rest && <p className={styles.summaryText}>{rest}</p>}
                                    </div>
                                );
                            }
                            if (trimmed.startsWith("・")) {
                                return <p key={i} className={styles.summaryBullet}>{trimmed}</p>;
                            }
                            return <p key={i} className={styles.summaryText}>{trimmed}</p>;
                        })}
                    </div>
                </div>
            )}

            {/* Part breakdown */}
            {entry.part_breakdown && entry.part_breakdown.length > 0 && (
                <div className={styles.section}>
                    <EtymologyPartBreakdown
                        parts={entry.part_breakdown}
                        hints={entry.learning_hints}
                        onPartClick={onPartClick}
                    />
                </div>
            )}

            {/* Compound tree (part merge visualization) */}
            {entry.compound_tree && (
                <div className={styles.section}>
                    <EtymologyPartFlow tree={entry.compound_tree} />
                </div>
            )}

            {/* Etymology tree */}
            {entry.tree_data && (
                <div className={styles.section}>
                    <EtymologyTree
                        tree={entry.tree_data}
                        onNodeSelect={handleTreeNodeSelect}
                    />
                </div>
            )}

            {/* Etymology story */}
            {entry.etymology_story && (
                <div className={styles.section}>
                    <EtymologyStory story={entry.etymology_story} />
                </div>
            )}

            {/* Nuance comparison */}
            {entry.nuance_notes && entry.nuance_notes.length > 0 && (
                <div className={styles.section}>
                    <NuanceComparison notes={entry.nuance_notes} />
                </div>
            )}

            {/* Cognates */}
            {entry.cognates && entry.cognates.length > 0 && (
                <div className={styles.section}>
                    <CognateList cognates={entry.cognates} />
                </div>
            )}
        </div>
    );
}
