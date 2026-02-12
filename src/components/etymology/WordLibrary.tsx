"use client";

import { useState, useCallback } from "react";
import { Search, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { LibraryEntry, StockedWord } from "@/actions/etymology";
import styles from "./WordLibrary.module.css";

interface Props {
    activeTab: 'processed' | 'stock';
    entries: LibraryEntry[];
    stockEntries: StockedWord[];
    totalCount: number;
    stockCount: number;
    isLoading: boolean;
    onBack: () => void;
    onTabChange: (tab: 'processed' | 'stock') => void;
    onWordClick: (word: string, targetLang: string) => void;
    onFilterChange: (filter: { search?: string }) => void;
    onStockFilterChange: (filter: { search?: string; letter?: string; page?: number }) => void;
    stockPage: number;
}

export default function WordLibrary({
    activeTab, entries, stockEntries, totalCount, stockCount,
    isLoading, stockPage,
    onBack, onTabChange, onWordClick, onFilterChange, onStockFilterChange,
}: Props) {
    const [searchText, setSearchText] = useState("");
    const [activeLetter, setActiveLetter] = useState<string | null>(null);

    const currentCount = activeTab === 'stock' ? stockCount : totalCount;

    const handleTabChange = useCallback((tab: 'processed' | 'stock') => {
        setSearchText("");
        setActiveLetter(null);
        onTabChange(tab);
    }, [onTabChange]);

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        if (activeTab === 'stock') {
            onStockFilterChange({ search: text, letter: activeLetter ?? undefined, page: 0 });
        } else {
            onFilterChange({ search: text });
        }
    }, [activeTab, activeLetter, onFilterChange, onStockFilterChange]);

    const handleLetterChange = useCallback((letter: string | null) => {
        setActiveLetter(letter);
        onStockFilterChange({ search: searchText, letter: letter ?? undefined, page: 0 });
    }, [searchText, onStockFilterChange]);

    const ITEMS_PER_PAGE = 50;
    const totalPages = Math.ceil(stockCount / ITEMS_PER_PAGE);

    const handlePageChange = useCallback((page: number) => {
        onStockFilterChange({ search: searchText, letter: activeLetter ?? undefined, page });
    }, [searchText, activeLetter, onStockFilterChange]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className={styles.title}>単語ライブラリ</h2>
                <span className={styles.count}>{currentCount.toLocaleString()}件</span>
            </div>

            {/* Tab switcher */}
            <div className={styles.tabRow}>
                <button
                    className={`${styles.tab} ${activeTab === 'processed' ? styles.tabActive : ''}`}
                    onClick={() => handleTabChange('processed')}
                >
                    処理済み
                    <span className={styles.tabCount}>{totalCount}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'stock' ? styles.tabActive : ''}`}
                    onClick={() => handleTabChange('stock')}
                >
                    ストック
                    <span className={styles.tabCount}>{stockCount.toLocaleString()}</span>
                </button>
            </div>

            {/* Alphabet filter (stock tab only) */}
            {activeTab === 'stock' && (
                <div className={styles.alphabetBar}>
                    <button
                        className={`${styles.letterBtn} ${!activeLetter ? styles.letterActive : ""}`}
                        onClick={() => handleLetterChange(null)}
                    >
                        ALL
                    </button>
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => (
                        <button
                            key={ch}
                            className={`${styles.letterBtn} ${activeLetter === ch ? styles.letterActive : ""}`}
                            onClick={() => handleLetterChange(activeLetter === ch ? null : ch)}
                        >
                            {ch}
                        </button>
                    ))}
                </div>
            )}

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
            ) : activeTab === 'processed' ? (
                entries.length === 0 ? (
                    <div className={styles.empty}>該当する単語がありません</div>
                ) : (
                    <div className={styles.list}>
                        {entries.map((e) => (
                            <button
                                key={`${e.word}:${e.target_language}`}
                                className={styles.card}
                                onClick={() => onWordClick(e.word, e.target_language)}
                            >
                                <span className={styles.cardWord}>{e.word}</span>
                                {e.definition && (
                                    <span className={styles.cardDef}>{e.definition}</span>
                                )}
                                {e.origin_language && (
                                    <span className={styles.cardOrigin}>{e.origin_language}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )
            ) : (
                stockEntries.length === 0 ? (
                    <div className={styles.empty}>該当する単語がありません</div>
                ) : (
                    <>
                        <div className={styles.list}>
                            {stockEntries.map((e) => (
                                <button
                                    key={`stock:${e.word}:${e.target_language}`}
                                    className={styles.card}
                                    onClick={() => onWordClick(e.word, e.target_language)}
                                >
                                    <span className={styles.cardWord}>{e.word}</span>
                                    <span className={styles.cardOrigin}>Wikitext取得済み・未処理</span>
                                </button>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={stockPage === 0}
                                    onClick={() => handlePageChange(stockPage - 1)}
                                >
                                    <ChevronLeft size={16} />
                                    前へ
                                </button>
                                <span className={styles.pageInfo}>
                                    {stockPage + 1} / {totalPages.toLocaleString()}
                                </span>
                                <button
                                    className={styles.pageBtn}
                                    disabled={stockPage >= totalPages - 1}
                                    onClick={() => handlePageChange(stockPage + 1)}
                                >
                                    次へ
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    );
}
