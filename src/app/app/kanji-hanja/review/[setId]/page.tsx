"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { useAppStore } from "@/store/app-context";
import { recordReview, startStudySession, endStudySession } from "@/actions/learning-stats";
import KanjiHanjaCard from "@/components/KanjiHanjaCard";
import { Check, X, AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import styles from "./page.module.css";

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const setId = params.setId as string;
    const { user } = useAppStore();
    const { currentSetPhrases, fetchSetPhrases, phraseSets } = usePhraseSetStore();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [stats, setStats] = useState({
        reviewed: 0,
        correct: 0,
        incorrect: 0
    });
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentSet = phraseSets.find(s => s.id === setId);

    useEffect(() => {
        if (setId && user) {
            fetchSetPhrases(setId).then(() => {
                setIsLoading(false);
            });

            startStudySession(setId, 'ko').then(result => {
                if (result.success) {
                    setSessionId(result.sessionId!);
                }
            });
        }
    }, [setId, user]);

    const currentItem = currentSetPhrases[currentIndex];

    const handleRating = async (quality: number) => {
        if (!currentItem) return;

        // Record review with SRS algorithm
        await recordReview(currentItem.id, quality);

        const isCorrect = quality >= 2; // 2=good, 3=easy
        setStats(prev => ({
            reviewed: prev.reviewed + 1,
            correct: prev.correct + (isCorrect ? 1 : 0),
            incorrect: prev.incorrect + (isCorrect ? 0 : 1)
        }));

        // Move to next card or complete
        if (currentIndex < currentSetPhrases.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Session complete
            if (sessionId) {
                await endStudySession(sessionId, {
                    itemsReviewed: stats.reviewed + 1,
                    itemsCorrect: stats.correct + (isCorrect ? 1 : 0),
                    itemsIncorrect: stats.incorrect + (isCorrect ? 0 : 1),
                    newItemsLearned: 0,
                    itemsMastered: 0
                });
            }
            setIsComplete(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setStats({ reviewed: 0, correct: 0, incorrect: 0 });
        setIsComplete(false);

        // Start new session
        if (user) {
            startStudySession(setId, 'ko').then(result => {
                if (result.success) {
                    setSessionId(result.sessionId!);
                }
            });
        }
    };

    const handleBackToDashboard = () => {
        router.push('/app/kanji-hanja');
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    if (currentSetPhrases.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <h2>まだ学習する漢字がありません</h2>
                    <p>セットに漢字を追加してください</p>
                    <button onClick={handleBackToDashboard} className={styles.backBtn}>
                        <ArrowLeft size={16} />
                        戻る
                    </button>
                </div>
            </div>
        );
    }

    if (isComplete) {
        const accuracy = stats.reviewed > 0
            ? Math.round((stats.correct / stats.reviewed) * 100)
            : 0;

        return (
            <div className={styles.container}>
                <div className={styles.completionCard}>
                    <div className={styles.completionIcon}>
                        <Check size={48} />
                    </div>
                    <h2>復習完了！</h2>
                    <div className={styles.completionStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.reviewed}</span>
                            <span className={styles.statLabel}>復習した項目</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{accuracy}%</span>
                            <span className={styles.statLabel}>正解率</span>
                        </div>
                    </div>
                    <div className={styles.completionActions}>
                        <button onClick={handleRestart} className={styles.restartBtn}>
                            <RotateCcw size={16} />
                            もう一度
                        </button>
                        <button onClick={handleBackToDashboard} className={styles.doneBtn}>
                            完了
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={handleBackToDashboard} className={styles.backIconBtn}>
                    <ArrowLeft size={20} />
                </button>
                <div className={styles.headerInfo}>
                    <h1 className={styles.setName}>{currentSet?.name || '漢字復習'}</h1>
                    <div className={styles.progress}>
                        {currentIndex + 1} / {currentSetPhrases.length}
                    </div>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width: `${((currentIndex + 1) / currentSetPhrases.length) * 100}%`
                        }}
                    />
                </div>
            </header>

            <div className={styles.reviewContent}>
                {currentItem && (
                    <KanjiHanjaCard
                        kanji={(currentItem as any).kanji_text || currentItem.target_text}
                        hanja={(currentItem as any).hanja_text || ''}
                        koreanReading={(currentItem as any).korean_reading || ''}
                        hanjaMeaning={(currentItem as any).hanja_meaning || ''}
                        wordType={(currentItem as any).word_type || 'compound'}
                        usageExamples={[]}
                        onReveal={() => {}}
                    />
                )}

                <div className={styles.ratingButtons}>
                    <button
                        onClick={() => handleRating(0)}
                        className={`${styles.ratingBtn} ${styles.again}`}
                    >
                        <X size={20} />
                        <span>もう一度</span>
                    </button>
                    <button
                        onClick={() => handleRating(1)}
                        className={`${styles.ratingBtn} ${styles.hard}`}
                    >
                        <AlertCircle size={20} />
                        <span>難しい</span>
                    </button>
                    <button
                        onClick={() => handleRating(2)}
                        className={`${styles.ratingBtn} ${styles.good}`}
                    >
                        <Check size={20} />
                        <span>普通</span>
                    </button>
                    <button
                        onClick={() => handleRating(3)}
                        className={`${styles.ratingBtn} ${styles.easy}`}
                    >
                        <Check size={20} />
                        <span>簡単</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
