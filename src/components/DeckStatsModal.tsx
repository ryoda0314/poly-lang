"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    TrendingUp,
    Target,
    Clock,
    Flame,
    BookOpen,
    CheckCircle2,
    RefreshCw,
    GraduationCap,
    BarChart3,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
import {
    getItemReviews,
    getPhraseSetProgress,
    type ItemReview,
    type PhraseSetProgress,
} from "@/actions/learning-stats";
import styles from "./DeckStatsModal.module.css";
import clsx from "clsx";

interface DeckStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    deckId: string;
    deckName: string;
    deckColor: string;
    totalCards: number;
    onStartReview?: (mode: "all" | "due" | "weak") => void;
}

type CardStatus = "new" | "learning" | "reviewing" | "mastered";

interface CardWithReview {
    id: string;
    target_text: string;
    translation: string;
    review?: ItemReview;
}

export function DeckStatsModal({
    isOpen,
    onClose,
    deckId,
    deckName,
    deckColor,
    totalCards,
    onStartReview,
}: DeckStatsModalProps) {
    const [progress, setProgress] = useState<PhraseSetProgress | null>(null);
    const [reviews, setReviews] = useState<ItemReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "cards">("overview");
    const [cardFilter, setCardFilter] = useState<CardStatus | "all" | "due">("all");

    // Load data
    useEffect(() => {
        if (!isOpen || !deckId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [progressData, reviewsData] = await Promise.all([
                    getPhraseSetProgress(deckId),
                    getItemReviews(deckId),
                ]);
                setProgress(progressData);
                setReviews(reviewsData);
            } catch (error) {
                console.error("Failed to load deck stats:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, deckId]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!progress) {
            return {
                newCount: totalCards,
                learningCount: 0,
                reviewingCount: 0,
                masteredCount: 0,
                dueCount: 0,
                totalReviews: 0,
                accuracy: 0,
                avgStrength: 0,
            };
        }

        const reviewedCount = progress.learning_count + progress.reviewing_count + progress.mastered_count;
        const newCount = totalCards - reviewedCount;

        return {
            newCount: Math.max(0, newCount),
            learningCount: progress.learning_count,
            reviewingCount: progress.reviewing_count,
            masteredCount: progress.mastered_count,
            dueCount: progress.due_count,
            totalReviews: progress.total_reviews,
            accuracy: progress.total_reviews > 0
                ? Math.round((progress.total_correct / progress.total_reviews) * 100)
                : 0,
            avgStrength: progress.avg_strength,
        };
    }, [progress, totalCards]);

    // Progress percentage for ring
    const progressPercent = useMemo(() => {
        if (totalCards === 0) return 0;
        return Math.round((stats.masteredCount / totalCards) * 100);
    }, [stats.masteredCount, totalCards]);

    // Status colors
    const statusColors: Record<CardStatus, string> = {
        new: "#9CA3AF",
        learning: "#F59E0B",
        reviewing: "#3B82F6",
        mastered: "#10B981",
    };

    const statusLabels: Record<CardStatus, string> = {
        new: "新規",
        learning: "学習中",
        reviewing: "復習中",
        mastered: "習得済み",
    };

    const statusIcons: Record<CardStatus, React.ReactNode> = {
        new: <BookOpen size={16} />,
        learning: <RefreshCw size={16} />,
        reviewing: <RotateCcw size={16} />,
        mastered: <GraduationCap size={16} />,
    };

    // Get review by item ID
    const getReviewByItemId = (itemId: string) => {
        return reviews.find(r => r.phrase_set_item_id === itemId);
    };

    // Filter function for cards tab
    const getFilteredCount = (filter: CardStatus | "all" | "due") => {
        if (filter === "all") return totalCards;
        if (filter === "due") return stats.dueCount;
        if (filter === "new") return stats.newCount;
        if (filter === "learning") return stats.learningCount;
        if (filter === "reviewing") return stats.reviewingCount;
        if (filter === "mastered") return stats.masteredCount;
        return 0;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div
                                className={styles.deckColorDot}
                                style={{ background: deckColor }}
                            />
                            <h2>{deckName}</h2>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={clsx(styles.tab, activeTab === "overview" && styles.tabActive)}
                            onClick={() => setActiveTab("overview")}
                        >
                            <BarChart3 size={16} />
                            概要
                        </button>
                        <button
                            className={clsx(styles.tab, activeTab === "cards" && styles.tabActive)}
                            onClick={() => setActiveTab("cards")}
                        >
                            <BookOpen size={16} />
                            カード ({totalCards})
                        </button>
                    </div>

                    {/* Content */}
                    <div className={styles.content}>
                        {loading ? (
                            <div className={styles.loading}>読み込み中...</div>
                        ) : activeTab === "overview" ? (
                            <div className={styles.overviewTab}>
                                {/* Progress Ring */}
                                <div className={styles.progressSection}>
                                    <div className={styles.progressRingWrapper}>
                                        <svg className={styles.progressRing} viewBox="0 0 100 100">
                                            {/* Background circle */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="none"
                                                stroke="var(--color-border)"
                                                strokeWidth="8"
                                            />
                                            {/* Progress circle */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="none"
                                                stroke={deckColor}
                                                strokeWidth="8"
                                                strokeDasharray={`${progressPercent * 2.64} 264`}
                                                strokeLinecap="round"
                                                transform="rotate(-90 50 50)"
                                            />
                                        </svg>
                                        <div className={styles.progressRingCenter}>
                                            <span className={styles.progressPercent}>{progressPercent}%</span>
                                            <span className={styles.progressLabel}>習得率</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Breakdown */}
                                <div className={styles.statusBreakdown}>
                                    <h3>学習ステータス</h3>
                                    <div className={styles.statusGrid}>
                                        {(["new", "learning", "reviewing", "mastered"] as CardStatus[]).map((status) => {
                                            const count = status === "new" ? stats.newCount
                                                : status === "learning" ? stats.learningCount
                                                : status === "reviewing" ? stats.reviewingCount
                                                : stats.masteredCount;
                                            const percent = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;

                                            return (
                                                <div key={status} className={styles.statusItem}>
                                                    <div className={styles.statusHeader}>
                                                        <span
                                                            className={styles.statusIcon}
                                                            style={{ color: statusColors[status] }}
                                                        >
                                                            {statusIcons[status]}
                                                        </span>
                                                        <span className={styles.statusName}>{statusLabels[status]}</span>
                                                    </div>
                                                    <div className={styles.statusCount}>{count}</div>
                                                    <div className={styles.statusBar}>
                                                        <div
                                                            className={styles.statusBarFill}
                                                            style={{
                                                                width: `${percent}%`,
                                                                background: statusColors[status],
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className={styles.statsSection}>
                                    <h3>統計</h3>
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statCard}>
                                            <TrendingUp size={20} className={styles.statIcon} />
                                            <div className={styles.statValue}>{stats.totalReviews}</div>
                                            <div className={styles.statLabel}>総復習回数</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <Target size={20} className={styles.statIcon} />
                                            <div className={styles.statValue}>{stats.accuracy}%</div>
                                            <div className={styles.statLabel}>正答率</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <Clock size={20} className={styles.statIcon} />
                                            <div className={styles.statValue}>{stats.dueCount}</div>
                                            <div className={styles.statLabel}>復習待ち</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <Flame size={20} className={styles.statIcon} />
                                            <div className={styles.statValue}>{stats.avgStrength.toFixed(1)}</div>
                                            <div className={styles.statLabel}>平均強度</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                {onStartReview && (
                                    <div className={styles.actionsSection}>
                                        <h3>学習を始める</h3>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => onStartReview("all")}
                                            >
                                                <BookOpen size={18} />
                                                <span>全てのカード</span>
                                                <ChevronRight size={16} />
                                            </button>
                                            {stats.dueCount > 0 && (
                                                <button
                                                    className={clsx(styles.actionBtn, styles.actionBtnPrimary)}
                                                    onClick={() => onStartReview("due")}
                                                >
                                                    <Clock size={18} />
                                                    <span>復習待ち ({stats.dueCount})</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            )}
                                            {stats.learningCount > 0 && (
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => onStartReview("weak")}
                                                >
                                                    <RefreshCw size={18} />
                                                    <span>弱いカード</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.cardsTab}>
                                {/* Card Filters */}
                                <div className={styles.cardFilters}>
                                    {(["all", "due", "new", "learning", "reviewing", "mastered"] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            className={clsx(
                                                styles.filterBtn,
                                                cardFilter === filter && styles.filterBtnActive
                                            )}
                                            onClick={() => setCardFilter(filter)}
                                        >
                                            {filter === "all" ? "全て" : filter === "due" ? "復習待ち" : statusLabels[filter as CardStatus]}
                                            <span className={styles.filterCount}>
                                                {getFilteredCount(filter)}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Cards List */}
                                <div className={styles.cardsList}>
                                    {reviews.length === 0 && cardFilter !== "new" && cardFilter !== "all" ? (
                                        <div className={styles.emptyState}>
                                            <BookOpen size={32} />
                                            <p>まだ学習記録がありません</p>
                                        </div>
                                    ) : (
                                        reviews
                                            .filter((review) => {
                                                if (cardFilter === "all") return true;
                                                if (cardFilter === "due") {
                                                    return review.next_review_at && new Date(review.next_review_at) <= new Date();
                                                }
                                                return review.status === cardFilter;
                                            })
                                            .map((review) => (
                                                <div key={review.id} className={styles.cardItem}>
                                                    <div
                                                        className={styles.cardStatusDot}
                                                        style={{ background: statusColors[review.status] }}
                                                    />
                                                    <div className={styles.cardInfo}>
                                                        <div className={styles.cardItemId}>
                                                            ID: {review.phrase_set_item_id.slice(0, 8)}...
                                                        </div>
                                                        <div className={styles.cardMeta}>
                                                            <span>強度: {review.strength}</span>
                                                            <span>復習: {review.review_count}回</span>
                                                            <span>正答: {review.correct_count}回</span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.cardStatus}>
                                                        {statusLabels[review.status]}
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
