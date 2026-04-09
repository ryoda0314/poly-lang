"use client";

import { useState, useCallback } from "react";
import { Search, Clock, Sparkles, Loader2, BookOpen, Zap } from "lucide-react";
import type { RecentPVSearch } from "@/actions/phrasal-verbs";
import styles from "./PhrasalSearch.module.css";

interface Props {
    searchMode: "expression" | "verb";
    onSearchModeChange: (mode: "expression" | "verb") => void;
    recentSearches: RecentPVSearch[];
    isSearching: boolean;
    error: string | null;
    onSearch: (input: string) => void;
}

const SUGGESTED_EXPRESSIONS = ["look up", "break down", "get over", "kick the bucket", "call off", "bring up", "run into", "put off"];
const SUGGESTED_VERBS = ["get", "take", "look", "break", "put", "turn", "come", "go"];

export default function PhrasalSearch({ searchMode, onSearchModeChange, recentSearches, isSearching, error, onSearch }: Props) {
    const [input, setInput] = useState("");

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isSearching) {
            onSearch(input.trim());
        }
    }, [input, isSearching, onSearch]);

    const handleChipClick = useCallback((word: string) => {
        setInput(word);
        onSearch(word);
    }, [onSearch]);

    const placeholder = searchMode === "expression"
        ? "句動詞・イディオムを入力... (e.g. look up)"
        : "基本動詞を入力... (e.g. break)";

    const suggested = searchMode === "expression" ? SUGGESTED_EXPRESSIONS : SUGGESTED_VERBS;

    return (
        <div className={styles.container}>
            <div className={styles.heroSection}>
                <h1 className={styles.title}>Phrasal Verb Dictionary</h1>
                <p className={styles.subtitle}>句動詞・イディオムを深く理解しよう</p>
            </div>

            {/* Mode toggle */}
            <div className={styles.modeToggle}>
                <button
                    className={`${styles.modeButton} ${searchMode === "expression" ? styles.modeButtonActive : ""}`}
                    onClick={() => onSearchModeChange("expression")}
                >
                    <BookOpen size={14} />
                    <span>表現検索</span>
                </button>
                <button
                    className={`${styles.modeButton} ${searchMode === "verb" ? styles.modeButtonActive : ""}`}
                    onClick={() => onSearchModeChange("verb")}
                >
                    <Zap size={14} />
                    <span>動詞探索</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        className={styles.searchInput}
                        disabled={isSearching}
                        autoFocus
                    />
                    {isSearching && <Loader2 size={18} className={styles.spinner} />}
                </div>
                <button type="submit" className={styles.searchButton} disabled={isSearching || !input.trim()}>
                    {isSearching ? "検索中..." : searchMode === "expression" ? "解説を見る" : "一覧を見る"}
                </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            {recentSearches.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Clock size={14} />
                        <span>最近の検索</span>
                    </div>
                    <div className={styles.chips}>
                        {recentSearches.slice(0, 8).map((s) => (
                            <button
                                key={`${s.query}:${s.search_mode}`}
                                className={styles.chip}
                                onClick={() => {
                                    if (s.search_mode !== searchMode) {
                                        onSearchModeChange(s.search_mode);
                                    }
                                    handleChipClick(s.query);
                                }}
                            >
                                <span className={styles.chipIcon}>
                                    {s.search_mode === "verb" ? <Zap size={10} /> : <BookOpen size={10} />}
                                </span>
                                {s.query}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Sparkles size={14} />
                    <span>{searchMode === "expression" ? "おすすめの表現" : "おすすめの動詞"}</span>
                </div>
                <div className={styles.chips}>
                    {suggested.map((word) => (
                        <button key={word} className={styles.chipSuggested} onClick={() => handleChipClick(word)}>
                            {word}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
