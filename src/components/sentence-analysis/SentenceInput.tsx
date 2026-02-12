"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, Sparkles, Clock, ArrowRight } from "lucide-react";
import { useSentenceAnalysisStore } from "@/store/sentence-analysis-store";
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

const DIFFICULTY_LABELS: Record<string, string> = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}日前`;
    return `${Math.floor(days / 30)}ヶ月前`;
}

type Tab = "examples" | "history";

export default function SentenceInput({ value, onChange, onSubmit, isLoading, error }: Props) {
    const [input, setInput] = useState(value);
    const [activeTab, setActiveTab] = useState<Tab>("examples");
    const { history, historyLoaded, loadHistory } = useSentenceAnalysisStore();

    useEffect(() => {
        if (!historyLoaded) loadHistory();
    }, [historyLoaded, loadHistory]);

    // Auto-switch to history tab if user has history
    useEffect(() => {
        if (historyLoaded && history.length > 0) {
            setActiveTab("history");
        }
    }, [historyLoaded, history.length]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onChange(input.trim());
            onSubmit(input.trim());
        }
    }, [input, isLoading, onChange, onSubmit]);

    const handleSelect = useCallback((sentence: string) => {
        setInput(sentence);
        onChange(sentence);
        onSubmit(sentence);
    }, [onChange, onSubmit]);

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Sentence Analysis</h1>
                <p className={styles.subtitle}>英文の構造をAIが解析・ビジュアライズ</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.inputCard}>
                <div className={styles.inputRow}>
                    <Search size={16} className={styles.inputIcon} />
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
                    {isLoading && <Loader2 size={16} className={styles.spinner} />}
                </div>
                <div className={styles.inputFooter}>
                    <span className={styles.charCount}>{input.length}/300</span>
                    {error && <span className={styles.error}>{error}</span>}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? "解析中..." : "解析する"}
                        {!isLoading && <ArrowRight size={14} />}
                    </button>
                </div>
            </form>

            <div className={styles.tabSection}>
                <div className={styles.tabBar}>
                    <button
                        className={`${styles.tab} ${activeTab === "examples" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("examples")}
                        type="button"
                    >
                        <Sparkles size={13} />
                        <span>例文</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "history" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("history")}
                        type="button"
                    >
                        <Clock size={13} />
                        <span>履歴</span>
                        {historyLoaded && history.length > 0 && (
                            <span className={styles.tabBadge}>{history.length}</span>
                        )}
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === "examples" && (
                        <div className={styles.list}>
                            {EXAMPLE_SENTENCES.map((sentence) => (
                                <button
                                    key={sentence}
                                    className={styles.listItem}
                                    onClick={() => handleSelect(sentence)}
                                    disabled={isLoading}
                                    type="button"
                                >
                                    <span className={styles.listSentence}>{sentence}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === "history" && (
                        <>
                            {!historyLoaded ? (
                                <div className={styles.emptyState}>
                                    <p>読み込み中...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Clock size={24} className={styles.emptyIcon} />
                                    <p>まだ解析履歴がありません</p>
                                    <span className={styles.emptyHint}>英文を解析すると、ここに履歴が表示されます</span>
                                </div>
                            ) : (
                                <div className={styles.list}>
                                    {history.map((entry) => (
                                        <button
                                            key={entry.id}
                                            className={styles.listItem}
                                            onClick={() => handleSelect(entry.sentence)}
                                            disabled={isLoading}
                                            type="button"
                                        >
                                            <span className={styles.listSentence}>{entry.sentence}</span>
                                            <div className={styles.listMeta}>
                                                {entry.sentencePatternLabel && (
                                                    <span className={styles.badge}>{entry.sentencePatternLabel}</span>
                                                )}
                                                {entry.difficulty && (
                                                    <span className={styles.diffBadge} data-difficulty={entry.difficulty}>
                                                        {DIFFICULTY_LABELS[entry.difficulty] ?? entry.difficulty}
                                                    </span>
                                                )}
                                                <span className={styles.time}>{timeAgo(entry.createdAt)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
