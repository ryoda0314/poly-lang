"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-context";
import { getMyVocabulary, getVocabularyTopics, deleteFromVocabulary, VocabWord } from "@/actions/my-vocabulary";
import { BookMarked, Trash2, Star, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const ITEMS_PER_PAGE = 20;

export default function MyVocabularyPage() {
    const router = useRouter();
    const { activeLanguageCode } = useAppStore();

    const [words, setWords] = useState<VocabWord[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [sortBy, setSortBy] = useState<'created_at' | 'mastery_level' | 'miss_count'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchVocabulary = useCallback(async () => {
        setIsLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const result = await getMyVocabulary(activeLanguageCode, {
            limit: ITEMS_PER_PAGE,
            offset,
            sortBy,
            sortOrder,
            topic: selectedTopic || undefined,
        });

        if (!result.error) {
            let filteredWords = result.words;

            // Client-side search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filteredWords = filteredWords.filter(w =>
                    w.targetText.toLowerCase().includes(query) ||
                    w.translation.toLowerCase().includes(query)
                );
            }

            setWords(filteredWords);
            setTotal(result.total);
        }
        setIsLoading(false);
    }, [activeLanguageCode, currentPage, sortBy, sortOrder, selectedTopic, searchQuery]);

    const fetchTopics = useCallback(async () => {
        const result = await getVocabularyTopics(activeLanguageCode);
        if (!result.error) {
            setTopics(result.topics);
        }
    }, [activeLanguageCode]);

    useEffect(() => {
        fetchVocabulary();
        fetchTopics();
    }, [fetchVocabulary, fetchTopics]);

    const handleDelete = async (wordId: string) => {
        if (!confirm('この単語を削除しますか？')) return;

        const result = await deleteFromVocabulary([wordId]);
        if (result.success) {
            setWords(prev => prev.filter(w => w.id !== wordId));
            setTotal(prev => prev - 1);
        }
    };

    const handleGoToGenerator = () => {
        router.push('/app/vocab-generator');
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const getMasteryLabel = (level: number) => {
        switch (level) {
            case 0: return '未学習';
            case 1: return '初級';
            case 2: return '初中級';
            case 3: return '中級';
            case 4: return '上級';
            case 5: return 'マスター';
            default: return '未学習';
        }
    };

    // Calculate stats
    const masteredCount = words.filter(w => w.masteryLevel >= 4).length;
    const learningCount = words.filter(w => w.masteryLevel > 0 && w.masteryLevel < 4).length;
    const newCount = words.filter(w => w.masteryLevel === 0).length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>My単語帳</h1>
            </div>

            {/* Filters */}
            {total > 0 && (
                <div className={styles.filterBar}>
                    <select
                        className={styles.filterSelect}
                        value={selectedTopic}
                        onChange={(e) => {
                            setSelectedTopic(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">全てのトピック</option>
                        {topics.map((topic) => (
                            <option key={topic} value={topic}>{topic}</option>
                        ))}
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                            setSortBy(newSortBy);
                            setSortOrder(newSortOrder);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="created_at-desc">新しい順</option>
                        <option value="created_at-asc">古い順</option>
                        <option value="mastery_level-desc">習得度 高い順</option>
                        <option value="mastery_level-asc">習得度 低い順</option>
                        <option value="miss_count-desc">間違い 多い順</option>
                        <option value="miss_count-asc">間違い 少ない順</option>
                    </select>

                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="単語を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <p>読み込み中...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && total === 0 && (
                <div className={styles.emptyState}>
                    <BookMarked size={64} className={styles.emptyIcon} />
                    <h2>単語がありません</h2>
                    <p>単語生成機能で単語を作成して、学習しましょう</p>
                    <button className={styles.generateButton} onClick={handleGoToGenerator}>
                        <Sparkles size={20} />
                        単語を生成する
                    </button>
                </div>
            )}

            {/* Word List */}
            {!isLoading && words.length > 0 && (
                <>
                    <div className={styles.wordList}>
                        {words.map((word) => (
                            <div key={word.id} className={styles.wordCard}>
                                <div className={styles.wordContent}>
                                    <div className={styles.wordTarget}>
                                        {word.targetText}
                                        {word.reading && (
                                            <span className={styles.wordReading}> ({word.reading})</span>
                                        )}
                                    </div>
                                    <div className={styles.wordTranslation}>{word.translation}</div>
                                </div>

                                <div className={styles.wordMeta}>
                                    {word.sourceTopic && (
                                        <span className={styles.topicBadge}>{word.sourceTopic}</span>
                                    )}
                                    <span className={`${styles.masteryBadge} ${styles[`level${word.masteryLevel}`]}`}>
                                        <Star size={12} />
                                        {getMasteryLabel(word.masteryLevel)}
                                    </span>
                                </div>

                                <div className={styles.statsInfo}>
                                    <span>正解: {word.correctCount}</span>
                                    <span>間違い: {word.missCount}</span>
                                </div>

                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(word.id)}
                                    title="削除"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageButton}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className={styles.pageInfo}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                className={styles.pageButton}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
