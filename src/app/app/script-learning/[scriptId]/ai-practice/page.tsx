"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { useScriptLearningStore } from "@/store/script-learning-store";
import { translations } from "@/lib/translations";
import { generateScriptExercises } from "@/actions/script-practice";
import styles from "./page.module.css";
import clsx from "clsx";

export default function AIPracticePage() {
    const params = useParams();
    const scriptId = params.scriptId as string;
    const router = useRouter();
    const { user, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage || "ja"] as any;
    const store = useScriptLearningStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const generatedRef = useRef(false);

    // Generate exercises on mount
    useEffect(() => {
        if (!store.loadedScript || !user) {
            router.replace(`/app/script-learning/${scriptId}`);
            return;
        }
        if (!store.aiExercises && !generatedRef.current) {
            generatedRef.current = true;
            generateExercises();
        }
    }, []);

    async function generateExercises() {
        if (!store.loadedScript || !user) return;
        setLoading(true);
        setError(null);

        try {
            const weakChars = store.loadedScript.characters
                .filter(c => {
                    const p = store.progressMap[c.id];
                    return !p || p.strength <= 2;
                })
                .map(c => c.character)
                .slice(0, 20);

            const result = await generateScriptExercises(
                store.loadedScript.id,
                store.loadedScript.name,
                store.loadedScript.languageCode,
                nativeLanguage || "ja",
                weakChars,
                store.loadedScript.characters.filter(c => {
                    const p = store.progressMap[c.id];
                    return p && p.strength >= 3;
                }).map(c => c.character).slice(0, 10),
            );

            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            store.setAIExercises(result.exercises || []);
            setLoading(false);
        } catch {
            setError("Failed to generate exercises");
            setLoading(false);
        }
    }

    const handleBack = () => {
        store.resetPractice();
        router.push(`/app/script-learning/${scriptId}`);
    };

    const handleAnswer = (option: string) => {
        if (showResult || !store.aiExercises) return;
        setSelectedAnswer(option);
        setShowResult(true);

        const exercise = store.aiExercises[store.aiCurrentIndex];
        const correct = option === exercise.correctAnswer;

        setTimeout(() => {
            store.answerAIExercise(correct);
            setSelectedAnswer(null);
            setShowResult(false);
        }, 1200);
    };

    const isComplete = store.aiExercises && store.aiCurrentIndex >= store.aiExercises.length;

    // ─── Loading ───
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingScreen}>
                    <button className={styles.backButton} onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.spinner} />
                    <span className={styles.loadingText}>{t.scriptGenerating || "練習問題を生成中..."}</span>
                </div>
            </div>
        );
    }

    // ─── Error ───
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorScreen}>
                    <button className={styles.backButton} onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <p className={styles.error}>{error}</p>
                    <button className={styles.retryButton} onClick={() => { generatedRef.current = false; generateExercises(); }}>
                        {t.scriptRetry || "もう一度"}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Results ───
    if (isComplete) {
        const correctCount = store.aiAnswers.filter(a => a.correct).length;
        const incorrectCount = store.aiAnswers.filter(a => !a.correct).length;

        return (
            <div className={styles.container}>
                <div className={styles.resultsScreen}>
                    <button className={styles.backButton} onClick={handleBack} style={{ alignSelf: "flex-start" }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className={styles.resultsTitle}>{t.scriptPracticeComplete || "練習完了!"}</h2>

                    <div className={styles.resultsBars}>
                        <div className={styles.resultStat}>
                            <span className={clsx(styles.resultNumber, styles.resultNumberKnown)}>{correctCount}</span>
                            <span className={styles.resultLabel}>{t.scriptCorrect || "正解"}</span>
                        </div>
                        <div className={styles.resultStat}>
                            <span className={clsx(styles.resultNumber, styles.resultNumberUnknown)}>{incorrectCount}</span>
                            <span className={styles.resultLabel}>{t.scriptIncorrect || "不正解"}</span>
                        </div>
                    </div>

                    <div className={styles.resultActions}>
                        <button className={styles.retryButton} onClick={handleBack}>
                            {t.scriptBackToDetail || "戻る"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Quiz ───
    if (!store.aiExercises) return null;
    const exercise = store.aiExercises[store.aiCurrentIndex];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className={styles.title}>
                    <Sparkles size={18} /> AI Practice
                </h2>
                <span className={styles.progress}>{store.aiCurrentIndex + 1} / {store.aiExercises.length}</span>
            </div>

            <div className={styles.quizArea}>
                <p className={styles.question}>{exercise.question}</p>
                {exercise.questionTranslation && (
                    <p className={styles.questionTranslation}>{exercise.questionTranslation}</p>
                )}

                <div className={styles.optionsGrid}>
                    {exercise.options.map((opt, i) => {
                        const isCorrect = opt === exercise.correctAnswer;
                        const isSelected = opt === selectedAnswer;
                        let variant = "";
                        if (showResult && isCorrect) variant = styles.optionCorrect;
                        if (showResult && isSelected && !isCorrect) variant = styles.optionIncorrect;

                        return (
                            <button
                                key={i}
                                className={clsx(styles.optionButton, variant)}
                                onClick={() => handleAnswer(opt)}
                                disabled={showResult}
                            >
                                <span className={styles.optionText}>{opt}</span>
                            </button>
                        );
                    })}
                </div>

                {showResult && (
                    <p className={styles.explanation}>{exercise.explanation}</p>
                )}
            </div>
        </div>
    );
}
