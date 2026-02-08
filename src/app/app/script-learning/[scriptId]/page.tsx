"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { useScriptLearningStore, type CharacterStatus } from "@/store/script-learning-store";
import { translations } from "@/lib/translations";
import type { ScriptCharacter } from "@/data/scripts";
import { generateLessonSets, type LessonSet } from "@/data/scripts/lesson-sets";
import styles from "./page.module.css";
import clsx from "clsx";

// ─── Stroke Order Display ───

function StrokeOrderDisplay({ strokes }: { strokes: string[] }) {
    const [playing, setPlaying] = useState(false);
    const [visibleStrokes, setVisibleStrokes] = useState(strokes.length);

    const play = () => {
        setPlaying(true);
        setVisibleStrokes(0);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisibleStrokes(i);
            if (i >= strokes.length) {
                clearInterval(interval);
                setPlaying(false);
            }
        }, 600);
    };

    return (
        <div className={styles.strokeOrderArea}>
            <svg className={styles.strokeSvg} viewBox="0 0 100 100">
                {strokes.slice(0, visibleStrokes).map((d, i) => (
                    <motion.path
                        key={i}
                        d={d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                ))}
            </svg>
            <div className={styles.strokeControls}>
                <button className={styles.strokeButton} onClick={play} disabled={playing}>
                    <RotateCcw size={12} /> Replay
                </button>
            </div>
        </div>
    );
}

// ─── Character Detail Modal ───

function CharacterDetailModal({ character, onClose }: { character: ScriptCharacter; onClose: () => void }) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <motion.div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
                <span className={styles.modalChar}>{character.character}</span>
                <span className={styles.modalRoman}>{character.romanization}</span>
                <span className={styles.modalPronunciation}>[{character.pronunciation}]</span>
                {character.meaning && <span className={styles.modalMeaning}>{character.meaning}</span>}
                {character.strokeCount && (
                    <span className={styles.modalStrokeCount}>{character.strokeCount} strokes</span>
                )}

                {character.variants && (
                    <div className={styles.modalVariants}>
                        {Object.entries(character.variants).map(([form, char]) => (
                            <div key={form} className={styles.modalVariant}>
                                <span className={styles.modalVariantChar}>{char}</span>
                                <span className={styles.modalVariantLabel}>{form}</span>
                            </div>
                        ))}
                    </div>
                )}

                {character.strokeOrder && character.strokeOrder.length > 0 && (
                    <StrokeOrderDisplay strokes={character.strokeOrder} />
                )}

                {character.examples && character.examples.length > 0 && (
                    <div className={styles.modalExamples}>
                        <span className={styles.modalExamplesTitle}>Examples</span>
                        {character.examples.map((ex, i) => (
                            <div key={i} className={styles.modalExample}>
                                <span className={styles.modalExampleWord}>{ex.word}</span>
                                <span className={styles.modalExampleReading}>{ex.reading}</span>
                                {" — "}
                                <span className={styles.modalExampleMeaning}>{ex.meaning}</span>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ─── Script Detail Page ───

export default function ScriptDetailPage() {
    const params = useParams();
    const scriptId = params.scriptId as string;
    const router = useRouter();
    const { user, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage || "ja"] as any;
    const store = useScriptLearningStore();

    const [activeTab, setActiveTab] = useState<"lessons" | "chart" | "progress">("lessons");

    // Load script on mount
    useEffect(() => {
        if (scriptId && user) {
            store.loadScript(scriptId, user.id);
        }
    }, [scriptId, user]);

    // ─── Loading ───
    if (store.isLoadingScript) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    if (!store.loadedScript) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <p>{store.error || "Script not found"}</p>
                    <Link href="/app/script-learning" className={styles.backLink}>
                        <ArrowLeft size={16} /> {t.scriptBackToList || "一覧に戻る"}
                    </Link>
                </div>
            </div>
        );
    }

    const { categories, characters } = store.loadedScript;
    const total = store.loadedScript.totalCharacters;
    const progEntries = Object.values(store.progressMap);
    const counts = {
        new: total - progEntries.length,
        learning: progEntries.filter(p => p.status === "learning").length,
        reviewing: progEntries.filter(p => p.status === "reviewing").length,
        mastered: progEntries.filter(p => p.status === "mastered").length,
    };
    const masteryPct = total > 0 ? Math.round((counts.mastered / total) * 100) : 0;
    const dueCount = progEntries.filter(p => p.next_review_at && p.next_review_at <= new Date().toISOString()).length;

    const lessonSets = generateLessonSets(store.loadedScript);

    const handleLessonPractice = (lesson: LessonSet) => {
        store.setLessonSet(lesson.id);
        const success = store.startLessonPractice(lesson.characterIds);
        if (success) {
            router.push(`/app/script-learning/${scriptId}/practice`);
        }
    };

    const getLessonMastery = (lesson: LessonSet) => {
        if (lesson.characters.length === 0) return 0;
        const mastered = lesson.characters.filter(c => {
            const p = store.progressMap[c.id];
            return p && p.status === "mastered";
        }).length;
        return Math.round((mastered / lesson.characters.length) * 100);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/app/script-learning" className={styles.backButton}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>{store.loadedScript.name}</h1>
                <span className={styles.badge}>{total} chars</span>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                {(["lessons", "chart", "progress"] as const).map((tab) => (
                    <button
                        key={tab}
                        className={clsx(styles.tabButton, activeTab === tab && styles.tabButtonActive)}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "lessons" ? (t.scriptLessons || "Lessons")
                            : tab === "chart" ? (t.scriptChart || "Chart")
                            : (t.scriptProgress || "Progress")}
                    </button>
                ))}
            </div>

            {/* Lessons Tab */}
            {activeTab === "lessons" && (
                <div className={styles.lessonList}>
                    {lessonSets.map((lesson) => {
                        const mastery = getLessonMastery(lesson);
                        const isComplete = mastery === 100;
                        return (
                            <div
                                key={lesson.id}
                                className={clsx(styles.lessonCard, isComplete && styles.lessonCardComplete)}
                            >
                                <div className={styles.lessonCardHeader}>
                                    <div className={styles.lessonCardTitles}>
                                        <span className={styles.lessonCardTitle}>{lesson.name}</span>
                                        {lesson.nameNative && lesson.nameNative !== lesson.name && (
                                            <span className={styles.lessonCardSubtitle}>{lesson.nameNative}</span>
                                        )}
                                    </div>
                                    <span className={styles.lessonCardPct}>{mastery}%</span>
                                </div>
                                <div className={styles.lessonCharPreview}>
                                    {lesson.characters.map(c => {
                                        const p = store.progressMap[c.id];
                                        const status = p?.status ?? "new";
                                        return (
                                            <span
                                                key={c.id}
                                                className={clsx(
                                                    styles.lessonChar,
                                                    status === "mastered" && styles.lessonCharMastered,
                                                    status === "reviewing" && styles.lessonCharReviewing,
                                                    status === "learning" && styles.lessonCharLearning,
                                                )}
                                            >
                                                {c.character}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className={styles.lessonProgressBar}>
                                    <div className={styles.lessonProgressFill} style={{ width: `${mastery}%` }} />
                                </div>
                                <button
                                    className={styles.lessonPracticeButton}
                                    onClick={() => handleLessonPractice(lesson)}
                                >
                                    {isComplete ? (t.scriptReview || "復習") : (t.scriptPractice || "練習")}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chart Tab */}
            {activeTab === "chart" && (
                <div className={styles.chartContainer}>
                    {categories.map((cat) => {
                        const catChars = characters.filter(c => c.category === cat.id);
                        if (catChars.length === 0) return null;

                        return (
                            <div key={cat.id} className={styles.chartSection}>
                                <h3 className={styles.chartSectionTitle}>{cat.name}</h3>
                                <div className={styles.charGrid}>
                                    {catChars.map((char) => {
                                        const progress = store.progressMap[char.id];
                                        const status: CharacterStatus = progress?.status ?? "new";

                                        return (
                                            <button
                                                key={char.id}
                                                className={styles.charTile}
                                                onClick={() => store.openCharacterDetail(char)}
                                            >
                                                <span className={styles.charTileChar}>{char.character}</span>
                                                <span className={styles.charTileRoman}>{char.romanization}</span>
                                                <span className={clsx(
                                                    styles.charTileDot,
                                                    status === "new" && styles.dotNew,
                                                    status === "learning" && styles.dotLearning,
                                                    status === "reviewing" && styles.dotReviewing,
                                                    status === "mastered" && styles.dotMastered,
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressCard}>
                        <h3 className={styles.progressTitle}>
                            {store.loadedScript.name} — {masteryPct}%
                        </h3>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${masteryPct}%` }} />
                        </div>
                        <div className={styles.progressStats}>
                            <div className={styles.progressStatItem}>
                                <span className={clsx(styles.progressStatValue, styles.valueNew)}>{counts.new}</span>
                                <span className={styles.progressStatLabel}>New</span>
                            </div>
                            <div className={styles.progressStatItem}>
                                <span className={clsx(styles.progressStatValue, styles.valueLearning)}>{counts.learning}</span>
                                <span className={styles.progressStatLabel}>Learning</span>
                            </div>
                            <div className={styles.progressStatItem}>
                                <span className={clsx(styles.progressStatValue, styles.valueReviewing)}>{counts.reviewing}</span>
                                <span className={styles.progressStatLabel}>Review</span>
                            </div>
                            <div className={styles.progressStatItem}>
                                <span className={clsx(styles.progressStatValue, styles.valueMastered)}>{counts.mastered}</span>
                                <span className={styles.progressStatLabel}>Mastered</span>
                            </div>
                        </div>
                    </div>

                    {dueCount > 0 && (
                        <div className={styles.progressCard}>
                            <h3 className={styles.progressTitle}>{t.scriptDueReview || "復習予定"}: {dueCount}</h3>
                            <button
                                className={styles.startButton}
                                onClick={() => {
                                    store.setCharacterFilter("due");
                                    const success = store.startPractice();
                                    if (success) router.push(`/app/script-learning/${scriptId}/practice`);
                                }}
                            >
                                {t.scriptStartReview || "復習を始める"}
                            </button>
                        </div>
                    )}
                </div>
            )}


            {store.error && <p className={styles.error}>{store.error}</p>}

            {/* Character Detail Modal */}
            <AnimatePresence>
                {store.showCharacterDetail && store.selectedCharacter && (
                    <CharacterDetailModal
                        character={store.selectedCharacter}
                        onClose={store.closeCharacterDetail}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
