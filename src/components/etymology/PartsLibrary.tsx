"use client";

import { useState, useCallback } from "react";
import { Search, ArrowLeft } from "lucide-react";
import type { WordPart } from "@/actions/etymology";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./PartsLibrary.module.css";

interface Props {
    parts: WordPart[];
    origins: string[];
    isLoading: boolean;
    initialType?: string;
    onBack: () => void;
    onFilterChange: (filter: { type?: string; origin?: string; search?: string }) => void;
    onPartClick?: (part: WordPart) => void;
}

const TYPE_KEYS = [
    { key: "all", labelKey: "partsAll" },
    { key: "prefix", labelKey: "partsPrefix" },
    { key: "root", labelKey: "partsRoot" },
    { key: "suffix", labelKey: "partsSuffix" },
    { key: "combining_form", labelKey: "partsCombining" },
];
const TYPE_FALLBACKS: Record<string, string> = {
    partsAll: "すべて",
    partsPrefix: "接頭辞",
    partsRoot: "語根",
    partsSuffix: "接尾辞",
    partsCombining: "結合形",
};

const TYPE_COLORS: Record<string, string> = {
    prefix: "#3498db",
    root: "#27ae60",
    suffix: "#e67e22",
    combining_form: "#9b59b6",
};

export default function PartsLibrary({ parts, origins, isLoading, initialType, onBack, onFilterChange, onPartClick }: Props) {
    const { nativeLanguage } = useAppStore();
    const tr = translations[nativeLanguage] as Record<string, string>;
    const [activeType, setActiveType] = useState(initialType || "all");
    const [activeOrigin, setActiveOrigin] = useState("all");
    const [searchText, setSearchText] = useState("");

    const handleTypeChange = useCallback((type: string) => {
        setActiveType(type);
        onFilterChange({ type, origin: activeOrigin, search: searchText });
    }, [activeOrigin, searchText, onFilterChange]);

    const handleOriginChange = useCallback((origin: string) => {
        setActiveOrigin(origin);
        onFilterChange({ type: activeType, origin, search: searchText });
    }, [activeType, searchText, onFilterChange]);

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        onFilterChange({ type: activeType, origin: activeOrigin, search: text });
    }, [activeType, activeOrigin, onFilterChange]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className={styles.title}>{tr.partsLibTitle || "部品ライブラリ"}</h2>
            </div>

            {/* Type tabs */}
            <div className={styles.tabs}>
                {TYPE_KEYS.map((tk) => (
                    <button
                        key={tk.key}
                        className={`${styles.tab} ${activeType === tk.key ? styles.tabActive : ""}`}
                        onClick={() => handleTypeChange(tk.key)}
                    >
                        {tr[tk.labelKey] || TYPE_FALLBACKS[tk.labelKey]}
                    </button>
                ))}
            </div>

            {/* Origin filter */}
            <div className={styles.originRow}>
                <button
                    className={`${styles.originChip} ${activeOrigin === "all" ? styles.originActive : ""}`}
                    onClick={() => handleOriginChange("all")}
                >
                    All
                </button>
                {origins.map((o) => (
                    <button
                        key={o}
                        className={`${styles.originChip} ${activeOrigin === o ? styles.originActive : ""}`}
                        onClick={() => handleOriginChange(o)}
                    >
                        {o}
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
                    placeholder={tr.partsSearchPlaceholder || "部品を検索..."}
                    className={styles.searchInput}
                />
            </div>

            {/* Parts grid */}
            {isLoading ? (
                <div className={styles.loading}>{tr.commonLoading || "読み込み中..."}</div>
            ) : parts.length === 0 ? (
                <div className={styles.empty}>{tr.partsNoParts || "該当する部品がありません"}</div>
            ) : (
                <div className={styles.grid}>
                    {parts.map((p) => (
                        <button
                            key={p.id}
                            className={styles.card}
                            onClick={() => onPartClick?.(p)}
                        >
                            <div className={styles.cardHeader}>
                                <span
                                    className={styles.cardPart}
                                    style={{ color: TYPE_COLORS[p.part_type] || "#888" }}
                                >
                                    {p.part}
                                </span>
                                <span
                                    className={styles.cardType}
                                    style={{ background: TYPE_COLORS[p.part_type] || "#888" }}
                                >
                                    {p.part_type}
                                </span>
                            </div>
                            <span className={styles.cardMeaning}>{p.meaning}</span>
                            <span className={styles.cardOrigin}>{p.origin_language}</span>
                            {p.examples && p.examples.length > 0 && (
                                <div className={styles.cardExamples}>
                                    {p.examples.slice(0, 3).map((ex, i) => (
                                        <span key={i} className={styles.exampleWord}>{ex}</span>
                                    ))}
                                    {p.examples.length > 3 && (
                                        <span className={styles.exampleMore}>+{p.examples.length - 3}</span>
                                    )}
                                </div>
                            )}
                            {p.learning_hint && (
                                <p className={styles.cardHint}>{p.learning_hint}</p>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
