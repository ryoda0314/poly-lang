"use client";

import React, { useEffect, useState } from 'react';
import styles from './DailyActivityPanel.module.css';
import { useAppStore } from '@/store/app-context';
import { translations } from '@/lib/translations';
import { X, Eye, Volume2, Mic, PenTool, Bookmark, BookOpen, Loader2, ArrowRight } from 'lucide-react';

interface DailyActivityPanelProps {
    date: string; // YYYY-MM-DD format
    onClose: () => void;
}

interface ActivityData {
    date: string;
    summary: {
        phraseViews: number;
        audioPlays: number;
        pronunciationChecks: number;
        corrections: number;
        savedPhrases: number;
        memosCreated: number;
        totalXp: number;
    };
    corrections: Array<{
        original: string;
        corrected: string;
        explanation: string;
        occurred_at: string;
    }>;
    memos: Array<{
        id: string;
        token_text: string;
        status: string;
        created_at: string;
        memo: string | null;
    }>;
}

export default function DailyActivityPanel({ date, onClose }: DailyActivityPanelProps) {
    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const [data, setData] = useState<ActivityData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const t: any = translations[nativeLanguage] || translations.ja;

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/daily-activities?date=${date}&lang=${activeLanguageCode}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch daily activities:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [date, activeLanguageCode]);

    // Format date for display
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (nativeLanguage === 'ja') {
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        } else if (nativeLanguage === 'ko') {
            return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
        }
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const hasActivity = data && (
        data.summary.phraseViews > 0 ||
        data.summary.audioPlays > 0 ||
        data.summary.pronunciationChecks > 0 ||
        data.summary.corrections > 0 ||
        data.summary.savedPhrases > 0 ||
        data.summary.memosCreated > 0
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>{formatDate(date)}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loading}>
                            <Loader2 size={24} className={styles.spinner} />
                        </div>
                    ) : !hasActivity ? (
                        <div className={styles.noActivity}>
                            <p>{t.noActivity || "この日は学習していません"}</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className={styles.statsGrid}>
                                {data!.summary.phraseViews > 0 && (
                                    <div className={styles.statItem}>
                                        <Eye size={18} />
                                        <span className={styles.statValue}>{data!.summary.phraseViews}</span>
                                        <span className={styles.statLabel}>{t.phraseViews || "フレーズ閲覧"}</span>
                                    </div>
                                )}
                                {data!.summary.audioPlays > 0 && (
                                    <div className={styles.statItem}>
                                        <Volume2 size={18} />
                                        <span className={styles.statValue}>{data!.summary.audioPlays}</span>
                                        <span className={styles.statLabel}>{t.audioPlays || "音声再生"}</span>
                                    </div>
                                )}
                                {data!.summary.pronunciationChecks > 0 && (
                                    <div className={styles.statItem}>
                                        <Mic size={18} />
                                        <span className={styles.statValue}>{data!.summary.pronunciationChecks}</span>
                                        <span className={styles.statLabel}>{t.pronunciationChecks || "発音チェック"}</span>
                                    </div>
                                )}
                                {data!.summary.corrections > 0 && (
                                    <div className={styles.statItem}>
                                        <PenTool size={18} />
                                        <span className={styles.statValue}>{data!.summary.corrections}</span>
                                        <span className={styles.statLabel}>{t.correctionsCount || "添削"}</span>
                                    </div>
                                )}
                                {data!.summary.savedPhrases > 0 && (
                                    <div className={styles.statItem}>
                                        <Bookmark size={18} />
                                        <span className={styles.statValue}>{data!.summary.savedPhrases}</span>
                                        <span className={styles.statLabel}>{t.savedPhrases || "保存"}</span>
                                    </div>
                                )}
                                {data!.summary.memosCreated > 0 && (
                                    <div className={styles.statItem}>
                                        <BookOpen size={18} />
                                        <span className={styles.statValue}>{data!.summary.memosCreated}</span>
                                        <span className={styles.statLabel}>{t.memosCreated || "単語メモ"}</span>
                                    </div>
                                )}
                            </div>

                            {/* Corrections List */}
                            {data!.corrections.length > 0 && (
                                <div className={styles.section}>
                                    <h4 className={styles.sectionTitle}>{t.correctionHistory || "添削履歴"}</h4>
                                    <div className={styles.correctionsList}>
                                        {data!.corrections.map((c, i) => (
                                            <div key={i} className={styles.correctionItem}>
                                                <div className={styles.correctionTexts}>
                                                    <span className={styles.originalText}>{c.original}</span>
                                                    <ArrowRight size={14} className={styles.arrow} />
                                                    <span className={styles.correctedText}>{c.corrected}</span>
                                                </div>
                                                {c.explanation && (
                                                    <p className={styles.explanation}>{c.explanation}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Memos List */}
                            {data!.memos.length > 0 && (
                                <div className={styles.section}>
                                    <h4 className={styles.sectionTitle}>{t.savedWords || "保存した単語"}</h4>
                                    <div className={styles.memosList}>
                                        {data!.memos.map((m) => (
                                            <div key={m.id} className={styles.memoItem}>
                                                <span className={styles.memoToken}>{m.token_text}</span>
                                                {m.memo && <span className={styles.memoNote}>{m.memo}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
