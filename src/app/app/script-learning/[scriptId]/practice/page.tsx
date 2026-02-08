"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { useScriptLearningStore } from "@/store/script-learning-store";
import { translations } from "@/lib/translations";
import type { ScriptCharacter } from "@/data/scripts";
import { generateLessonSets } from "@/data/scripts/lesson-sets";
import styles from "./page.module.css";
import clsx from "clsx";

// ─── Constants ───

const BATCH_SIZE = 5;

// ─── Types ───

type PracticePhase =
    | "batch-flash" | "batch-quiz" | "batch-transition"
    | "final-intro" | "final-quiz" | "results";

interface QuizQuestion {
    character: ScriptCharacter;
    prompt: string;
    correctAnswer: string;
    options: string[];
    type: "char-to-roman" | "roman-to-char";
}

interface PhaseResult {
    correct: ScriptCharacter[];
    incorrect: ScriptCharacter[];
}

interface BatchResult {
    flashCorrect: number;
    flashTotal: number;
    quizCorrect: number;
    quizTotal: number;
}

// ─── Utilities ───

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

// ─── Quiz Generation ───

function generateQuizQuestions(
    targets: ScriptCharacter[],
    allChars: ScriptCharacter[],
    type: "char-to-roman" | "roman-to-char",
): QuizQuestion[] {
    const shuffled = [...targets].sort(() => Math.random() - 0.5);

    return shuffled.map((char) => {
        const correctAnswer = type === "char-to-roman" ? char.romanization : char.character;

        // Distractors: same set first (harder), then fall back to all chars
        const sameSet = targets.filter(c => c.id !== char.id);
        const rest = allChars.filter(c => c.id !== char.id && !targets.some(t => t.id === c.id));
        const pool = [...sameSet.sort(() => Math.random() - 0.5), ...rest.sort(() => Math.random() - 0.5)];

        const usedValues = new Set([correctAnswer]);
        const distractors: string[] = [];
        for (const c of pool) {
            const value = type === "char-to-roman" ? c.romanization : c.character;
            if (!usedValues.has(value) && distractors.length < 3) {
                distractors.push(value);
                usedValues.add(value);
            }
        }

        const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

        return {
            character: char,
            prompt: type === "char-to-roman" ? char.character : char.romanization,
            correctAnswer,
            options,
            type,
        };
    });
}

// ─── Character Card (Swipe) ───

interface CharacterCardProps {
    character: ScriptCharacter;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
}

function CharacterCard({ character, onSwipe, isTop }: CharacterCardProps) {
    const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    const knowOpacity = useTransform(x, [0, 100], [0, 1]);
    const dontKnowOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            setExitDirection("right");
        } else if (info.offset.x < -threshold) {
            setExitDirection("left");
        }
    };

    const handleAnimationComplete = () => {
        if (exitDirection) {
            onSwipe(exitDirection);
        }
    };

    if (!isTop) {
        return (
            <div className={styles.card} style={{ transform: "scale(0.95) translateY(10px)" }}>
                <div className={styles.cardContent}>
                    <span className={styles.cardCharacter}>{character.character}</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.card}
            style={{ x, rotate, opacity }}
            drag={exitDirection ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={
                exitDirection
                    ? { x: exitDirection === "right" ? 500 : -500, opacity: 0, rotate: exitDirection === "right" ? 30 : -30 }
                    : undefined
            }
            onAnimationComplete={handleAnimationComplete}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
        >
            <motion.div className={clsx(styles.indicator, styles.knowIndicator)} style={{ opacity: knowOpacity }}>
                <CheckCircle size={28} />
            </motion.div>
            <motion.div className={clsx(styles.indicator, styles.dontKnowIndicator)} style={{ opacity: dontKnowOpacity }}>
                <XCircle size={28} />
            </motion.div>

            <div className={styles.cardContent}>
                <span className={styles.cardCategoryBadge}>{character.category}</span>
                <span className={styles.cardCharacter}>{character.character}</span>
                <span className={styles.cardRomanization}>{character.romanization}</span>
                <span className={styles.cardPronunciation}>[{character.pronunciation}]</span>
                {character.meaning && <span className={styles.cardMeaning}>{character.meaning}</span>}

                {character.variants && (
                    <div className={styles.cardVariants}>
                        {Object.entries(character.variants).map(([form, char]) => (
                            <div key={form} className={styles.cardVariant}>
                                <span className={styles.cardVariantChar}>{char}</span>
                                <span className={styles.cardVariantLabel}>{form}</span>
                            </div>
                        ))}
                    </div>
                )}

                {character.examples && character.examples.length > 0 && (
                    <div className={styles.cardExamples}>
                        {character.examples.slice(0, 2).map((ex, i) => (
                            <span key={i} className={styles.cardExample}>
                                <span className={styles.cardExampleWord}>{ex.word}</span> — {ex.meaning}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Quiz View ───

interface QuizViewProps {
    question: QuizQuestion;
    onAnswer: (isCorrect: boolean) => void;
}

function QuizView({ question, onAnswer }: QuizViewProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (option: string) => {
        if (selected !== null) return;
        setSelected(option);
        const isCorrect = option === question.correctAnswer;

        setTimeout(() => {
            onAnswer(isCorrect);
            setSelected(null);
        }, isCorrect ? 800 : 1200);
    };

    const promptLabel = question.type === "char-to-roman"
        ? "この文字の読みは？"
        : "この読みの文字は？";

    return (
        <div className={styles.quizArea}>
            <motion.div
                key={question.prompt}
                className={styles.quizQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <span className={styles.quizPromptLabel}>{promptLabel}</span>
                <span className={question.type === "char-to-roman" ? styles.quizPromptChar : styles.quizPromptRoman}>
                    {question.prompt}
                </span>
            </motion.div>

            <div className={styles.optionsGrid}>
                {question.options.map((opt, i) => {
                    const isCorrect = opt === question.correctAnswer;
                    const isSelected = opt === selected;
                    return (
                        <motion.button
                            key={`${question.prompt}-${i}`}
                            className={clsx(
                                styles.optionButton,
                                question.type === "roman-to-char" && styles.optionButtonLarge,
                                selected !== null && isCorrect && styles.optionCorrect,
                                selected !== null && isSelected && !isCorrect && styles.optionIncorrect,
                            )}
                            onClick={() => handleSelect(opt)}
                            disabled={selected !== null}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {opt}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Practice Page ───

export default function PracticePage() {
    const params = useParams();
    const scriptId = params.scriptId as string;
    const router = useRouter();
    const { user, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage || "ja"] as any;
    const store = useScriptLearningStore();

    // ─── Saved characters & batches ───
    const [savedChars] = useState<ScriptCharacter[]>(() => [...store.practiceCharacters]);
    const [batches] = useState<ScriptCharacter[][]>(() => chunkArray(savedChars, BATCH_SIZE));

    // ─── Phase state ───
    const [phase, setPhase] = useState<PracticePhase>("batch-flash");
    const [batchIndex, setBatchIndex] = useState(0);

    // ─── Batch results ───
    const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
    const [currentBatchFlash, setCurrentBatchFlash] = useState<{ correct: number; total: number } | null>(null);

    // ─── Quiz state ───
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizCorrect, setQuizCorrect] = useState<ScriptCharacter[]>([]);
    const [quizIncorrect, setQuizIncorrect] = useState<ScriptCharacter[]>([]);

    // ─── Final quiz result ───
    const [finalQuizResult, setFinalQuizResult] = useState<PhaseResult | null>(null);

    // ─── Save/retry ───
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Guard: redirect if no practice characters
    useEffect(() => {
        if (store.practiceCharacters.length === 0 && savedChars.length === 0) {
            router.replace(`/app/script-learning/${scriptId}`);
        }
    }, []);

    // Initialize first batch on mount
    useEffect(() => {
        if (batches.length > 0 && phase === "batch-flash" && batchIndex === 0) {
            const batch = batches[0];
            store.startLessonPractice(batch.map(c => c.id));
        }
    }, []);

    // Find current lesson set
    const currentLesson = (() => {
        if (!store.selectedLessonSetId || !store.loadedScript) return null;
        const lessons = generateLessonSets(store.loadedScript);
        return lessons.find((l) => l.id === store.selectedLessonSetId) ?? null;
    })();

    // ─── Flash phase swipe handler ───
    const handleFlashSwipe = useCallback(
        (direction: "left" | "right") => {
            const s = useScriptLearningStore.getState();
            s.handleSwipe(direction);

            const latest = useScriptLearningStore.getState();
            if (latest.currentIndex >= latest.practiceCharacters.length) {
                const flashResult = {
                    correct: latest.knownCharacters.length,
                    total: latest.practiceCharacters.length,
                };
                setCurrentBatchFlash(flashResult);

                // Generate quiz for this batch
                if (store.loadedScript) {
                    const batch = batches[batchIndex];
                    const questions = generateQuizQuestions(batch, savedChars, "char-to-roman");
                    setQuizQuestions(questions);
                    setQuizIndex(0);
                    setQuizCorrect([]);
                    setQuizIncorrect([]);
                }
                setPhase("batch-quiz");
            }
        },
        [batchIndex, batches, savedChars, store.loadedScript],
    );

    // ─── Batch quiz answer handler ───
    const handleBatchQuizAnswer = useCallback(
        (isCorrect: boolean) => {
            const q = quizQuestions[quizIndex];
            if (!q) return;

            const newCorrect = isCorrect ? [...quizCorrect, q.character] : quizCorrect;
            const newIncorrect = isCorrect ? quizIncorrect : [...quizIncorrect, q.character];
            setQuizCorrect(newCorrect);
            setQuizIncorrect(newIncorrect);

            const nextIndex = quizIndex + 1;
            if (nextIndex >= quizQuestions.length) {
                // Batch complete — save batch result
                const result: BatchResult = {
                    flashCorrect: currentBatchFlash?.correct ?? 0,
                    flashTotal: currentBatchFlash?.total ?? 0,
                    quizCorrect: newCorrect.length,
                    quizTotal: quizQuestions.length,
                };
                setBatchResults((prev) => [...prev, result]);
                setPhase("batch-transition");
            } else {
                setQuizIndex(nextIndex);
            }
        },
        [quizQuestions, quizIndex, quizCorrect, quizIncorrect, currentBatchFlash],
    );

    // ─── Final quiz answer handler ───
    const handleFinalQuizAnswer = useCallback(
        (isCorrect: boolean) => {
            const q = quizQuestions[quizIndex];
            if (!q) return;

            const newCorrect = isCorrect ? [...quizCorrect, q.character] : quizCorrect;
            const newIncorrect = isCorrect ? quizIncorrect : [...quizIncorrect, q.character];
            setQuizCorrect(newCorrect);
            setQuizIncorrect(newIncorrect);

            const nextIndex = quizIndex + 1;
            if (nextIndex >= quizQuestions.length) {
                setFinalQuizResult({ correct: newCorrect, incorrect: newIncorrect });
                setPhase("results");
            } else {
                setQuizIndex(nextIndex);
            }
        },
        [quizQuestions, quizIndex, quizCorrect, quizIncorrect],
    );

    // ─── Transition: continue to next batch or final ───
    const handleTransitionContinue = useCallback(() => {
        const nextBatch = batchIndex + 1;
        if (nextBatch < batches.length) {
            // Next batch
            setBatchIndex(nextBatch);
            setCurrentBatchFlash(null);
            store.startLessonPractice(batches[nextBatch].map(c => c.id));
            setPhase("batch-flash");
        } else {
            // All batches done → final intro
            setPhase("final-intro");
        }
    }, [batchIndex, batches, store]);

    // ─── Start final quiz ───
    const handleStartFinalQuiz = useCallback(() => {
        if (!store.loadedScript) return;
        const questions = generateQuizQuestions(savedChars, store.loadedScript.characters, "roman-to-char");
        setQuizQuestions(questions);
        setQuizIndex(0);
        setQuizCorrect([]);
        setQuizIncorrect([]);
        setPhase("final-quiz");
    }, [savedChars, store.loadedScript]);

    // ─── Navigation ───
    const handleBack = () => {
        store.resetPractice();
        router.push(`/app/script-learning/${scriptId}`);
    };

    const handleRetry = () => {
        setBatchResults([]);
        setCurrentBatchFlash(null);
        setFinalQuizResult(null);
        setQuizQuestions([]);
        setQuizIndex(0);
        setQuizCorrect([]);
        setQuizIncorrect([]);
        setSaved(false);
        setBatchIndex(0);

        if (batches.length > 0) {
            store.startLessonPractice(batches[0].map(c => c.id));
        }
        setPhase("batch-flash");
    };

    const handleSaveResults = async () => {
        if (!user || !store.loadedScript || !finalQuizResult) return;
        setSaving(true);

        // Set known/unknown from final quiz result into store for saveResults
        const knownIds = finalQuizResult.correct.map(c => c.id);
        const allIds = savedChars.map(c => c.id);

        // Use startLessonPractice to set up characters, then manually set known/unknown
        store.startLessonPractice(allIds);

        // Simulate swipes based on final quiz results
        for (const char of savedChars) {
            const direction = knownIds.includes(char.id) ? "right" : "left";
            store.handleSwipe(direction);
        }

        await store.saveResults(user.id, store.loadedScript.languageCode);
        setSaving(false);
        setSaved(true);
    };

    // ─── Phase labels ───
    const phaseLabel = (() => {
        switch (phase) {
            case "batch-flash": return `バッチ ${batchIndex + 1}/${batches.length} — フラッシュ`;
            case "batch-quiz": return `バッチ ${batchIndex + 1}/${batches.length} — クイズ`;
            case "final-quiz": return t.scriptFinalQuiz || "最終テスト";
            default: return "";
        }
    })();

    // ─── Batch Transition Screen ───
    if (phase === "batch-transition") {
        const lastResult = batchResults[batchResults.length - 1];
        const quizPct = lastResult ? Math.round((lastResult.quizCorrect / lastResult.quizTotal) * 100) : 0;
        const isLastBatch = batchIndex + 1 >= batches.length;

        return (
            <div className={styles.container}>
                <motion.div
                    className={styles.transitionScreen}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button className={styles.backButton} onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </button>

                    <span className={styles.transitionPercent}>{quizPct}%</span>
                    <span className={styles.transitionLabel}>
                        バッチ {batchIndex + 1}/{batches.length} — {lastResult?.quizCorrect}/{lastResult?.quizTotal} 正解
                    </span>

                    {/* Batch progress bar */}
                    <div className={styles.batchProgressBar}>
                        <div
                            className={styles.batchProgressFill}
                            style={{ width: `${((batchIndex + 1) / batches.length) * 100}%` }}
                        />
                    </div>

                    <span className={styles.transitionNextLabel}>
                        {isLastBatch
                            ? (t.scriptGoToFinal || "全体テストへ")
                            : (t.scriptNextBatch || `次のバッチ（${batches[batchIndex + 1]?.length}文字）`)
                        }
                    </span>

                    <button className={styles.continueButton} onClick={handleTransitionContinue}>
                        {isLastBatch ? (t.scriptStartFinal || "最終テストへ") : (t.scriptContinue || "続ける")} <ChevronRight size={18} />
                    </button>
                </motion.div>
            </div>
        );
    }

    // ─── Final Intro Screen ───
    if (phase === "final-intro") {
        return (
            <div className={styles.container}>
                <motion.div
                    className={styles.transitionScreen}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button className={styles.backButton} onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </button>

                    <span className={styles.transitionPercent}>{savedChars.length}</span>
                    <span className={styles.transitionLabel}>
                        {t.scriptFinalIntro || "文字の最終テスト"}
                    </span>

                    <span className={styles.transitionNextLabel}>
                        {t.scriptFinalDesc || "読み方を見て文字を選ぶ4択クイズ"}
                    </span>

                    <button className={styles.continueButton} onClick={handleStartFinalQuiz}>
                        {t.scriptStartFinal || "始める"} <ChevronRight size={18} />
                    </button>
                </motion.div>
            </div>
        );
    }

    // ─── Results Screen ───
    if (phase === "results") {
        const finalCorrect = finalQuizResult?.correct.length ?? 0;
        const finalTotal = savedChars.length;
        const finalPct = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 0;
        const allPerfect = finalCorrect === finalTotal;

        const finalWrong = finalQuizResult?.incorrect ?? [];

        return (
            <div className={styles.container}>
                <div className={styles.resultsScreen}>
                    <button className={styles.backButton} onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </button>

                    <h2 className={styles.resultsTitle}>
                        {allPerfect ? (t.scriptAllCorrect || "パーフェクト!") : (t.scriptCycleComplete || "練習完了!")}
                    </h2>

                    {currentLesson && (
                        <p className={styles.resultLessonName}>{currentLesson.name}</p>
                    )}

                    {/* Batch scores */}
                    <div className={styles.cycleTable}>
                        {batchResults.map((br, i) => (
                            <div key={i} className={styles.cycleRow}>
                                <span className={styles.cycleLabel}>バッチ {i + 1}</span>
                                <div className={styles.cycleScores}>
                                    <span className={styles.cycleScore}>
                                        {br.quizCorrect}/{br.quizTotal}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div className={styles.cycleRow}>
                            <span className={styles.cycleLabel}>{t.scriptFinalQuiz || "最終テスト"}</span>
                            <div className={styles.cycleScores}>
                                <span className={clsx(styles.cycleScore, allPerfect && styles.cycleImproved)}>
                                    {finalCorrect}/{finalTotal} ({finalPct}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {finalWrong.length > 0 && (
                        <div className={styles.unknownList}>
                            <span className={styles.unknownListTitle}>{t.scriptToReview || "要復習"}</span>
                            {finalWrong.map((char) => (
                                <div key={char.id} className={styles.unknownItem}>
                                    <span className={styles.unknownItemChar}>{char.character}</span>
                                    <div className={styles.unknownItemInfo}>
                                        <span className={styles.unknownItemRoman}>{char.romanization}</span>
                                        {char.meaning && <span className={styles.unknownItemMeaning}>{char.meaning}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.resultActions}>
                        <button
                            className={styles.saveButton}
                            onClick={handleSaveResults}
                            disabled={saving || saved}
                        >
                            {saved ? (t.scriptSaved || "保存済み ✓") : saving ? "..." : (t.scriptSave || "進捗を保存")}
                        </button>
                        <button className={styles.retryButton} onClick={handleRetry}>
                            {t.scriptRetryCycle || "もう一度"}
                        </button>
                        <button className={styles.retryButton} onClick={handleBack}>
                            {t.scriptBackToDetail || "戻る"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Active Practice Views (batch-flash / batch-quiz / final-quiz) ───
    const remaining = store.practiceCharacters.slice(store.currentIndex);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    <ArrowLeft size={20} />
                </button>
                <div className={styles.headerCenter}>
                    <h2 className={styles.title}>{store.loadedScript?.name}</h2>
                    {phaseLabel && <span className={styles.phaseLabel}>{phaseLabel}</span>}
                </div>
                <span className={styles.progress}>
                    {phase === "batch-flash"
                        ? `${store.currentIndex} / ${store.practiceCharacters.length}`
                        : `${quizIndex + 1} / ${quizQuestions.length}`
                    }
                </span>
            </div>

            {/* Batch progress bar */}
            {phase !== "final-quiz" && (
                <div className={styles.batchProgressBar}>
                    <div
                        className={styles.batchProgressFill}
                        style={{
                            width: `${(
                                (batchIndex + (phase === "batch-quiz" ? 0.5 : 0)) / batches.length
                            ) * 100}%`,
                        }}
                    />
                </div>
            )}

            {/* Flashcard phase */}
            {phase === "batch-flash" && (
                <>
                    <div className={styles.cardStack}>
                        {remaining.slice(0, 2).reverse().map((char, i) => (
                            <CharacterCard
                                key={char.id}
                                character={char}
                                onSwipe={handleFlashSwipe}
                                isTop={i === (Math.min(remaining.length, 2) - 1)}
                            />
                        ))}
                    </div>

                    <div className={styles.statsBar}>
                        <span className={styles.knownCount}>
                            <CheckCircle size={16} /> {store.knownCharacters.length}
                        </span>
                        <span className={styles.unknownCount}>
                            <XCircle size={16} /> {store.unknownCharacters.length}
                        </span>
                    </div>
                </>
            )}

            {/* Batch quiz phase */}
            {phase === "batch-quiz" && quizQuestions[quizIndex] && (
                <>
                    <QuizView
                        key={`batch-${batchIndex}-${quizIndex}`}
                        question={quizQuestions[quizIndex]}
                        onAnswer={handleBatchQuizAnswer}
                    />

                    <div className={styles.statsBar}>
                        <span className={styles.knownCount}>
                            <CheckCircle size={16} /> {quizCorrect.length}
                        </span>
                        <span className={styles.unknownCount}>
                            <XCircle size={16} /> {quizIncorrect.length}
                        </span>
                    </div>
                </>
            )}

            {/* Final quiz phase */}
            {phase === "final-quiz" && quizQuestions[quizIndex] && (
                <>
                    <QuizView
                        key={`final-${quizIndex}`}
                        question={quizQuestions[quizIndex]}
                        onAnswer={handleFinalQuizAnswer}
                    />

                    <div className={styles.statsBar}>
                        <span className={styles.knownCount}>
                            <CheckCircle size={16} /> {quizCorrect.length}
                        </span>
                        <span className={styles.unknownCount}>
                            <XCircle size={16} /> {quizIncorrect.length}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
