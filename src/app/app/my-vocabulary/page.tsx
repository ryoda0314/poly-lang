"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-context";
import { getMyVocabulary, getVocabularyTopics, deleteFromVocabulary, VocabWord } from "@/actions/my-vocabulary";
import { getVocabularySets, VocabularySet } from "@/actions/vocabulary-sets";
import { BookMarked, Trash2, Star, ChevronRight, ChevronLeft, Sparkles, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import IPAText from "@/components/IPAText";
import styles from "./page.module.css";

const ITEMS_PER_PAGE = 20;

export default function MyVocabularyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activeLanguageCode } = useAppStore();

    const [words, setWords] = useState<VocabWord[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [selectedSetId, setSelectedSetId] = useState<string>('');
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [sortBy, setSortBy] = useState<'created_at' | 'mastery_level' | 'miss_count'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Modal
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Initialize setId from URL params
    useEffect(() => {
        const setIdParam = searchParams.get('setId');
        if (setIdParam) {
            setSelectedSetId(setIdParam);
        }
    }, [searchParams]);

    const fetchVocabulary = useCallback(async () => {
        setIsLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const result = await getMyVocabulary(activeLanguageCode, {
            limit: ITEMS_PER_PAGE,
            offset,
            sortBy,
            sortOrder,
            topic: selectedTopic || undefined,
            setId: selectedSetId || undefined,
        });

        if (!result.error) {
            setWords(result.words);
            setTotal(result.total);
        }
        setIsLoading(false);
    }, [activeLanguageCode, currentPage, sortBy, sortOrder, selectedTopic, selectedSetId]);

    const fetchTopics = useCallback(async () => {
        const result = await getVocabularyTopics(activeLanguageCode);
        if (!result.error) {
            setTopics(result.topics);
        }
    }, [activeLanguageCode]);

    const fetchVocabularySets = useCallback(async () => {
        const result = await getVocabularySets(activeLanguageCode);
        if (!result.error) {
            setVocabularySets(result.sets);
        }
    }, [activeLanguageCode]);

    useEffect(() => {
        fetchVocabulary();
        fetchTopics();
        fetchVocabularySets();
    }, [fetchVocabulary, fetchTopics, fetchVocabularySets]);

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

    const getFilterLabel = () => {
        const setName = vocabularySets.find(s => s.id === selectedSetId)?.name;
        const sortLabels: Record<string, string> = {
            'created_at-desc': '新しい順',
            'created_at-asc': '古い順',
            'mastery_level-desc': '習得度高',
            'mastery_level-asc': '習得度低',
            'miss_count-desc': '間違い多',
            'miss_count-asc': '間違い少',
        };
        const parts = [];
        if (setName) parts.push(setName);
        parts.push(sortLabels[`${sortBy}-${sortOrder}`] || '新しい順');
        return parts.join(' · ');
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.push('/app/vocabulary-sets')}
                >
                    <ArrowLeft size={20} />
                </button>
                <button
                    className={styles.filterButton}
                    onClick={() => setShowFilterModal(true)}
                >
                    <SlidersHorizontal size={16} />
                    <span>{getFilterLabel()}</span>
                </button>
            </div>

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
                                <div className={styles.wordMain}>
                                    <div className={styles.wordText}>
                                        <div className={styles.wordTarget}>
                                            {word.targetText}
                                            {word.reading && (
                                                <span className={styles.wordReading}> ({word.reading})</span>
                                            )}
                                        </div>
                                        <IPAText as="div" text={word.translation} className={styles.wordTranslation} />
                                    </div>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDelete(word.id)}
                                        title="削除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className={styles.wordFooter}>
                                    <div className={styles.wordMeta}>
                                        {word.sourceTopic && (
                                            <span className={styles.topicBadge}>{word.sourceTopic}</span>
                                        )}
                                        <span className={`${styles.masteryBadge} ${styles[`level${word.masteryLevel}`]}`}>
                                            <Star size={10} />
                                            {getMasteryLabel(word.masteryLevel)}
                                        </span>
                                    </div>
                                    <div className={styles.statsInfo}>
                                        <span>正解: {word.correctCount}</span>
                                        <span>間違い: {word.missCount}</span>
                                    </div>
                                </div>
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

            {/* Filter Modal */}
            {showFilterModal && mounted && createPortal(
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "1rem",
                    }}
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        style={{
                            background: "var(--color-bg)",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "400px",
                            padding: "1rem",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "1rem"
                        }}>
                            <h3 style={{ margin: 0, fontSize: "1rem" }}>フィルター</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    color: "var(--color-fg)"
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{
                                display: "block",
                                fontSize: "0.8rem",
                                color: "var(--color-fg-muted)",
                                marginBottom: "0.5rem"
                            }}>
                                並び順
                            </label>
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                                    setSortBy(newSortBy);
                                    setSortOrder(newSortOrder);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "8px",
                                    background: "var(--color-surface)",
                                    color: "var(--color-fg)",
                                    fontSize: "0.9rem"
                                }}
                            >
                                <option value="created_at-desc">新しい順</option>
                                <option value="created_at-asc">古い順</option>
                                <option value="mastery_level-desc">習得度 高い順</option>
                                <option value="mastery_level-asc">習得度 低い順</option>
                                <option value="miss_count-desc">間違い 多い順</option>
                                <option value="miss_count-asc">間違い 少ない順</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setShowFilterModal(false)}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "var(--color-accent)",
                                border: "none",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                        >
                            完了
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
