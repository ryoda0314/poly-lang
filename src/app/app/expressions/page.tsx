"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bookmark, Languages, Lightbulb, BookOpen, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { useCollectionsStore } from "@/store/collections-store";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface TranslationSuggestion {
    text: string;
    formality: string;
    nuance: string;
}

interface ExampleSentence {
    sentence: string;
    translation: string;
    context: string;
}

interface ExpressionResult {
    nativeText: string;
    isPartialPhrase: boolean;
    suggestions: TranslationSuggestion[];
    keyPoints: string[];
    explanation: string;
}

const formalityLabels: Record<string, Record<string, string>> = {
    ja: { casual: "カジュアル", standard: "標準", formal: "フォーマル", polite: "丁寧" },
    en: { casual: "Casual", standard: "Standard", formal: "Formal", polite: "Polite" },
    ko: { casual: "반말", standard: "표준", formal: "격식체", polite: "존댓말" },
    zh: { casual: "口语", standard: "标准", formal: "正式", polite: "敬语" },
    fr: { casual: "Familier", standard: "Standard", formal: "Formel", polite: "Poli" },
    es: { casual: "Informal", standard: "Estándar", formal: "Formal", polite: "Cortés" },
    de: { casual: "Umgangssprache", standard: "Standard", formal: "Förmlich", polite: "Höflich" },
    ru: { casual: "Разговорный", standard: "Стандартный", formal: "Формальный", polite: "Вежливый" },
    vi: { casual: "Thân mật", standard: "Tiêu chuẩn", formal: "Trang trọng", polite: "Lịch sự" },
};

export default function ExpressionsPage() {
    const { user, nativeLanguage, activeLanguageCode } = useAppStore();
    const { savePhraseToCollection } = useCollectionsStore();
    const { logEvent } = useHistoryStore();
    const t = translations[nativeLanguage] || translations.ja;

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ExpressionResult | null>(null);
    const [savedExampleKey, setSavedExampleKey] = useState<string | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [examples, setExamples] = useState<Record<number, ExampleSentence[]>>({});
    const [loadingExamples, setLoadingExamples] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const getLabel = (key: string, fallback: string) => {
        return (t as Record<string, string>)[key] || fallback;
    };

    const getFormalityLabel = (formality: string) => {
        const labels = formalityLabels[nativeLanguage] || formalityLabels.ja;
        return labels[formality] || formality;
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSubmit = async () => {
        if (!input.trim() || isLoading) return;

        const nativeText = input.trim();
        setIsLoading(true);
        setResult(null);
        setSavedExampleKey(null);
        setExpandedIndex(null);
        setExamples({});
        setLoadingExamples(null);

        try {
            const response = await fetch("/api/expression/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nativeText,
                    learningLanguage: activeLanguageCode,
                    nativeLanguage,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Translation failed");
            }

            const data = await response.json();
            setResult({
                nativeText,
                isPartialPhrase: data.isPartialPhrase || false,
                suggestions: data.suggestions || [],
                keyPoints: data.keyPoints || [],
                explanation: data.explanation || "",
            });

            // Log event
            logEvent(TRACKING_EVENTS.EXPRESSION_TRANSLATE, 0, {
                nativeText,
                learningLanguage: activeLanguageCode,
                suggestionsCount: data.suggestions?.length || 0,
            });
        } catch (error) {
            console.error("Translation error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSaveExample = async (example: ExampleSentence, suggestionIndex: number, exampleIndex: number) => {
        if (!user || !result) return;

        try {
            await savePhraseToCollection(
                user.id,
                activeLanguageCode,
                example.sentence,
                example.translation,
                null
            );
            setSavedExampleKey(`${suggestionIndex}-${exampleIndex}`);
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const handleToggleExamples = async (suggestion: TranslationSuggestion, index: number) => {
        // If already expanded, collapse
        if (expandedIndex === index) {
            setExpandedIndex(null);
            return;
        }

        setExpandedIndex(index);

        // If examples already loaded, don't fetch again
        if (examples[index]) {
            return;
        }

        // Fetch examples
        setLoadingExamples(index);
        try {
            const response = await fetch("/api/expression/examples", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phrase: suggestion.text,
                    learningLanguage: activeLanguageCode,
                    nativeLanguage,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch examples");
            }

            const data = await response.json();
            setExamples(prev => ({
                ...prev,
                [index]: data.examples || []
            }));

            // Log event
            logEvent(TRACKING_EVENTS.EXPRESSION_EXAMPLES, 0, {
                phrase: suggestion.text,
                learningLanguage: activeLanguageCode,
                examplesCount: data.examples?.length || 0,
            });
        } catch (error) {
            console.error("Examples fetch error:", error);
            setExamples(prev => ({
                ...prev,
                [index]: []
            }));
        } finally {
            setLoadingExamples(null);
        }
    };

    const formalityColor = (formality: string) => {
        switch (formality) {
            case "casual": return styles.formalityCasual;
            case "standard": return styles.formalityStandard;
            case "formal": return styles.formalityFormal;
            case "polite": return styles.formalityPolite;
            default: return styles.formalityStandard;
        }
    };

    return (
        <div className={styles.container}>
            {/* Input Card */}
            <div className={styles.inputCard}>
                <div className={styles.inputSection}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getLabel("expressionInputPlaceholder", "母語で表現を入力...")}
                        className={styles.input}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isLoading}
                        className={styles.sendButton}
                        aria-label="Translate"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className={styles.spin} />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {!result && !isLoading && (
                <div className={styles.previewCard}>
                    <Languages size={48} className={styles.previewIcon} />
                    <p className={styles.previewHint}>
                        {getLabel("expressionPreviewHint", "母語で表現を入力すると、学習言語での自然な言い方を提案します")}
                    </p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className={styles.loadingCard}>
                    <Loader2 size={32} className={styles.spin} />
                    <p>{getLabel("expressionLoading", "翻訳中...")}</p>
                </div>
            )}

            {/* Result */}
            {result && !isLoading && (
                <motion.div
                    className={styles.resultCard}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Native Text */}
                    <div className={styles.nativeText}>
                        "{result.nativeText}"
                    </div>

                    {/* Suggestions */}
                    <div className={styles.suggestionsSection}>
                        <h3 className={styles.sectionTitle}>
                            <BookOpen size={18} />
                            {getLabel("expressionSuggestions", "翻訳候補")}
                        </h3>
                        <div className={styles.suggestionsList}>
                            {result.suggestions.map((suggestion, index) => (
                                <div key={index} className={styles.suggestionCard}>
                                    <div className={styles.suggestionHeader}>
                                        <span className={clsx(styles.formalityBadge, formalityColor(suggestion.formality))}>
                                            {getFormalityLabel(suggestion.formality)}
                                        </span>
                                    </div>
                                    {result.isPartialPhrase ? (
                                        <button
                                            className={styles.suggestionTextClickable}
                                            onClick={() => handleToggleExamples(suggestion, index)}
                                        >
                                            <span>{suggestion.text}</span>
                                            <span className={styles.examplesHint}>
                                                {expandedIndex === index ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} />
                                                        {getLabel("expressionShowExamples", "例文を見る")}
                                                        <ChevronDown size={16} />
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    ) : (
                                        <p className={styles.suggestionText}>{suggestion.text}</p>
                                    )}
                                    <p className={styles.suggestionNuance}>{suggestion.nuance}</p>

                                    {/* Examples Section */}
                                    <AnimatePresence>
                                        {expandedIndex === index && (
                                            <motion.div
                                                className={styles.examplesSection}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {loadingExamples === index ? (
                                                    <div className={styles.examplesLoading}>
                                                        <Loader2 size={18} className={styles.spin} />
                                                        <span>{getLabel("expressionLoadingExamples", "例文を生成中...")}</span>
                                                    </div>
                                                ) : examples[index]?.length > 0 ? (
                                                    <div className={styles.examplesList}>
                                                        {examples[index].map((example, exIdx) => (
                                                            <div key={exIdx} className={styles.exampleItem}>
                                                                <div className={styles.exampleHeader}>
                                                                    <p className={styles.exampleSentence}>{example.sentence}</p>
                                                                    <button
                                                                        className={clsx(
                                                                            styles.saveButton,
                                                                            savedExampleKey === `${index}-${exIdx}` && styles.saved
                                                                        )}
                                                                        onClick={() => handleSaveExample(example, index, exIdx)}
                                                                        disabled={savedExampleKey === `${index}-${exIdx}`}
                                                                    >
                                                                        {savedExampleKey === `${index}-${exIdx}` ? (
                                                                            <Check size={16} />
                                                                        ) : (
                                                                            <Bookmark size={16} />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <p className={styles.exampleTranslation}>{example.translation}</p>
                                                                {example.context && (
                                                                    <p className={styles.exampleContext}>{example.context}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className={styles.noExamples}>
                                                        {getLabel("expressionNoExamples", "例文を生成できませんでした")}
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key Points */}
                    {result.keyPoints.length > 0 && (
                        <div className={styles.keyPointsSection}>
                            <h3 className={styles.sectionTitle}>
                                <Lightbulb size={18} />
                                {getLabel("expressionKeyPoints", "ポイント")}
                            </h3>
                            <ul className={styles.keyPointsList}>
                                {result.keyPoints.map((point, index) => (
                                    <li key={index} className={styles.keyPoint}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Explanation */}
                    {result.explanation && (
                        <div className={styles.explanationSection}>
                            <h3 className={styles.sectionTitle}>
                                {getLabel("expressionExplanation", "解説")}
                            </h3>
                            <p className={styles.explanationText}>{result.explanation}</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}