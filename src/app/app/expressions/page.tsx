"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bookmark, Trash2 } from "lucide-react";
import { useExpressionStore, Expression, TranslationSuggestion } from "@/store/expression-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

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
    const {
        currentExpression,
        setCurrentExpression,
        savedExpressions,
        saveExpression,
        removeExpression,
        isLoading,
        setIsLoading,
    } = useExpressionStore();

    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const [input, setInput] = useState("");
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
        setCurrentExpression(null);

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

            const expression: Expression = {
                id: `expr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                nativeText,
                suggestions: data.suggestions || [],
                keyPoints: data.keyPoints || [],
                explanation: data.explanation || "",
                learningLanguage: activeLanguageCode,
                nativeLanguage,
                timestamp: Date.now(),
            };

            setCurrentExpression(expression);
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

    const handleSave = () => {
        if (currentExpression) {
            saveExpression(currentExpression);
            setInput("");
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
            {/* Left: Input + Result */}
            <div className={styles.leftPanel}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{getLabel("expressionPageTitle", "表現翻訳")}</h1>
                </div>

                {/* Input Area */}
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

                {/* Result Area */}
                <div className={styles.resultArea}>
                    {!currentExpression && !isLoading && (
                        <div className={styles.emptyState}>
                            <p>{getLabel("expressionEmptyState", "母語で表現を入力すると、学習言語での言い方を提案します")}</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spin} />
                            <p>{getLabel("expressionLoading", "翻訳中...")}</p>
                        </div>
                    )}

                    {currentExpression && !isLoading && (
                        <motion.div
                            className={styles.result}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Native Text */}
                            <div className={styles.nativeText}>
                                <span className={styles.nativeLabel}>{getLabel("expressionOriginal", "入力")}</span>
                                {currentExpression.nativeText}
                            </div>

                            {/* Suggestions */}
                            <div className={styles.suggestionsSection}>
                                <h3 className={styles.sectionTitle}>
                                    {getLabel("expressionSuggestions", "翻訳候補")}
                                </h3>
                                <div className={styles.suggestionsList}>
                                    {currentExpression.suggestions.map((suggestion: TranslationSuggestion, index: number) => (
                                        <div key={index} className={styles.suggestionCard}>
                                            <div className={styles.suggestionHeader}>
                                                <span className={clsx(styles.formalityBadge, formalityColor(suggestion.formality))}>
                                                    {getFormalityLabel(suggestion.formality)}
                                                </span>
                                            </div>
                                            <p className={styles.suggestionText}>{suggestion.text}</p>
                                            <p className={styles.suggestionNuance}>{suggestion.nuance}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Key Points */}
                            {currentExpression.keyPoints.length > 0 && (
                                <div className={styles.keyPointsSection}>
                                    <h3 className={styles.sectionTitle}>
                                        {getLabel("expressionKeyPoints", "ポイント")}
                                    </h3>
                                    <ul className={styles.keyPointsList}>
                                        {currentExpression.keyPoints.map((point: string, index: number) => (
                                            <li key={index} className={styles.keyPoint}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Explanation */}
                            {currentExpression.explanation && (
                                <div className={styles.explanationSection}>
                                    <h3 className={styles.sectionTitle}>
                                        {getLabel("expressionExplanation", "解説")}
                                    </h3>
                                    <p className={styles.explanationText}>{currentExpression.explanation}</p>
                                </div>
                            )}

                            {/* Save Button */}
                            <button className={styles.saveButton} onClick={handleSave}>
                                <Bookmark size={18} />
                                {getLabel("expressionSave", "保存する")}
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Right: Saved Expressions */}
            <div className={styles.rightPanel}>
                <div className={styles.savedHeader}>
                    <h2 className={styles.savedTitle}>
                        {getLabel("expressionSavedTitle", "保存した表現")}
                    </h2>
                    <span className={styles.savedCount}>{savedExpressions.length}</span>
                </div>

                <div className={styles.savedList}>
                    {savedExpressions.length === 0 && (
                        <div className={styles.savedEmpty}>
                            <Bookmark size={32} strokeWidth={1.5} />
                            <p>{getLabel("expressionNoSaved", "保存した表現はありません")}</p>
                        </div>
                    )}

                    <AnimatePresence>
                        {savedExpressions.map((expr) => (
                            <motion.div
                                key={expr.id}
                                className={styles.savedCard}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={styles.savedCardHeader}>
                                    <span className={styles.savedNative}>{expr.nativeText}</span>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => removeExpression(expr.id)}
                                        aria-label="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className={styles.savedSuggestions}>
                                    {expr.suggestions.slice(0, 2).map((s: TranslationSuggestion, i: number) => (
                                        <div key={i} className={styles.savedSuggestion}>
                                            <span className={clsx(styles.formalityBadgeSmall, formalityColor(s.formality))}>
                                                {getFormalityLabel(s.formality)}
                                            </span>
                                            <span className={styles.savedSuggestionText}>{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className={styles.savedTimestamp}>
                                    {new Date(expr.timestamp).toLocaleDateString()}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
