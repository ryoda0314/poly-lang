"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Type, Upload, Loader2, Clock, ExternalLink, CheckCircle2, XCircle, Images, FileText, Sparkles, Settings2, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createExtractionJob } from "@/actions/extraction-job";
import { generateCardData } from "@/actions/generate-card-data";

// Reading field configuration by language
const READING_CONFIG: Record<string, { label: string; placeholder: string; hint: string } | null> = {
    zh: { label: "ピンイン", placeholder: "pīn yīn", hint: "中国語の発音記号" },
    ja: { label: "読み仮名", placeholder: "よみがな", hint: "漢字の読み方" },
    ko: { label: "発音", placeholder: "bal-eum", hint: "韓国語のローマ字表記" },
    en: { label: "発音記号 (IPA)", placeholder: "/prəˌnʌnsiˈeɪʃən/", hint: "国際音声記号" },
    fr: { label: "発音記号 (IPA)", placeholder: "/pʁɔnɔ̃sjasjɔ̃/", hint: "国際音声記号" },
    es: { label: "発音記号 (IPA)", placeholder: "/pɾonunθjaˈθjon/", hint: "国際音声記号" },
    de: { label: "発音記号 (IPA)", placeholder: "/aʊ̯sˈʃpʁaːxə/", hint: "国際音声記号" },
    ru: { label: "発音 (ローマ字)", placeholder: "proiznoshenie", hint: "キリル文字のローマ字表記" },
    vi: { label: "声調記号", placeholder: "thanh điệu", hint: "ベトナム語の声調" },
};

interface CardInput {
    id: string;
    targetText: string;
    translation: string;
    reading: string;
}

interface ImageUploadStatus {
    id: string;
    fileName: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface ParsedCard {
    id: string;
    targetText: string;
    translation: string;
    reading: string;
}

type ParseMode = 'auto' | 'line' | 'tab' | 'comma' | 'arrow';

interface AddSwipeCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (cards: { target_text: string; translation: string; tokens?: string[] }[]) => Promise<void>;
    targetLang: string;
    nativeLang: string;
}

export function AddSwipeCardModal({
    isOpen,
    onClose,
    onAdd,
    targetLang,
    nativeLang,
}: AddSwipeCardModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'manual' | 'text' | 'image'>('manual');
    const [cards, setCards] = useState<CardInput[]>([
        { id: "1", targetText: "", translation: "", reading: "" }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatuses, setUploadStatuses] = useState<ImageUploadStatus[]>([]);
    const [jobsSubmitted, setJobsSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Text input state
    const [bulkText, setBulkText] = useState("");
    const [parseMode, setParseMode] = useState<ParseMode>('auto');
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [showParsedPreview, setShowParsedPreview] = useState(false);

    // Generation options
    const [includeReading, setIncludeReading] = useState(true);
    const [autoGenerateTranslation, setAutoGenerateTranslation] = useState(true);
    const [autoGenerateReading, setAutoGenerateReading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);

    const readingConfig = READING_CONFIG[targetLang] || null;

    // Parse bulk text into cards
    const parseText = useCallback((text: string, mode: ParseMode): ParsedCard[] => {
        const lines = text.split('\n').filter(line => line.trim());
        const cards: ParsedCard[] = [];

        for (const line of lines) {
            let targetText = '';
            let translation = '';
            let reading = '';

            if (mode === 'auto') {
                // Auto-detect format
                if (line.includes('\t')) {
                    // Tab-separated
                    const parts = line.split('\t').map(p => p.trim());
                    targetText = parts[0] || '';
                    translation = parts[1] || '';
                    reading = parts[2] || '';
                } else if (line.includes(' → ') || line.includes(' -> ')) {
                    // Arrow format
                    const parts = line.split(/\s*(?:→|->)\s*/).map(p => p.trim());
                    targetText = parts[0] || '';
                    translation = parts[1] || '';
                } else if (line.includes(' - ')) {
                    // Dash format
                    const parts = line.split(' - ').map(p => p.trim());
                    targetText = parts[0] || '';
                    translation = parts[1] || '';
                } else if (line.includes('：') || line.includes(':')) {
                    // Colon format
                    const parts = line.split(/[：:]/).map(p => p.trim());
                    targetText = parts[0] || '';
                    translation = parts[1] || '';
                } else if (line.includes(',') || line.includes('、')) {
                    // Comma format
                    const parts = line.split(/[,、]/).map(p => p.trim());
                    targetText = parts[0] || '';
                    translation = parts[1] || '';
                } else {
                    // Single word/phrase - just target text
                    targetText = line.trim();
                }
            } else if (mode === 'line') {
                // Each line is a single card (target text only)
                targetText = line.trim();
            } else if (mode === 'tab') {
                const parts = line.split('\t').map(p => p.trim());
                targetText = parts[0] || '';
                translation = parts[1] || '';
                reading = parts[2] || '';
            } else if (mode === 'comma') {
                const parts = line.split(/[,、]/).map(p => p.trim());
                targetText = parts[0] || '';
                translation = parts[1] || '';
                reading = parts[2] || '';
            } else if (mode === 'arrow') {
                const parts = line.split(/\s*(?:→|->|-|：|:)\s*/).map(p => p.trim());
                targetText = parts[0] || '';
                translation = parts[1] || '';
            }

            if (targetText) {
                cards.push({
                    id: `${Date.now()}-${cards.length}`,
                    targetText,
                    translation,
                    reading,
                });
            }
        }

        return cards;
    }, []);

    // Auto-parse when text changes
    const handleBulkTextChange = (text: string) => {
        setBulkText(text);
        if (text.trim()) {
            const parsed = parseText(text, parseMode);
            setParsedCards(parsed);
            setShowParsedPreview(parsed.length > 0);
        } else {
            setParsedCards([]);
            setShowParsedPreview(false);
        }
    };

    // Re-parse when mode changes
    const handleParseModeChange = (mode: ParseMode) => {
        setParseMode(mode);
        if (bulkText.trim()) {
            const parsed = parseText(bulkText, mode);
            setParsedCards(parsed);
        }
    };

    // Edit parsed card
    const handleParsedCardChange = (id: string, field: keyof ParsedCard, value: string) => {
        setParsedCards(cards => cards.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Remove parsed card
    const handleRemoveParsedCard = (id: string) => {
        setParsedCards(cards => cards.filter(c => c.id !== id));
    };

    // Process cards with auto-generation
    const processCardsWithGeneration = async (inputCards: { targetText: string; translation: string; reading: string }[]) => {
        const needsGeneration = (autoGenerateTranslation || autoGenerateReading) &&
            inputCards.some(c =>
                (autoGenerateTranslation && !c.translation.trim()) ||
                (autoGenerateReading && includeReading && !c.reading.trim())
            );

        if (!needsGeneration) {
            return inputCards;
        }

        setIsGenerating(true);
        try {
            const result = await generateCardData(
                inputCards,
                targetLang,
                nativeLang,
                {
                    generateReading: autoGenerateReading && includeReading,
                    generateTranslation: autoGenerateTranslation,
                }
            );

            if (result.success && result.cards) {
                return result.cards;
            }
            // If generation fails, continue with original cards
            console.warn("Auto-generation failed, using original cards");
            return inputCards;
        } catch (error) {
            console.error("Generation error:", error);
            return inputCards;
        } finally {
            setIsGenerating(false);
        }
    };

    // Submit parsed cards
    const handleSubmitParsed = async () => {
        const validCards = parsedCards.filter(c => c.targetText.trim());
        if (validCards.length === 0 || isSubmitting || isGenerating) return;

        setIsSubmitting(true);
        try {
            // Process with auto-generation
            const processedCards = await processCardsWithGeneration(validCards);

            const formattedCards = processedCards.map(card => {
                const tokens: string[] = [];
                if (includeReading && card.reading.trim()) {
                    tokens.push(`__reading__:${card.reading.trim()}`);
                }
                return {
                    target_text: card.targetText.trim(),
                    translation: card.translation.trim(),
                    tokens: tokens.length > 0 ? tokens : undefined,
                };
            });

            await onAdd(formattedCards);
            setBulkText("");
            setParsedCards([]);
            setShowParsedPreview(false);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Compress image to reduce payload size while keeping text readable
    const compressImage = useCallback((file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                let { width, height } = img;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = () => reject(new Error('Failed to load image'));

            // Read file as data URL
            const reader = new FileReader();
            reader.onload = () => {
                img.src = reader.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    const processMultipleImages = async (files: File[]) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setIsAnalyzing(true);
        setJobsSubmitted(false);

        // Initialize statuses for all files
        const initialStatuses: ImageUploadStatus[] = imageFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            fileName: file.name,
            status: 'pending'
        }));
        setUploadStatuses(initialStatuses);

        // Process each file sequentially
        const updatedStatuses = [...initialStatuses];
        let hasAnySuccess = false;

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];

            // Update status to uploading
            updatedStatuses[i] = { ...updatedStatuses[i], status: 'uploading' };
            setUploadStatuses([...updatedStatuses]);

            try {
                const base64 = await compressImage(file);
                console.log(`Compressed image ${file.name}:`, Math.round(base64.length / 1024), 'KB');
                const result = await createExtractionJob(base64, targetLang, nativeLang, undefined, {
                    includeReading,
                    autoGenerateTranslation,
                    autoGenerateReading,
                });

                if (result.success) {
                    updatedStatuses[i] = { ...updatedStatuses[i], status: 'success' };
                    hasAnySuccess = true;
                } else {
                    updatedStatuses[i] = {
                        ...updatedStatuses[i],
                        status: 'error',
                        error: result.error || "処理に失敗しました"
                    };
                }
            } catch (error) {
                console.error(`Image upload error for ${file.name}:`, error);
                updatedStatuses[i] = {
                    ...updatedStatuses[i],
                    status: 'error',
                    error: "アップロードに失敗しました"
                };
            }

            setUploadStatuses([...updatedStatuses]);
        }

        setIsAnalyzing(false);
        if (hasAnySuccess) {
            setJobsSubmitted(true);
        }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await processMultipleImages(files);
        }
    }, [targetLang, nativeLang, compressImage]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleAddCard = () => {
        setCards([...cards, { id: Date.now().toString(), targetText: "", translation: "", reading: "" }]);
    };

    const handleRemoveCard = (id: string) => {
        if (cards.length > 1) {
            setCards(cards.filter(c => c.id !== id));
        }
    };

    const handleCardChange = (id: string, field: keyof CardInput, value: string) => {
        setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleSubmit = async () => {
        const validCards = cards.filter(c => c.targetText.trim());
        if (validCards.length === 0 || isSubmitting || isGenerating) return;

        setIsSubmitting(true);
        try {
            // Process with auto-generation
            const processedCards = await processCardsWithGeneration(validCards);

            const formattedCards = processedCards.map(card => {
                const tokens: string[] = [];
                if (includeReading && card.reading.trim()) {
                    tokens.push(`__reading__:${card.reading.trim()}`);
                }
                return {
                    target_text: card.targetText.trim(),
                    translation: card.translation.trim(),
                    tokens: tokens.length > 0 ? tokens : undefined,
                };
            });

            await onAdd(formattedCards);
            setCards([{ id: "1", targetText: "", translation: "", reading: "" }]);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setCards([{ id: "1", targetText: "", translation: "", reading: "" }]);
        setActiveTab('manual');
        setJobsSubmitted(false);
        setUploadStatuses([]);
        setBulkText("");
        setParsedCards([]);
        setShowParsedPreview(false);
        setShowOptions(false);
        onClose();
    };

    const handleGoToHistory = () => {
        handleClose();
        router.push('/app/extraction-history');
    };

    const handleUploadMore = () => {
        setJobsSubmitted(false);
        setUploadStatuses([]);
        fileInputRef.current?.click();
    };

    if (!isOpen) return null;

    const validCount = cards.filter(c => c.targetText.trim()).length;
    const parsedValidCount = parsedCards.filter(c => c.targetText.trim()).length;
    const successCount = uploadStatuses.filter(s => s.status === 'success').length;
    const errorCount = uploadStatuses.filter(s => s.status === 'error').length;

    // Options Panel Component
    const OptionsPanel = () => (
        <div style={{
            background: "var(--color-surface)",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid var(--color-border)",
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                color: "var(--color-fg)",
                fontWeight: 600,
                fontSize: "0.85rem",
            }}>
                <Settings2 size={16} />
                追加オプション
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {/* Include Reading Toggle */}
                {readingConfig && (
                    <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "var(--color-fg)",
                    }}>
                        <input
                            type="checkbox"
                            checked={includeReading}
                            onChange={(e) => setIncludeReading(e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                        />
                        <span>{readingConfig.label}を追加</span>
                    </label>
                )}

                {/* Auto Generate Translation */}
                <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "var(--color-fg)",
                }}>
                    <input
                        type="checkbox"
                        checked={autoGenerateTranslation}
                        onChange={(e) => setAutoGenerateTranslation(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                    />
                    <span>翻訳を自動生成</span>
                    <Wand2 size={14} style={{ color: "var(--color-accent)", marginLeft: "auto" }} />
                </label>

                {/* Auto Generate Reading */}
                {readingConfig && includeReading && (
                    <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "var(--color-fg)",
                    }}>
                        <input
                            type="checkbox"
                            checked={autoGenerateReading}
                            onChange={(e) => setAutoGenerateReading(e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                        />
                        <span>{readingConfig.label}を自動生成</span>
                        <Wand2 size={14} style={{ color: "var(--color-accent)", marginLeft: "auto" }} />
                    </label>
                )}
            </div>

            {(autoGenerateTranslation || (autoGenerateReading && includeReading)) && (
                <p style={{
                    margin: "0.75rem 0 0 0",
                    fontSize: "0.75rem",
                    color: "var(--color-fg-muted)",
                    background: "var(--color-bg)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                }}>
                    <Sparkles size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                    空欄のフィールドはAIが自動で入力します
                </p>
            )}
        </div>
    );

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
                    maxWidth: "540px",
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
                        カードを追加
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            style={{
                                background: showOptions ? "var(--color-accent)" : "var(--color-surface)",
                                border: "none",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "50%",
                                color: showOptions ? "white" : "var(--color-fg-muted)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                        >
                            <Settings2 size={18} />
                        </button>
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
                </div>

                {/* Tabs */}
                <div style={{
                    display: "flex",
                    padding: "0.75rem 1rem",
                    gap: "0.375rem",
                    borderBottom: "1px solid var(--color-border)",
                    flexShrink: 0
                }}>
                    <button
                        onClick={() => setActiveTab('manual')}
                        style={{
                            flex: 1,
                            padding: "0.625rem 0.5rem",
                            borderRadius: "10px",
                            border: "none",
                            background: activeTab === 'manual' ? "var(--color-accent)" : "var(--color-surface)",
                            color: activeTab === 'manual' ? "white" : "var(--color-fg)",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                        }}
                    >
                        <Type size={14} />
                        手動
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        style={{
                            flex: 1,
                            padding: "0.625rem 0.5rem",
                            borderRadius: "10px",
                            border: "none",
                            background: activeTab === 'text' ? "var(--color-accent)" : "var(--color-surface)",
                            color: activeTab === 'text' ? "white" : "var(--color-fg)",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                        }}
                    >
                        <FileText size={14} />
                        テキスト
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        style={{
                            flex: 1,
                            padding: "0.625rem 0.5rem",
                            borderRadius: "10px",
                            border: "none",
                            background: activeTab === 'image' ? "var(--color-accent)" : "var(--color-surface)",
                            color: activeTab === 'image' ? "white" : "var(--color-fg)",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                        }}
                    >
                        <Images size={14} />
                        画像
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: "1.5rem",
                    overflowY: "auto",
                    flex: 1,
                }}>
                    {/* Options Panel (collapsible) */}
                    <AnimatePresence>
                        {showOptions && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <OptionsPanel />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'manual' ? (
                        <>
                            <AnimatePresence mode="popLayout">
                                {cards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{
                                            background: "var(--color-surface)",
                                            borderRadius: "12px",
                                            padding: "1rem",
                                            marginBottom: "1rem",
                                            border: "1px solid var(--color-border)",
                                        }}
                                    >
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "0.75rem",
                                        }}>
                                            <span style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                color: "var(--color-fg-muted)",
                                                textTransform: "uppercase",
                                            }}>
                                                カード {index + 1}
                                            </span>
                                            {cards.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveCard(card.id)}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        color: "#ef4444",
                                                        padding: "4px",
                                                        display: "flex",
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Target Text */}
                                        <div style={{ marginBottom: "0.75rem" }}>
                                            <label style={{
                                                display: "block",
                                                fontSize: "0.75rem",
                                                fontWeight: 500,
                                                color: "var(--color-fg-muted)",
                                                marginBottom: "0.25rem",
                                            }}>
                                                学習テキスト *
                                            </label>
                                            <input
                                                type="text"
                                                value={card.targetText}
                                                onChange={(e) => handleCardChange(card.id, "targetText", e.target.value)}
                                                placeholder="例: 你好 / Hello / こんにちは"
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
                                        {readingConfig && includeReading && (
                                            <div style={{ marginBottom: "0.75rem" }}>
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
                                                    {autoGenerateReading && (
                                                        <span style={{
                                                            fontSize: "0.65rem",
                                                            color: "var(--color-accent)",
                                                            background: "rgba(var(--color-accent-rgb), 0.1)",
                                                            padding: "2px 6px",
                                                            borderRadius: "4px",
                                                        }}>
                                                            自動生成
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={card.reading}
                                                    onChange={(e) => handleCardChange(card.id, "reading", e.target.value)}
                                                    placeholder={autoGenerateReading ? "空欄で自動生成" : readingConfig.placeholder}
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
                                        )}

                                        {/* Translation */}
                                        <div>
                                            <label style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                fontSize: "0.75rem",
                                                fontWeight: 500,
                                                color: "var(--color-fg-muted)",
                                                marginBottom: "0.25rem",
                                            }}>
                                                翻訳
                                                {autoGenerateTranslation && (
                                                    <span style={{
                                                        fontSize: "0.65rem",
                                                        color: "var(--color-accent)",
                                                        background: "rgba(var(--color-accent-rgb), 0.1)",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                    }}>
                                                        自動生成
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="text"
                                                value={card.translation}
                                                onChange={(e) => handleCardChange(card.id, "translation", e.target.value)}
                                                placeholder={autoGenerateTranslation ? "空欄で自動生成" : "日本語の意味"}
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
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Add another card */}
                            <button
                                onClick={handleAddCard}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    background: "transparent",
                                    border: "2px dashed var(--color-border)",
                                    borderRadius: "12px",
                                    color: "var(--color-fg-muted)",
                                    fontSize: "0.875rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "var(--color-accent)";
                                    e.currentTarget.style.color = "var(--color-accent)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--color-border)";
                                    e.currentTarget.style.color = "var(--color-fg-muted)";
                                }}
                            >
                                <Plus size={18} />
                                もう1枚追加
                            </button>
                        </>
                    ) : activeTab === 'text' ? (
                        <div>
                            {/* Text Input Area */}
                            <div style={{ marginBottom: "1rem" }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.5rem"
                                }}>
                                    <label style={{
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        color: "var(--color-fg-muted)",
                                    }}>
                                        テキストを入力
                                    </label>
                                    <select
                                        value={parseMode}
                                        onChange={(e) => handleParseModeChange(e.target.value as ParseMode)}
                                        style={{
                                            padding: "0.375rem 0.75rem",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "6px",
                                            background: "var(--color-surface)",
                                            color: "var(--color-fg)",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <option value="auto">自動検出</option>
                                        <option value="line">1行=1カード</option>
                                        <option value="tab">タブ区切り</option>
                                        <option value="comma">カンマ区切り</option>
                                        <option value="arrow">矢印区切り</option>
                                    </select>
                                </div>
                                <textarea
                                    value={bulkText}
                                    onChange={(e) => handleBulkTextChange(e.target.value)}
                                    placeholder={`例:\napple - りんご\nbanana - バナナ\norange → オレンジ\n\nまたは単語のみ:\napple\nbanana\norange`}
                                    style={{
                                        width: "100%",
                                        height: "120px",
                                        padding: "0.875rem",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "10px",
                                        background: "var(--color-surface)",
                                        color: "var(--color-fg)",
                                        fontSize: "0.95rem",
                                        resize: "none",
                                        outline: "none",
                                        fontFamily: "inherit",
                                        lineHeight: 1.5,
                                    }}
                                />
                                <p style={{
                                    margin: "0.5rem 0 0 0",
                                    fontSize: "0.75rem",
                                    color: "var(--color-fg-muted)",
                                }}>
                                    対応形式: タブ、カンマ、矢印(→)、ハイフン(-)、コロン(:)で区切り
                                </p>
                            </div>

                            {/* Parsed Preview */}
                            {showParsedPreview && parsedCards.length > 0 && (
                                <div>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "0.75rem",
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            color: "var(--color-fg)",
                                        }}>
                                            <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                                            プレビュー
                                        </div>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            color: "var(--color-fg-muted)",
                                            background: "var(--color-surface)",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "4px",
                                        }}>
                                            {parsedValidCount}件
                                        </span>
                                    </div>

                                    <div style={{
                                        maxHeight: "180px",
                                        overflowY: "auto",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.5rem",
                                    }}>
                                        {parsedCards.map((card, index) => (
                                            <div
                                                key={card.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    padding: "0.625rem 0.75rem",
                                                    background: "var(--color-surface)",
                                                    borderRadius: "8px",
                                                    border: "1px solid var(--color-border)",
                                                }}
                                            >
                                                <span style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    color: "var(--color-accent)",
                                                    minWidth: "20px",
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={card.targetText}
                                                    onChange={(e) => handleParsedCardChange(card.id, "targetText", e.target.value)}
                                                    placeholder="テキスト"
                                                    style={{
                                                        flex: 1,
                                                        padding: "0.375rem 0.5rem",
                                                        border: "1px solid var(--color-border)",
                                                        borderRadius: "6px",
                                                        background: "var(--color-bg)",
                                                        color: "var(--color-fg)",
                                                        fontSize: "0.85rem",
                                                        minWidth: 0,
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={card.translation}
                                                    onChange={(e) => handleParsedCardChange(card.id, "translation", e.target.value)}
                                                    placeholder={autoGenerateTranslation ? "自動" : "翻訳"}
                                                    style={{
                                                        flex: 1,
                                                        padding: "0.375rem 0.5rem",
                                                        border: "1px solid var(--color-border)",
                                                        borderRadius: "6px",
                                                        background: "var(--color-bg)",
                                                        color: card.translation ? "var(--color-fg)" : "var(--color-fg-muted)",
                                                        fontSize: "0.85rem",
                                                        minWidth: 0,
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleRemoveParsedCard(card.id)}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        color: "#ef4444",
                                                        padding: "4px",
                                                        display: "flex",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!bulkText.trim() && (
                                <div style={{
                                    textAlign: "center",
                                    padding: "1.5rem 1rem",
                                    color: "var(--color-fg-muted)",
                                }}>
                                    <FileText size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                                    <p style={{ margin: 0, fontSize: "0.9rem" }}>
                                        単語リストや文章を貼り付けると<br />
                                        自動的にカードに変換されます
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Jobs Submitted Success State */}
                            {jobsSubmitted ? (
                                <div style={{
                                    padding: "1.5rem",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "1.25rem"
                                }}>
                                    <div style={{
                                        width: "64px",
                                        height: "64px",
                                        borderRadius: "50%",
                                        background: "rgba(34, 197, 94, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <Clock size={32} style={{ color: "#22c55e" }} />
                                    </div>
                                    <div>
                                        <h4 style={{
                                            margin: "0 0 0.5rem 0",
                                            fontSize: "1.1rem",
                                            fontWeight: 600,
                                            color: "var(--color-fg)"
                                        }}>
                                            処理を開始しました
                                        </h4>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "0.9rem",
                                            color: "var(--color-fg-muted)",
                                            lineHeight: 1.5
                                        }}>
                                            {successCount}枚の画像をバックグラウンドで解析中です。
                                            {errorCount > 0 && (
                                                <span style={{ color: "#ef4444" }}>
                                                    （{errorCount}枚失敗）
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Upload Status List */}
                                    {uploadStatuses.length > 0 && (
                                        <div style={{
                                            width: "100%",
                                            maxHeight: "150px",
                                            overflowY: "auto",
                                            background: "var(--color-surface)",
                                            borderRadius: "10px",
                                            padding: "0.5rem"
                                        }}>
                                            {uploadStatuses.map((status) => (
                                                <div
                                                    key={status.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                        padding: "0.5rem",
                                                        fontSize: "0.85rem"
                                                    }}
                                                >
                                                    {status.status === 'success' ? (
                                                        <CheckCircle2 size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
                                                    ) : status.status === 'error' ? (
                                                        <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
                                                    ) : (
                                                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)", flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        flex: 1,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        color: status.status === 'error' ? "#ef4444" : "var(--color-fg)"
                                                    }}>
                                                        {status.fileName}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        width: "100%"
                                    }}>
                                        <button
                                            onClick={handleGoToHistory}
                                            style={{
                                                flex: 1,
                                                padding: "0.875rem",
                                                background: "var(--color-accent)",
                                                border: "none",
                                                borderRadius: "12px",
                                                cursor: "pointer",
                                                color: "white",
                                                fontSize: "0.95rem",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <ExternalLink size={16} />
                                            履歴を確認
                                        </button>
                                        <button
                                            onClick={handleUploadMore}
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
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <Plus size={16} />
                                            さらに追加
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Image Upload Area */}
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                                        style={{
                                            padding: "2rem",
                                            border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
                                            borderRadius: "12px",
                                            background: isDragging ? "rgba(var(--color-accent-rgb), 0.1)" : "var(--color-surface)",
                                            cursor: isAnalyzing ? "default" : "pointer",
                                            textAlign: "center",
                                            transition: "all 0.2s",
                                            marginBottom: "1rem"
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 0) {
                                                    processMultipleImages(files);
                                                }
                                                // Reset input so same files can be selected again
                                                e.target.value = '';
                                            }}
                                            style={{ display: "none" }}
                                        />
                                        {isAnalyzing ? (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                                <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)" }} />
                                                <span style={{ color: "var(--color-fg-muted)" }}>
                                                    {uploadStatuses.length}枚の画像を処理中...
                                                </span>
                                                {/* Progress list */}
                                                <div style={{
                                                    width: "100%",
                                                    maxHeight: "120px",
                                                    overflowY: "auto",
                                                    textAlign: "left"
                                                }}>
                                                    {uploadStatuses.map((status) => (
                                                        <div
                                                            key={status.id}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "0.5rem",
                                                                padding: "0.375rem 0",
                                                                fontSize: "0.8rem"
                                                            }}
                                                        >
                                                            {status.status === 'success' ? (
                                                                <CheckCircle2 size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                                                            ) : status.status === 'error' ? (
                                                                <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                                                            ) : status.status === 'uploading' ? (
                                                                <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)", flexShrink: 0 }} />
                                                            ) : (
                                                                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }} />
                                                            )}
                                                            <span style={{
                                                                flex: 1,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                color: status.status === 'error' ? "#ef4444" : "var(--color-fg-muted)"
                                                            }}>
                                                                {status.fileName}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                                <Images size={32} style={{ color: "var(--color-fg-muted)" }} />
                                                <span style={{ color: "var(--color-fg-muted)", fontWeight: 500 }}>
                                                    複数の画像をまとめてアップロード
                                                </span>
                                                <span style={{ color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                                                    ドラッグ&ドロップ または クリックして選択
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Link to Extraction History */}
                                    <button
                                        onClick={handleGoToHistory}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            background: "transparent",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "10px",
                                            cursor: "pointer",
                                            color: "var(--color-fg-muted)",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            marginBottom: "1rem",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "var(--color-accent)";
                                            e.currentTarget.style.color = "var(--color-accent)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "var(--color-border)";
                                            e.currentTarget.style.color = "var(--color-fg-muted)";
                                        }}
                                    >
                                        <Clock size={16} />
                                        処理履歴を確認
                                    </button>

                                    {!isAnalyzing && (
                                        <p style={{
                                            textAlign: "center",
                                            color: "var(--color-fg-muted)",
                                            fontSize: "0.85rem",
                                            margin: "1rem 0 0 0"
                                        }}>
                                            画像から単語やフレーズを自動抽出します。処理完了後、履歴ページで確認できます。
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'manual' && (
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
                            キャンセル
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={validCount === 0 || isSubmitting || isGenerating}
                            style={{
                                flex: 1,
                                padding: "0.875rem",
                                background: validCount > 0 ? "var(--color-accent)" : "var(--color-border)",
                                border: "none",
                                borderRadius: "12px",
                                cursor: validCount > 0 && !isSubmitting && !isGenerating ? "pointer" : "not-allowed",
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
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    生成中...
                                </>
                            ) : isSubmitting ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    追加中...
                                </>
                            ) : (
                                `${validCount}枚追加`
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'text' && (
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
                            キャンセル
                        </button>
                        <button
                            onClick={handleSubmitParsed}
                            disabled={parsedValidCount === 0 || isSubmitting || isGenerating}
                            style={{
                                flex: 1,
                                padding: "0.875rem",
                                background: parsedValidCount > 0 ? "var(--color-accent)" : "var(--color-border)",
                                border: "none",
                                borderRadius: "12px",
                                cursor: parsedValidCount > 0 && !isSubmitting && !isGenerating ? "pointer" : "not-allowed",
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
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    生成中...
                                </>
                            ) : isSubmitting ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    追加中...
                                </>
                            ) : (
                                `${parsedValidCount}枚追加`
                            )}
                        </button>
                    </div>
                )}
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
