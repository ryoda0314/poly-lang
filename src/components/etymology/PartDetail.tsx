"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Database, Loader2, Search } from "lucide-react";
import type { WordPart, PartDetailWord } from "@/actions/etymology";
import styles from "./PartDetail.module.css";

interface Props {
    part: WordPart;
    words: PartDetailWord[];
    isLoading: boolean;
    onBack: () => void;
    onWordClick: (word: string) => void;
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

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function PartDetail({ part, words, isLoading, onBack, onWordClick }: Props) {
    const color = TYPE_COLORS[part.part_type] || "#888";
    const [letterFilter, setLetterFilter] = useState<string | null>(null);

    const availableLetters = useMemo(() => {
        const set = new Set<string>();
        for (const w of words) {
            const ch = w.word[0]?.toUpperCase();
            if (ch) set.add(ch);
        }
        return set;
    }, [words]);

    const filteredWords = useMemo(() => {
        if (!letterFilter) return words;
        return words.filter(w => w.word[0]?.toUpperCase() === letterFilter);
    }, [words, letterFilter]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <div className={styles.headerInfo}>
                    <span className={styles.partName} style={{ color }}>
                        {part.part}
                    </span>
                    <span className={styles.partType} style={{ background: color }}>
                        {TYPE_LABELS[part.part_type] || part.part_type}
                    </span>
                </div>
            </div>

            {/* Meta card */}
            <div className={styles.meta} style={{ borderLeftColor: color }}>
                <p className={styles.meaning}>{part.meaning}</p>
                <span className={styles.originBadge} style={{ background: color }}>
                    {part.origin_language}
                </span>
                {part.learning_hint && (
                    <p className={styles.hint}>{part.learning_hint}</p>
                )}
            </div>

            {/* Example words from word_parts data */}
            {part.examples && part.examples.length > 0 && (
                <div className={styles.examplesRow}>
                    {part.examples.map((w, i) => (
                        <span key={i} className={styles.exampleChip}>{w}</span>
                    ))}
                </div>
            )}

            {/* Words section */}
            <div className={styles.wordsSection}>
                <h3 className={styles.wordsTitle}>
                    <BookOpen size={14} />
                    この部品を含む単語
                    {!isLoading && words.length > 0 && (
                        <span className={styles.wordCount}>
                            {letterFilter ? `${filteredWords.length} / ${words.length}` : words.length}
                        </span>
                    )}
                </h3>

                {!isLoading && words.length > 0 && (
                    <div className={styles.alphabetBar}>
                        <button
                            className={`${styles.letterBtn} ${!letterFilter ? styles.letterActive : ""}`}
                            onClick={() => setLetterFilter(null)}
                        >
                            ALL
                        </button>
                        {ALPHABET.map(ch => (
                            <button
                                key={ch}
                                className={`${styles.letterBtn} ${letterFilter === ch ? styles.letterActive : ""}`}
                                disabled={!availableLetters.has(ch)}
                                onClick={() => setLetterFilter(prev => prev === ch ? null : ch)}
                            >
                                {ch}
                            </button>
                        ))}
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.loading}>
                        <Loader2 size={24} className={styles.spinner} />
                        <span>検索中...</span>
                    </div>
                ) : words.length === 0 ? (
                    <div className={styles.empty}>
                        <Search size={32} className={styles.emptyIcon} />
                        <p className={styles.emptyText}>まだ単語が登録されていません</p>
                        <p className={styles.emptyHint}>語源を調べた単語がここに表示されます</p>
                    </div>
                ) : (
                    <div className={styles.wordsList}>
                        {filteredWords.map((w, i) => (
                            <button
                                key={`${w.word}-${i}`}
                                className={`${styles.wordItem} ${w.isStock ? styles.stockItem : ""}`}
                                onClick={() => onWordClick(w.word)}
                            >
                                <div className={styles.wordContent}>
                                    <span className={styles.wordText}>{w.word}</span>
                                    {w.isStock ? (
                                        <span className={styles.stockLabel}>
                                            <Database size={11} />
                                            ストック済み（クリックで語源を解析）
                                        </span>
                                    ) : w.definition ? (
                                        <span className={styles.wordDef}>{w.definition}</span>
                                    ) : null}
                                </div>
                                <ChevronRight size={16} className={styles.wordArrow} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
