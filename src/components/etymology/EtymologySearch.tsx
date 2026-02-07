"use client";

import { useState, useCallback } from "react";
import { Search, Clock, Sparkles, Loader2 } from "lucide-react";
import type { RecentSearch } from "@/actions/etymology";
import styles from "./EtymologySearch.module.css";

interface Props {
    recentSearches: RecentSearch[];
    targetLanguage: string;
    onTargetLanguageChange: (lang: string) => void;
    isSearching: boolean;
    error: string | null;
    onSearch: (word: string) => void;
}

const LANG_OPTIONS: { code: string; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
    { code: "ko", label: "한국어", flag: "🇰🇷" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

const SUGGESTED_WORDS: Record<string, string[]> = {
    en: ["philosophy", "telephone", "incredible", "democracy", "astronomy", "calculate", "quarantine", "disaster"],
    fr: ["philosophie", "incroyable", "démocratie", "téléphone", "bibliothèque", "chandelier", "bourgeois", "renaissance"],
    de: ["Philosophie", "Kindergarten", "Zeitgeist", "Wanderlust", "Angst", "Doppelgänger", "Gemütlichkeit", "Schadenfreude"],
    es: ["filosofía", "teléfono", "democracia", "biblioteca", "guerrilla", "mosquito", "tornado", "chocolate"],
    ja: ["哲学", "電話", "民主主義", "台風", "津波", "侍", "改善", "漢字"],
    zh: ["哲学", "电话", "民主", "功夫", "风水", "太极", "茶", "丝绸"],
    ko: ["철학", "전화", "민주주의", "한글", "김치", "태권도", "재벌", "한류"],
    ru: ["философия", "телефон", "демократия", "спутник", "тройка", "самовар", "перестройка", "борщ"],
    vi: ["triết học", "điện thoại", "dân chủ", "phở", "áo dài", "bánh mì", "cà phê", "nước mắm"],
};

const LANG_PLACEHOLDERS: Record<string, string> = {
    en: "英単語を入力...",
    fr: "フランス語の単語を入力...",
    de: "ドイツ語の単語を入力...",
    es: "スペイン語の単語を入力...",
    ja: "日本語の単語を入力...",
    zh: "中国語の単語を入力...",
    ko: "韓国語の単語を入力...",
    ru: "ロシア語の単語を入力...",
    vi: "ベトナム語の単語を入力...",
};

const LANG_SUBTITLES: Record<string, string> = {
    en: "英単語の語源を探索しよう",
    fr: "フランス語の語源を探索しよう",
    de: "ドイツ語の語源を探索しよう",
    es: "スペイン語の語源を探索しよう",
    ja: "日本語の語源を探索しよう",
    zh: "中国語の語源を探索しよう",
    ko: "韓国語の語源を探索しよう",
    ru: "ロシア語の語源を探索しよう",
    vi: "ベトナム語の語源を探索しよう",
};

export default function EtymologySearch({ recentSearches, targetLanguage, onTargetLanguageChange, isSearching, error, onSearch }: Props) {
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

    const suggested = SUGGESTED_WORDS[targetLanguage] || SUGGESTED_WORDS.en;

    return (
        <div className={styles.container}>
            <div className={styles.heroSection}>
                <h1 className={styles.title}>Etymology Explorer</h1>
                <p className={styles.subtitle}>{LANG_SUBTITLES[targetLanguage] || LANG_SUBTITLES.en}</p>
            </div>

            {/* Language selector */}
            <div className={styles.langSelector}>
                {LANG_OPTIONS.map((lang) => (
                    <button
                        key={lang.code}
                        className={`${styles.langChip} ${targetLanguage === lang.code ? styles.langChipActive : ""}`}
                        onClick={() => onTargetLanguageChange(lang.code)}
                    >
                        <span className={styles.langFlag}>{lang.flag}</span>
                        <span className={styles.langLabel}>{lang.label}</span>
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={LANG_PLACEHOLDERS[targetLanguage] || LANG_PLACEHOLDERS.en}
                        className={styles.searchInput}
                        disabled={isSearching}
                        autoFocus
                    />
                    {isSearching && <Loader2 size={18} className={styles.spinner} />}
                </div>
                <button type="submit" className={styles.searchButton} disabled={isSearching || !input.trim()}>
                    {isSearching ? "検索中..." : "検索"}
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
                            <button key={`${s.word}:${s.target_language}`} className={styles.chip} onClick={() => handleChipClick(s.word)}>
                                {s.word}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Sparkles size={14} />
                    <span>おすすめの単語</span>
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
