"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import { CheckCircle, XCircle, BookOpen, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { explainPhraseElements, ExplanationResult } from "@/actions/explain";
import {
    generateGrammarPatterns,
    saveDiagnosticResults,
    saveDiagnosticPatterns,
    GeneratedPattern,
} from "@/actions/generate-grammar-patterns";
import { useGrammarDiagnosticStore, GrammarPattern } from "@/store/grammar-diagnostic-store";
import styles from "./grammar-diagnostic.module.css";
import clsx from "clsx";

// ─── Category definitions ───

const CATEGORIES = [
    { value: null, labelKey: "grammarCatAll" },
    { value: "requesting", labelKey: "grammarCatRequesting" },
    { value: "refusing", labelKey: "grammarCatRefusing" },
    { value: "feelings", labelKey: "grammarCatFeelings" },
    { value: "hypothetical", labelKey: "grammarCatHypothetical" },
    { value: "suggestions", labelKey: "grammarCatSuggestions" },
] as const;

// ─── Swipe Card Component ───

interface DiagnosticCardProps {
    pattern: GeneratedPattern;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
    knowLabel: string;
    dontKnowLabel: string;
}

function DiagnosticCard({ pattern, onSwipe, isTop, knowLabel, dontKnowLabel }: DiagnosticCardProps) {
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
            onSwipe("right");
        } else if (info.offset.x < -threshold) {
            setExitDirection("left");
            onSwipe("left");
        }
    };

    if (!isTop) {
        return (
            <motion.div className={styles.card} style={{ scale: 0.95, y: 10 }}>
                <div className={styles.cardContent}>
                    <span className={styles.categoryBadge}>{pattern.category}</span>
                    <div className={styles.patternTemplate}>{pattern.patternTemplate}</div>
                </div>
            </motion.div>
        );
    }

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
                    ? { x: exitDirection === "right" ? 500 : -500, opacity: 0, rotate: exitDirection === "right" ? 30 : -30 }
                    : { scale: 1, y: 0, opacity: 1 }
            }
            exit={{ x: exitDirection === "right" ? 500 : -500, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
        >
            {/* Know indicator */}
            <motion.div className={clsx(styles.indicator, styles.knowIndicator)} style={{ opacity: knowOpacity }}>
                <CheckCircle size={28} />
                <span>{knowLabel}</span>
            </motion.div>

            {/* Don't know indicator */}
            <motion.div className={clsx(styles.indicator, styles.dontKnowIndicator)} style={{ opacity: dontKnowOpacity }}>
                <XCircle size={28} />
                <span>{dontKnowLabel}</span>
            </motion.div>

            <div className={styles.cardContent}>
                <span className={styles.categoryBadge}>{pattern.category}</span>
                <div className={styles.patternTemplate}>{pattern.patternTemplate}</div>
                <div className={styles.exampleSentence}>{pattern.exampleSentence}</div>
                <div className={styles.translationText}>{pattern.translation}</div>
            </div>
        </motion.div>
    );
}

// ─── Pattern Card with Explanation ───

function PatternCard({ pattern, t }: { pattern: GrammarPattern; t: any }) {
    const { activeLanguageCode, nativeLanguage } = useAppStore();
    const { updatePatternStatus, deletePattern } = useGrammarDiagnosticStore();
    const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    const statusLabels: Record<GrammarPattern['status'], string> = {
        to_learn: t.grammarStatusToLearn || "To Learn",
        learning: t.grammarStatusLearning || "Learning",
        mastered: t.grammarStatusMastered || "Mastered",
    };

    const nextStatus: Record<GrammarPattern['status'], GrammarPattern['status']> = {
        to_learn: 'learning',
        learning: 'mastered',
        mastered: 'to_learn',
    };

    const handleExplain = async () => {
        if (explanation) {
            setShowExplanation(!showExplanation);
            return;
        }
        setIsExplaining(true);
        setShowExplanation(true);
        const result = await explainPhraseElements(
            pattern.example_sentence,
            activeLanguageCode,
            nativeLanguage
        );
        if (result) {
            setExplanation(result);
        }
        setIsExplaining(false);
    };

    return (
        <div className={styles.patternItem}>
            <div className={styles.patternItemHeader}>
                <span className={styles.categoryBadge}>{pattern.category}</span>
                <button
                    className={styles.deleteButton}
                    onClick={() => deletePattern(pattern.id)}
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className={styles.patternItemTemplate}>{pattern.pattern_template}</div>

            {/* Example sentence - tappable for explanation */}
            <button className={styles.exampleButton} onClick={handleExplain}>
                <span>{pattern.example_sentence}</span>
                {isExplaining
                    ? <Loader2 size={14} className={styles.spinIcon} />
                    : <ChevronDown size={14} className={clsx(styles.chevron, showExplanation && styles.chevronOpen)} />
                }
            </button>

            {/* Explanation panel */}
            {showExplanation && explanation && (
                <div className={styles.explanationPanel}>
                    <div className={styles.explanationTokens}>
                        {explanation.items.map((item, idx) => (
                            <div key={idx} className={styles.explanationToken}>
                                <span className={styles.tokenText}>{item.token}</span>
                                <span className={styles.tokenMeaning}>{item.meaning}</span>
                                <span className={styles.tokenGrammar}>{item.grammar}</span>
                            </div>
                        ))}
                    </div>
                    {explanation.nuance && (
                        <div className={styles.explanationNuance}>{explanation.nuance}</div>
                    )}
                </div>
            )}

            <div className={styles.patternItemTranslation}>{pattern.translation}</div>
            <button
                className={clsx(styles.statusButton, styles[`status_${pattern.status}`])}
                onClick={() => updatePatternStatus(pattern.id, nextStatus[pattern.status])}
            >
                {statusLabels[pattern.status]}
            </button>
        </div>
    );
}

// ─── Saved Patterns List ───

function SavedPatternsList() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const { patterns, isLoading, fetchPatterns } = useGrammarDiagnosticStore();

    useEffect(() => {
        if (user) {
            fetchPatterns(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchPatterns]);

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (patterns.length === 0) {
        return (
            <div className={styles.emptyState}>
                <BookOpen size={40} color="var(--color-fg-muted)" />
                <p>{t.grammarNoPatterns || "No patterns saved yet. Take a diagnostic to get started!"}</p>
            </div>
        );
    }

    return (
        <div className={styles.patternsList}>
            <div className={styles.patternsCount}>
                {patterns.length} {t.grammarPatternsCount || "patterns"}
            </div>
            {patterns.map((p) => (
                <PatternCard key={p.id} pattern={p} t={t} />
            ))}
        </div>
    );
}

// ─── Main Page ───

type Phase = "start" | "loading" | "swipe" | "results";
type Tab = "diagnostic" | "list";

export default function GrammarDiagnosticPage() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;

    const [tab, setTab] = useState<Tab>("diagnostic");
    const [phase, setPhase] = useState<Phase>("start");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [patterns, setPatterns] = useState<GeneratedPattern[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [knownPatterns, setKnownPatterns] = useState<GeneratedPattern[]>([]);
    const [unknownPatterns, setUnknownPatterns] = useState<GeneratedPattern[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { fetchPatterns } = useGrammarDiagnosticStore();

    const handleStart = async () => {
        setPhase("loading");
        setError(null);

        const result = await generateGrammarPatterns(
            activeLanguageCode,
            nativeLanguage,
            selectedCategory || undefined,
            15
        );

        if (result.success && result.patterns) {
            setPatterns(result.patterns);
            setSessionId(result.sessionId || null);
            setCurrentIndex(0);
            setKnownPatterns([]);
            setUnknownPatterns([]);
            setSaved(false);
            setPhase("swipe");
        } else {
            setError(result.error || t.errorGeneric || "Error");
            setPhase("start");
        }
    };

    const handleSwipe = useCallback((direction: "left" | "right") => {
        const current = patterns[currentIndex];
        if (!current) return;

        if (direction === "right") {
            setKnownPatterns(prev => [...prev, current]);
        } else {
            setUnknownPatterns(prev => [...prev, current]);
        }

        const isLast = currentIndex + 1 >= patterns.length;
        if (isLast) {
            setTimeout(() => setPhase("results"), 300);
        } else {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        }
    }, [patterns, currentIndex]);

    const handleSaveResults = async () => {
        if (!user || saving) return;
        setSaving(true);

        if (sessionId) {
            await saveDiagnosticResults(sessionId, knownPatterns.length, unknownPatterns.length);
        }

        await saveDiagnosticPatterns(knownPatterns, unknownPatterns, activeLanguageCode, sessionId || undefined);

        // Refresh the saved patterns list
        await fetchPatterns(user.id, activeLanguageCode);

        setSaving(false);
        setSaved(true);
    };

    const handleRetry = () => {
        setPhase("start");
        setPatterns([]);
        setCurrentIndex(0);
        setKnownPatterns([]);
        setUnknownPatterns([]);
        setSessionId(null);
        setSaved(false);
        setError(null);
    };

    // Show tabs only on start/results screens (not during swipe/loading)
    const showTabs = phase === "start" || phase === "results" || tab === "list";

    return (
        <div className={styles.container}>
            {/* Tab Bar */}
            {showTabs && (
                <div className={styles.tabBar}>
                    <button
                        className={clsx(styles.tabButton, tab === "diagnostic" && styles.tabButtonActive)}
                        onClick={() => setTab("diagnostic")}
                    >
                        {t.grammarTabDiagnostic || "Diagnostic"}
                    </button>
                    <button
                        className={clsx(styles.tabButton, tab === "list" && styles.tabButtonActive)}
                        onClick={() => setTab("list")}
                    >
                        {t.grammarTabList || "Learning List"}
                    </button>
                </div>
            )}

            {/* Learning List Tab */}
            {tab === "list" && <SavedPatternsList />}

            {/* Diagnostic Tab */}
            {tab === "diagnostic" && (
                <>
                    {/* Start Screen */}
                    {phase === "start" && (
                        <div className={styles.startScreen}>
                            <div className={styles.startIcon}><BookOpen size={48} color="var(--color-accent)" /></div>
                            <h1 className={styles.startTitle}>{t.grammarDiagnostic || "Grammar Diagnostic"}</h1>
                            <p className={styles.startDesc}>{t.grammarDiagnosticDesc || "Discover grammar patterns you don't know yet. Swipe right if you know it, left if you don't."}</p>

                            <div className={styles.categoryLabel}>{t.grammarSelectCategory || "Select a category"}</div>
                            <div className={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.value || "all"}
                                        className={clsx(
                                            styles.categoryButton,
                                            selectedCategory === cat.value && styles.categoryButtonActive
                                        )}
                                        onClick={() => setSelectedCategory(cat.value)}
                                    >
                                        {t[cat.labelKey] || cat.value || "All"}
                                    </button>
                                ))}
                            </div>

                            {error && <p style={{ color: "#ef4444", marginBottom: "var(--space-4)", fontSize: "0.875rem" }}>{error}</p>}

                            <button className={styles.startButton} onClick={handleStart}>
                                {t.grammarStart || "Start Diagnostic"}
                            </button>
                        </div>
                    )}

                    {/* Loading Screen */}
                    {phase === "loading" && (
                        <div className={styles.loadingScreen}>
                            <div className={styles.spinner} />
                            <p className={styles.loadingText}>{t.grammarGenerating || "Generating patterns..."}</p>
                        </div>
                    )}

                    {/* Results Screen */}
                    {phase === "results" && (
                        <div className={styles.resultsScreen}>
                            <h2 className={styles.resultsTitle}>{t.grammarResultsTitle || "Diagnostic Complete!"}</h2>

                            <div className={styles.resultsBars}>
                                <div className={styles.resultStat}>
                                    <span className={clsx(styles.resultNumber, styles.resultNumberKnown)}>{knownPatterns.length}</span>
                                    <span className={styles.resultLabel}>{t.grammarKnow || "Known"}</span>
                                </div>
                                <div className={styles.resultStat}>
                                    <span className={clsx(styles.resultNumber, styles.resultNumberUnknown)}>{unknownPatterns.length}</span>
                                    <span className={styles.resultLabel}>{t.grammarDontKnow || "To Learn"}</span>
                                </div>
                            </div>

                            {unknownPatterns.length > 0 && (
                                <div className={styles.unknownList}>
                                    <div className={styles.unknownListTitle}>
                                        {t.grammarUnknownListTitle || "Patterns to learn:"}
                                    </div>
                                    {unknownPatterns.map((p) => (
                                        <div key={p.id} className={styles.unknownItem}>
                                            <span className={styles.unknownItemPattern}>{p.patternTemplate}</span>
                                            <span className={styles.unknownItemTranslation}>{p.translation}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.resultActions}>
                                {unknownPatterns.length > 0 && !saved && (
                                    <button
                                        className={styles.saveButton}
                                        onClick={handleSaveResults}
                                        disabled={saving}
                                    >
                                        {saving
                                            ? (t.grammarSaving || "Saving...")
                                            : (t.grammarSave || "Save to learning list")}
                                    </button>
                                )}
                                {saved && (
                                    <p className={styles.savedMessage}>{t.grammarSaved || "Saved to your learning list!"}</p>
                                )}
                                <button className={styles.retryButton} onClick={handleRetry}>
                                    {t.grammarRetry || "Take another diagnostic"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Swipe Screen */}
                    {phase === "swipe" && (() => {
                        const currentPattern = patterns[currentIndex];
                        const nextPattern = patterns[currentIndex + 1];
                        return (
                            <>
                                <div className={styles.header}>
                                    <h1 className={styles.title}>{t.grammarDiagnostic || "Grammar Diagnostic"}</h1>
                                    <div className={styles.progress}>
                                        {currentIndex + 1} / {patterns.length}
                                    </div>
                                </div>

                                <div className={styles.cardStack}>
                                    <AnimatePresence mode="popLayout">
                                        {nextPattern && (
                                            <DiagnosticCard
                                                key={nextPattern.id}
                                                pattern={nextPattern}
                                                onSwipe={() => {}}
                                                isTop={false}
                                                knowLabel={t.grammarKnow || "Know"}
                                                dontKnowLabel={t.grammarDontKnow || "Don't Know"}
                                            />
                                        )}
                                        {currentPattern && (
                                            <DiagnosticCard
                                                key={currentPattern.id}
                                                pattern={currentPattern}
                                                onSwipe={handleSwipe}
                                                isTop={true}
                                                knowLabel={t.grammarKnow || "Know"}
                                                dontKnowLabel={t.grammarDontKnow || "Don't Know"}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className={styles.statsBar}>
                                    <span className={styles.knownCount}>
                                        <CheckCircle size={16} /> {knownPatterns.length}
                                    </span>
                                    <span className={styles.unknownCount}>
                                        <XCircle size={16} /> {unknownPatterns.length}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </>
            )}
        </div>
    );
}
