"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { useAppStore } from "@/store/app-context";
import { useVocabGeneratorStore, LearningWord } from "@/store/vocab-generator-store";
import { SessionResult } from "@/actions/generate-vocabulary";
import { ChevronLeft, Play, Heart, X, RotateCcw, Check, BookMarked, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const WORD_COUNT_OPTIONS = [5, 10, 15, 20];

const SUGGESTED_TOPICS = [
    "野菜", "果物", "動物", "色", "数字", "家族", "食べ物", "天気"
];

export default function VocabGeneratorPage() {
    const router = useRouter();
    const { activeLanguageCode, nativeLanguage } = useAppStore();
    const {
        viewState,
        topic,
        wordCount,
        isGenerating,
        generatedWords,
        error,
        currentIndex,
        knownWords,
        reviewWords,
        setTopic,
        setWordCount,
        generateVocabulary,
        startLearning,
        recordSwipe,
        retryMissedWords,
        finishSession,
        saveWords,
        reset,
    } = useVocabGeneratorStore();

    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
    const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleGenerate = async () => {
        await generateVocabulary(activeLanguageCode, nativeLanguage);
    };

    const handleFinish = useCallback(async () => {
        const results = await finishSession();
        setSessionResults(results);
        // Pre-select all missed words
        const missedIds = results.filter(r => !r.correct).map(r => r.wordId);
        setSelectedWords(new Set(missedIds));
    }, [finishSession]);

    // Auto-transition to results when all cards are swiped
    const hasFinishedRef = useRef(false);
    useEffect(() => {
        if (viewState === 'learning' && currentIndex >= generatedWords.length && generatedWords.length > 0 && !hasFinishedRef.current) {
            hasFinishedRef.current = true;
            // Small delay for the last card animation to complete
            const timer = setTimeout(() => {
                handleFinish();
            }, 300);
            return () => clearTimeout(timer);
        }
        // Reset ref when starting new learning session
        if (viewState === 'preview' || viewState === 'input') {
            hasFinishedRef.current = false;
        }
    }, [viewState, currentIndex, generatedWords.length, handleFinish]);

    const toggleWordSelection = (wordId: string) => {
        const newSelected = new Set(selectedWords);
        if (newSelected.has(wordId)) {
            newSelected.delete(wordId);
        } else {
            newSelected.add(wordId);
        }
        setSelectedWords(newSelected);
    };

    const selectAll = () => {
        setSelectedWords(new Set(sessionResults.map(r => r.wordId)));
    };

    const handleSave = async () => {
        if (selectedWords.size === 0) return;

        setIsSaving(true);
        const result = await saveWords(Array.from(selectedWords), activeLanguageCode);
        setIsSaving(false);

        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const handleBack = () => {
        if (viewState === 'input') {
            router.back();
        } else {
            reset();
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={styles.headerTitle}>単語生成</h1>
            </div>

            {/* Input View */}
            {viewState === 'input' && (
                <div className={styles.inputSection}>
                    {/* Prompt Input */}
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            className={styles.topicInput}
                            placeholder="学習したい単語を入力（例：野菜、日常会話でよく使う動詞）"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    {/* Quick Topics */}
                    <div className={styles.topicChips}>
                        {SUGGESTED_TOPICS.map((t) => (
                            <button
                                key={t}
                                className={`${styles.topicChip} ${topic === t ? styles.active : ''}`}
                                onClick={() => setTopic(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Word Count */}
                    <div className={styles.countSection}>
                        <span className={styles.countLabel}>単語数</span>
                        <div className={styles.wordCountSelector}>
                            {WORD_COUNT_OPTIONS.map((count) => (
                                <button
                                    key={count}
                                    className={`${styles.countButton} ${wordCount === count ? styles.active : ''}`}
                                    onClick={() => setWordCount(count)}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        className={styles.generateButton}
                        onClick={handleGenerate}
                        disabled={!topic.trim()}
                    >
                        生成
                    </button>

                    {error && (
                        <div className={styles.errorMessage}>{error}</div>
                    )}
                </div>
            )}

            {/* Generating View */}
            {viewState === 'generating' && (
                <div className={styles.generatingSection}>
                    <div className={styles.spinner} />
                    <p>「{topic}」の単語を生成中...</p>
                </div>
            )}

            {/* Preview View */}
            {viewState === 'preview' && (
                <div className={styles.previewSection}>
                    <div className={styles.previewHeader}>
                        <h2>生成された単語</h2>
                        <span className={styles.wordCount}>{generatedWords.length}語</span>
                    </div>

                    <div className={styles.wordList}>
                        {generatedWords.map((word) => (
                            <div key={word.id} className={styles.wordItem}>
                                <div>
                                    <div className={styles.wordTarget}>{word.targetText}</div>
                                    {word.reading && (
                                        <div className={styles.wordReading}>{word.reading}</div>
                                    )}
                                </div>
                                <div className={styles.wordTranslation}>{word.translation}</div>
                            </div>
                        ))}
                    </div>

                    <button className={styles.startButton} onClick={startLearning}>
                        <Play size={20} />
                        学習を開始
                    </button>
                </div>
            )}

            {/* Learning View */}
            {viewState === 'learning' && (
                <div className={styles.learningSection}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${((currentIndex) / generatedWords.length) * 100}%` }}
                        />
                    </div>

                    <div className={styles.cardArea}>
                        <AnimatePresence mode="popLayout">
                            {currentIndex < generatedWords.length && (
                                <SwipeCard
                                    key={generatedWords[currentIndex].id}
                                    word={generatedWords[currentIndex]}
                                    onSwipe={recordSwipe}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <div className={styles.swipeHints}>
                        <span><ArrowLeft size={16} /> わからない</span>
                        <span>わかる <ArrowRight size={16} /></span>
                    </div>

                    {currentIndex >= generatedWords.length && (
                        <button className={styles.startButton} onClick={handleFinish}>
                            結果を見る
                        </button>
                    )}
                </div>
            )}

            {/* Results View */}
            {viewState === 'results' && (
                <div className={styles.resultsSection}>
                    <div className={styles.resultsListHeader}>
                        <h3>単語リスト</h3>
                        <button className={styles.selectAllButton} onClick={selectAll}>
                            全て選択
                        </button>
                    </div>

                    <div className={styles.resultsList}>
                        {sessionResults.map((result) => (
                            <div
                                key={result.wordId}
                                className={`${styles.resultItem} ${result.correct ? styles.correctItem : styles.incorrectItem} ${selectedWords.has(result.wordId) ? styles.selected : ''}`}
                                onClick={() => toggleWordSelection(result.wordId)}
                            >
                                <div className={styles.resultCheckbox}>
                                    {selectedWords.has(result.wordId) && <Check size={14} />}
                                </div>
                                <div className={styles.resultContent}>
                                    <div className={styles.resultWord}>{result.targetText}</div>
                                    <div className={styles.resultTranslation}>{result.translation}</div>
                                </div>
                                <div className={`${styles.resultStatus} ${result.correct ? styles.correct : styles.incorrect}`}>
                                    {result.correct ? <Heart size={16} /> : <X size={16} />}
                                    {result.missCount > 0 && (
                                        <span className={styles.missCount}>{result.missCount}回間違い</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            className={`${styles.saveButton} ${saveSuccess ? styles.saveButtonSuccess : ''}`}
                            onClick={handleSave}
                            disabled={selectedWords.size === 0 || isSaving || saveSuccess}
                        >
                            {saveSuccess ? (
                                <>
                                    <Check size={20} />
                                    保存しました
                                </>
                            ) : isSaving ? (
                                <>
                                    <BookMarked size={20} />
                                    保存中...
                                </>
                            ) : (
                                <>
                                    <BookMarked size={20} />
                                    選択した{selectedWords.size}語をMy単語帳に保存
                                </>
                            )}
                        </button>

                        {reviewWords.length > 0 && (
                            <button className={styles.secondaryButton} onClick={retryMissedWords}>
                                <RotateCcw size={18} />
                                間違えた{reviewWords.length}語をもう一度
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Swipe Card Component
interface SwipeCardProps {
    word: LearningWord;
    onSwipe: (direction: 'left' | 'right') => void;
}

function SwipeCard({ word, onSwipe }: SwipeCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragEnd = useCallback((_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            setExitDirection('right');
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            setExitDirection('left');
            onSwipe('left');
        }
    }, [onSwipe]);

    const handleTap = () => {
        if (Math.abs(x.get()) < 10) {
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <motion.div
            className={styles.card}
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={
                exitDirection
                    ? { x: exitDirection === 'right' ? 500 : -500, opacity: 0, rotate: exitDirection === 'right' ? 30 : -30 }
                    : { scale: 1, y: 0, opacity: 1 }
            }
            exit={{ x: exitDirection === 'right' ? 500 : -500, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={handleTap}
        >
            {/* Indicators */}
            <motion.div
                className={`${styles.indicator} ${styles.indicatorRight} ${styles.likeColor}`}
                style={{ opacity: likeOpacity }}
            >
                <Heart size={24} />
                <span>わかる</span>
            </motion.div>
            <motion.div
                className={`${styles.indicator} ${styles.indicatorLeft} ${styles.nopeColor}`}
                style={{ opacity: nopeOpacity }}
            >
                <X size={24} />
                <span>わからない</span>
            </motion.div>

            {/* Card Content */}
            <div className={`${styles.cardInner} ${isFlipped ? styles.cardFlipped : ''}`}>
                <div className={styles.cardFront}>
                    <div className={styles.cardTarget}>{word.targetText}</div>
                    {word.reading && <div className={styles.cardReading}>{word.reading}</div>}
                    <div className={styles.tapHint}>タップで裏面を見る</div>
                </div>
                <div className={styles.cardBack}>
                    <div className={styles.cardTranslation}>{word.translation}</div>
                </div>
            </div>
        </motion.div>
    );
}
