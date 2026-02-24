"use client";

import { useState, useCallback } from "react";
import { Search, Clock, Sparkles, Loader2 } from "lucide-react";
import type { RecentSearch } from "@/actions/etymology";
import { translations } from "@/lib/translations";
import styles from "./EtymologySearch.module.css";

interface Props {
    recentSearches: RecentSearch[];
    targetLanguage: string;
    nativeLanguage: string;
    isSearching: boolean;
    error: string | null;
    onSearch: (word: string) => void;
}

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

export default function EtymologySearch({ recentSearches, targetLanguage, nativeLanguage, isSearching, error, onSearch }: Props) {
    const [input, setInput] = useState("");
    const t = (translations as Record<string, Record<string, string>>)[nativeLanguage] || translations.ja;

    const langName = (t as Record<string, string>)[`language_${targetLanguage}`] || targetLanguage;

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
                <p className={styles.subtitle}>
                    {(t.etymologySubtitle || "{lang}の語源を探索しよう").replace("{lang}", langName)}
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={(t.etymologyPlaceholder || "{lang}の単語を入力...").replace("{lang}", langName)}
                        className={styles.searchInput}
                        disabled={isSearching}
                        autoFocus
                    />
                    {isSearching && <Loader2 size={18} className={styles.spinner} />}
                </div>
                <button type="submit" className={styles.searchButton} disabled={isSearching || !input.trim()}>
                    {isSearching ? (t.etymologySearching || "検索中...") : (t.etymologySearchBtn || "検索")}
                </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            {recentSearches.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Clock size={14} />
                        <span>{t.etymologyRecentSearches || "最近の検索"}</span>
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
                    <span>{t.etymologySuggestedWords || "おすすめの単語"}</span>
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
