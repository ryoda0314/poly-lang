"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { generateCardData } from "@/actions/generate-card-data";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

// Reading field configuration by language - labels use translation keys
const READING_CONFIG_KEYS: Record<string, { labelKey: string; placeholder: string; hintKey: string } | null> = {
    zh: { labelKey: "readingPinyin", placeholder: "pīn yīn", hintKey: "hintPinyin" },
    ja: { labelKey: "readingFurigana", placeholder: "よみがな", hintKey: "hintFurigana" },
    ko: { labelKey: "readingPronKo", placeholder: "bal-eum", hintKey: "hintPronKo" },
    en: { labelKey: "readingIPA", placeholder: "/prəˌnʌnsiˈeɪʃən/", hintKey: "hintIPA" },
    fr: { labelKey: "readingIPA", placeholder: "/pʁɔnɔ̃sjasjɔ̃/", hintKey: "hintIPA" },
    es: { labelKey: "readingIPA", placeholder: "/pɾonunθjaˈθjon/", hintKey: "hintIPA" },
    de: { labelKey: "readingIPA", placeholder: "/aʊ̯sˈʃpʁaːxə/", hintKey: "hintIPA" },
    ru: { labelKey: "readingRomanRu", placeholder: "proiznoshenie", hintKey: "hintRomanRu" },
    vi: { labelKey: "readingToneVi", placeholder: "thanh điệu", hintKey: "hintToneVi" },
};

interface EditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: { target_text: string; translation: string; tokens?: string[] }) => Promise<void>;
    initialData: {
        targetText: string;
        translation: string;
        reading: string;
    };
    targetLang: string;
    nativeLang: string;
}

export function EditCardModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    targetLang,
    nativeLang,
}: EditCardModalProps) {
    const [targetText, setTargetText] = useState(initialData.targetText);
    const [translation, setTranslation] = useState(initialData.translation);
    const [reading, setReading] = useState(initialData.reading);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingReading, setIsGeneratingReading] = useState(false);
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as Record<string, string>;

    const readingConfigKeys = READING_CONFIG_KEYS[targetLang] || null;
    const readingConfig = readingConfigKeys ? {
        label: t[readingConfigKeys.labelKey] || readingConfigKeys.labelKey,
        placeholder: readingConfigKeys.placeholder,
        hint: t[readingConfigKeys.hintKey] || readingConfigKeys.hintKey,
    } : null;

    // Reset form when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            setTargetText(initialData.targetText);
            setTranslation(initialData.translation);
            setReading(initialData.reading);
        }
    }, [isOpen, initialData]);

    const handleGenerateReading = async () => {
        if (!targetText.trim() || isGeneratingReading) return;

        setIsGeneratingReading(true);
        try {
            const result = await generateCardData(
                [{ targetText: targetText.trim(), translation: translation.trim(), reading: "" }],
                targetLang,
                nativeLang,
                { generateReading: true, generateTranslation: false }
            );

            if (result.success && result.cards && result.cards[0]) {
                setReading(result.cards[0].reading || "");
            }
        } catch (error) {
            console.error("Failed to generate reading:", error);
        } finally {
            setIsGeneratingReading(false);
        }
    };

    const handleSubmit = async () => {
        if (!targetText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const tokens: string[] = [];
            if (reading.trim()) {
                tokens.push(`__reading__:${reading.trim()}`);
            }

            await onSave({
                target_text: targetText.trim(),
                translation: translation.trim(),
                tokens: tokens.length > 0 ? tokens : undefined,
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTargetText(initialData.targetText);
        setTranslation(initialData.translation);
        setReading(initialData.reading);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem",
            }}
            onClick={handleClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                    background: "var(--color-bg)",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "440px",
                    maxHeight: "90vh",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                        {t.editCardTitle || "カードを編集"}
                    </h3>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "var(--color-surface)",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            color: "var(--color-fg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: "1.5rem",
                    overflowY: "auto",
                    flex: 1,
                }}>
                    {/* Target Text */}
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{
                            display: "block",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "var(--color-fg-muted)",
                            marginBottom: "0.25rem",
                        }}>
                            {t.editCardTargetLabel || "学習テキスト"} *
                        </label>
                        <input
                            type="text"
                            value={targetText}
                            onChange={(e) => setTargetText(e.target.value)}
                            placeholder="例: 你好 / Hello / Bonjour"
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "1px solid var(--color-border)",
                                borderRadius: "8px",
                                background: "var(--color-bg)",
                                color: "var(--color-fg)",
                                fontSize: "1rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Reading (Language-specific) */}
                    {readingConfig && (
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "var(--color-fg-muted)",
                                marginBottom: "0.25rem",
                            }}>
                                {readingConfig.label}
                                <span style={{
                                    fontSize: "0.65rem",
                                    color: "var(--color-fg-muted)",
                                    fontWeight: 400,
                                }}>
                                    ({readingConfig.hint})
                                </span>
                            </label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                    type="text"
                                    value={reading}
                                    onChange={(e) => setReading(e.target.value)}
                                    placeholder={readingConfig.placeholder}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "8px",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontSize: "1rem",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    onClick={handleGenerateReading}
                                    disabled={!targetText.trim() || isGeneratingReading}
                                    title={t.editCardAutoGenerate || "自動生成"}
                                    style={{
                                        padding: "0.75rem",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "8px",
                                        background: "var(--color-surface)",
                                        color: isGeneratingReading ? "var(--color-fg-muted)" : "var(--color-accent)",
                                        cursor: !targetText.trim() || isGeneratingReading ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: !targetText.trim() ? 0.5 : 1,
                                    }}
                                >
                                    {isGeneratingReading ? (
                                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                                    ) : (
                                        <Wand2 size={18} />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Translation */}
                    <div>
                        <label style={{
                            display: "block",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "var(--color-fg-muted)",
                            marginBottom: "0.25rem",
                        }}>
                            {t.editCardTranslation || "翻訳"}
                        </label>
                        <input
                            type="text"
                            value={translation}
                            onChange={(e) => setTranslation(e.target.value)}
                            placeholder={t.editCardNativeMeaning || "母語の意味"}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "1px solid var(--color-border)",
                                borderRadius: "8px",
                                background: "var(--color-bg)",
                                color: "var(--color-fg)",
                                fontSize: "1rem",
                                outline: "none",
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "1rem 1.5rem 1.5rem",
                    borderTop: "1px solid var(--color-border)",
                    display: "flex",
                    gap: "0.75rem",
                    flexShrink: 0,
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            flex: 1,
                            padding: "0.875rem",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            color: "var(--color-fg)",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                        }}
                    >
                        {t.commonCancel || "キャンセル"}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!targetText.trim() || isSubmitting}
                        style={{
                            flex: 1,
                            padding: "0.875rem",
                            background: targetText.trim() ? "var(--color-accent)" : "var(--color-border)",
                            border: "none",
                            borderRadius: "12px",
                            cursor: targetText.trim() && !isSubmitting ? "pointer" : "not-allowed",
                            color: "white",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                {t.commonSaving || "保存中..."}
                            </>
                        ) : (
                            t.commonSave || "保存"
                        )}
                    </button>
                </div>
            </motion.div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
