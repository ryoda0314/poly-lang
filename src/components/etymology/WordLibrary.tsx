"use client";

import { useState, useCallback } from "react";
import { Search, ArrowLeft } from "lucide-react";
import type { LibraryEntry } from "@/actions/etymology";
import { getLangColor } from "./lang-colors";
import styles from "./WordLibrary.module.css";

const LANG_LABELS: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "日本語", zh: "中文", ko: "한국어", ru: "Русский", vi: "Tiếng Việt",
};

interface Props {
    entries: LibraryEntry[];
    totalCount: number;
    languages: string[];
    isLoading: boolean;
    onBack: () => void;
    onWordClick: (word: string, targetLang: string) => void;
    onFilterChange: (filter: { targetLang?: string; search?: string }) => void;
}

export default function WordLibrary({ entries, totalCount, languages, isLoading, onBack, onWordClick, onFilterChange }: Props) {
    const [activeLang, setActiveLang] = useState("all");
    const [searchText, setSearchText] = useState("");

    const handleLangChange = useCallback((lang: string) => {
        setActiveLang(lang);
        onFilterChange({ targetLang: lang, search: searchText });
    }, [searchText, onFilterChange]);

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        onFilterChange({ targetLang: activeLang, search: text });
    }, [activeLang, onFilterChange]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className={styles.title}>単語ライブラリ</h2>
                <span className={styles.count}>{totalCount}件</span>
            </div>

            {/* Language tabs */}
            <div className={styles.langRow}>
                <button
                    className={`${styles.langChip} ${activeLang === "all" ? styles.langActive : ""}`}
                    onClick={() => handleLangChange("all")}
                >
                    すべて
                </button>
                {languages.map((lang) => (
                    <button
                        key={lang}
                        className={`${styles.langChip} ${activeLang === lang ? styles.langActive : ""}`}
                        onClick={() => handleLangChange(lang)}
                    >
                        {LANG_LABELS[lang] || lang}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="単語を検索..."
                    className={styles.searchInput}
                />
            </div>

            {/* Word list */}
            {isLoading ? (
                <div className={styles.loading}>読み込み中...</div>
            ) : entries.length === 0 ? (
                <div className={styles.empty}>該当する単語がありません</div>
            ) : (
                <div className={styles.list}>
                    {entries.map((e) => (
                        <button
                            key={`${e.word}:${e.target_language}`}
                            className={styles.card}
                            onClick={() => onWordClick(e.word, e.target_language)}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.cardWord}>{e.word}</span>
                                <span
                                    className={styles.cardLang}
                                    style={{ background: getLangColor(LANG_LABELS[e.target_language] || e.target_language) }}
                                >
                                    {e.target_language}
                                </span>
                            </div>
                            {e.definition && (
                                <span className={styles.cardDef}>{e.definition}</span>
                            )}
                            {e.origin_language && (
                                <span className={styles.cardOrigin}>{e.origin_language}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
