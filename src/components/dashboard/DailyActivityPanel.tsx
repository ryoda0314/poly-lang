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

interface LearningEvent {
    id: string;
    event_type: string;
    occurred_at: string;
    xp_delta: number;
    meta: {
        phrase_id?: string;
        phrase_text?: string;
        original?: string;
        corrected?: string;
        explanation?: string;
        [key: string]: any;
    } | null;
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
    events: LearningEvent[];
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

type ActivityCategory = 'phraseViews' | 'audioPlays' | 'pronunciationChecks' | 'corrections' | 'savedPhrases' | 'memos' | null;

export default function DailyActivityPanel({ date, onClose }: DailyActivityPanelProps) {
    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const [data, setData] = useState<ActivityData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>(null);

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
                                    <button
                                        className={`${styles.statItem} ${styles.clickable} ${selectedCategory === 'phraseViews' ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === 'phraseViews' ? null : 'phraseViews')}
                                    >
                                        <Eye size={18} />
                                        <span className={styles.statValue}>{data!.summary.phraseViews}</span>
                                        <span className={styles.statLabel}>{t.phraseViews || "フレーズ閲覧"}</span>
                                    </button>
                                )}
                                {data!.summary.audioPlays > 0 && (
                                    <button
                                        className={`${styles.statItem} ${styles.clickable} ${selectedCategory === 'audioPlays' ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === 'audioPlays' ? null : 'audioPlays')}
                                    >
                                        <Volume2 size={18} />
                                        <span className={styles.statValue}>{data!.summary.audioPlays}</span>
                                        <span className={styles.statLabel}>{t.audioPlays || "音声再生"}</span>
                                    </button>
                                )}
                                {data!.summary.pronunciationChecks > 0 && (
                                    <button
                                        className={`${styles.statItem} ${styles.clickable} ${selectedCategory === 'pronunciationChecks' ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === 'pronunciationChecks' ? null : 'pronunciationChecks')}
                                    >
                                        <Mic size={18} />
                                        <span className={styles.statValue}>{data!.summary.pronunciationChecks}</span>
                                        <span className={styles.statLabel}>{t.pronunciationChecks || "発音チェック"}</span>
                                    </button>
                                )}
                                {data!.summary.corrections > 0 && (
                                    <button
                                        className={`${styles.statItem} ${styles.clickable} ${selectedCategory === 'corrections' ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === 'corrections' ? null : 'corrections')}
                                    >
                                        <PenTool size={18} />
                                        <span className={styles.statValue}>{data!.summary.corrections}</span>
                                        <span className={styles.statLabel}>{t.correctionsCount || "添削"}</span>
                                    </button>
                                )}
                                {data!.summary.savedPhrases > 0 && (
                                    <button
                                        className={`${styles.statItem} ${styles.clickable} ${selectedCategory === 'savedPhrases' ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === 'savedPhrases' ? null : 'savedPhrases')}
                                    >
                                        <Bookmark size={18} />
                                        <span className={styles.statValue}>{data!.summary.savedPhrases}</span>
                                        <span className={styles.statLabel}>{t.savedPhrases || "保存"}</span>
                                    </button>
                                )}
                                {data!.summary.memosCreated > 0 && (
                                    <button
                                        className={`${styles.statItem} ${styles.clickable} ${selectedCategory === 'memos' ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === 'memos' ? null : 'memos')}
                                    >
                                        <BookOpen size={18} />
                                        <span className={styles.statValue}>{data!.summary.memosCreated}</span>
                                        <span className={styles.statLabel}>{t.memosCreated || "単語メモ"}</span>
                                    </button>
                                )}
                            </div>

                            {/* Category Detail Section */}
                            {selectedCategory && (
                                <div className={styles.detailSection}>
                                    {/* Phrase Views Detail */}
                                    {selectedCategory === 'phraseViews' && (() => {
                                        const items = data!.events.filter(e => e.event_type === 'phrase_view');
                                        return (
                                            <>
                                                <h4 className={styles.sectionTitle}>{t.phraseViews || "フレーズ閲覧"}</h4>
                                                <div className={styles.eventList}>
                                                    {items.length > 0 ? items.map((e, i) => (
                                                        <div key={i} className={styles.eventItem}>
                                                            <Eye size={14} className={styles.eventIcon} />
                                                            <span className={styles.eventText}>
                                                                {e.meta?.phrase_text || t.phraseViewed || "フレーズを閲覧"}
                                                            </span>
                                                            <span className={styles.eventTime}>
                                                                {new Date(e.occurred_at).toLocaleTimeString(nativeLanguage === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <p className={styles.emptyMessage}>{t.noDetailData || "詳細データがありません"}</p>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* Audio Plays Detail */}
                                    {selectedCategory === 'audioPlays' && (() => {
                                        const items = data!.events.filter(e => e.event_type === 'audio_play');
                                        return (
                                            <>
                                                <h4 className={styles.sectionTitle}>{t.audioPlays || "音声再生"}</h4>
                                                <div className={styles.eventList}>
                                                    {items.length > 0 ? items.map((e, i) => (
                                                        <div key={i} className={styles.eventItem}>
                                                            <Volume2 size={14} className={styles.eventIcon} />
                                                            <span className={styles.eventText}>
                                                                {e.meta?.phrase_text || t.audioPlayed || "音声を再生"}
                                                            </span>
                                                            <span className={styles.eventTime}>
                                                                {new Date(e.occurred_at).toLocaleTimeString(nativeLanguage === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <p className={styles.emptyMessage}>{t.noDetailData || "詳細データがありません"}</p>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* Pronunciation Checks Detail */}
                                    {selectedCategory === 'pronunciationChecks' && (() => {
                                        const items = data!.events.filter(e => e.event_type === 'pronunciation_check');
                                        return (
                                            <>
                                                <h4 className={styles.sectionTitle}>{t.pronunciationChecks || "発音チェック"}</h4>
                                                <div className={styles.eventList}>
                                                    {items.length > 0 ? items.map((e, i) => (
                                                        <div key={i} className={styles.eventItem}>
                                                            <Mic size={14} className={styles.eventIcon} />
                                                            <span className={styles.eventText}>
                                                                {e.meta?.phrase_text || t.pronunciationChecked || "発音をチェック"}
                                                            </span>
                                                            <span className={styles.eventTime}>
                                                                {new Date(e.occurred_at).toLocaleTimeString(nativeLanguage === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <p className={styles.emptyMessage}>{t.noDetailData || "詳細データがありません"}</p>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* Corrections Detail */}
                                    {selectedCategory === 'corrections' && (
                                        <>
                                            <h4 className={styles.sectionTitle}>{t.correctionHistory || "添削履歴"}</h4>
                                            <div className={styles.correctionsList}>
                                                {data!.corrections.length > 0 ? (
                                                    data!.corrections.map((c, i) => (
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
                                                    ))
                                                ) : (
                                                    <p className={styles.emptyMessage}>{t.noCorrectionDetails || "詳細データがありません"}</p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Saved Phrases Detail */}
                                    {selectedCategory === 'savedPhrases' && (() => {
                                        const items = data!.events.filter(e => e.event_type === 'saved_phrase');
                                        return (
                                            <>
                                                <h4 className={styles.sectionTitle}>{t.savedPhrases || "保存したフレーズ"}</h4>
                                                <div className={styles.eventList}>
                                                    {items.length > 0 ? items.map((e, i) => (
                                                        <div key={i} className={styles.eventItem}>
                                                            <Bookmark size={14} className={styles.eventIcon} />
                                                            <span className={styles.eventText}>
                                                                {e.meta?.phrase_text || t.phraseSaved || "フレーズを保存"}
                                                            </span>
                                                            <span className={styles.eventTime}>
                                                                {new Date(e.occurred_at).toLocaleTimeString(nativeLanguage === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <p className={styles.emptyMessage}>{t.noDetailData || "詳細データがありません"}</p>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* Memos Detail */}
                                    {selectedCategory === 'memos' && (
                                        <>
                                            <h4 className={styles.sectionTitle}>{t.savedWords || "保存した単語"}</h4>
                                            <div className={styles.memosList}>
                                                {data!.memos.length > 0 ? data!.memos.map((m) => (
                                                    <div key={m.id} className={styles.memoItem}>
                                                        <span className={styles.memoToken}>{m.token_text}</span>
                                                        {m.memo && <span className={styles.memoNote}>{m.memo}</span>}
                                                    </div>
                                                )) : (
                                                    <p className={styles.emptyMessage}>{t.noDetailData || "詳細データがありません"}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
