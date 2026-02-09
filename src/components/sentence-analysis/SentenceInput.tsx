"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import AnalysisHistory from "./AnalysisHistory";
import styles from "./SentenceInput.module.css";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (sentence: string) => void;
    isLoading: boolean;
    error: string | null;
}

const EXAMPLE_SENTENCES = [
    "The cat sat on the mat.",
    "She gave him a book that she had bought yesterday.",
    "What the teacher said surprised everyone in the class.",
    "The man who lives next door is a doctor.",
    "Having finished his homework, he went out to play.",
];

export default function SentenceInput({ value, onChange, onSubmit, isLoading, error }: Props) {
    const [input, setInput] = useState(value);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onChange(input.trim());
            onSubmit(input.trim());
        }
    }, [input, isLoading, onChange, onSubmit]);

    const handleExampleClick = useCallback((sentence: string) => {
        setInput(sentence);
        onChange(sentence);
        onSubmit(sentence);
    }, [onChange, onSubmit]);

    return (
        <div className={styles.container}>
            <div className={styles.heroSection}>
                <h1 className={styles.title}>Sentence Analysis</h1>
                <p className={styles.subtitle}>英文の構造をAIが解析・ビジュアライズ</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <div className={styles.inputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="英文を入力..."
                        className={styles.input}
                        disabled={isLoading}
                        autoFocus
                        maxLength={300}
                    />
                    {isLoading && <Loader2 size={18} className={styles.spinner} />}
                </div>
                <div className={styles.inputFooter}>
                    <span className={styles.charCount}>{input.length}/300</span>
                    <button type="submit" className={styles.submitButton} disabled={isLoading || !input.trim()}>
                        {isLoading ? "解析中..." : "解析する"}
                    </button>
                </div>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            <AnalysisHistory onSelect={handleExampleClick} disabled={isLoading} />

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Sparkles size={14} />
                    <span>例文で試す</span>
                </div>
                <div className={styles.examples}>
                    {EXAMPLE_SENTENCES.map((sentence) => (
                        <button
                            key={sentence}
                            className={styles.exampleChip}
                            onClick={() => handleExampleClick(sentence)}
                            disabled={isLoading}
                        >
                            {sentence}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
