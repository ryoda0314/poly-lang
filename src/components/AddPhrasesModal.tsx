"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Type, Image, Upload, Plus, Trash2, Loader2, Check, Clock, ExternalLink } from "lucide-react";
import { ExtractedPhrase } from "@/actions/image-extract";
import { createExtractionJob } from "@/actions/extraction-job";
import { tokenizeSinglePhrase } from "@/actions/tokenize";

interface AddPhrasesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (phrases: { target_text: string; translation: string; tokens?: string[] }[]) => Promise<void>;
    targetLang: string;
    nativeLang: string;
    translations: {
        add_phrases: string;
        manual_input: string;
        image_analysis: string;
        target_text: string;
        translation: string;
        add: string;
        add_another: string;
        upload_image: string;
        analyzing_image: string;
        extracted_phrases: string;
        add_all: string;
        no_phrases_extracted: string;
        drag_drop_image: string;
        cancel: string;
        tokenizing: string;
        processing_started?: string;
        processing_message?: string;
        go_to_history?: string;
        close?: string;
    };
}

interface ManualPhrase {
    id: string;
    target_text: string;
    translation: string;
}

export function AddPhrasesModal({
    isOpen,
    onClose,
    onAdd,
    targetLang,
    nativeLang,
    translations: t
}: AddPhrasesModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'manual' | 'image'>('manual');
    const [manualPhrases, setManualPhrases] = useState<ManualPhrase[]>([
        { id: '1', target_text: '', translation: '' }
    ]);
    const [extractedPhrases, setExtractedPhrases] = useState<ExtractedPhrase[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [jobSubmitted, setJobSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setIsAnalyzing(true);
            setExtractedPhrases([]);
            setExtractionError(null);
            setJobSubmitted(false);
            try {
                const base64 = await compressImage(file);
                console.log('Compressed image size:', Math.round(base64.length / 1024), 'KB');
                const result = await createExtractionJob(base64, targetLang, nativeLang);
                if (result.success) {
                    setJobSubmitted(true);
                } else {
                    setExtractionError(result.error || "Failed to create extraction job");
                }
            } catch (error) {
                console.error('Image upload error:', error);
                setExtractionError("Failed to process image");
            } finally {
                setIsAnalyzing(false);
            }
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

    if (!isOpen) return null;

    const handleAddManualPhrase = () => {
        setManualPhrases([
            ...manualPhrases,
            { id: Date.now().toString(), target_text: '', translation: '' }
        ]);
    };

    const handleRemoveManualPhrase = (id: string) => {
        if (manualPhrases.length > 1) {
            setManualPhrases(manualPhrases.filter(p => p.id !== id));
        }
    };

    const handleManualPhraseChange = (id: string, field: 'target_text' | 'translation', value: string) => {
        setManualPhrases(manualPhrases.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleSubmitManual = async () => {
        const validPhrases = manualPhrases.filter(p => p.target_text.trim() && p.translation.trim());
        if (validPhrases.length === 0) return;

        setIsSubmitting(true);
        try {
            // Tokenize each phrase
            const phrasesWithTokens = await Promise.all(
                validPhrases.map(async (p) => {
                    const tokens = await tokenizeSinglePhrase(p.target_text, targetLang);
                    return {
                        target_text: p.target_text.trim(),
                        translation: p.translation.trim(),
                        tokens
                    };
                })
            );

            await onAdd(phrasesWithTokens);
            setManualPhrases([{ id: '1', target_text: '', translation: '' }]);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setIsAnalyzing(true);
        setExtractedPhrases([]);
        setExtractionError(null);
        setJobSubmitted(false);

        try {
            // Compress image before sending (keeps text readable for OCR)
            const base64 = await compressImage(file);
            console.log('Compressed image size:', Math.round(base64.length / 1024), 'KB');
            const result = await createExtractionJob(base64, targetLang, nativeLang);

            if (result.success) {
                setJobSubmitted(true);
            } else {
                console.error('Extraction error:', result.error);
                setExtractionError(result.error || "Failed to create extraction job");
            }
        } catch (error) {
            console.error('Image upload error:', error);
            setExtractionError("Failed to process image");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRemoveExtracted = (index: number) => {
        setExtractedPhrases(extractedPhrases.filter((_, i) => i !== index));
    };

    const handleEditExtracted = (index: number, field: 'target_text' | 'translation', value: string) => {
        setExtractedPhrases(extractedPhrases.map((p, i) =>
            i === index ? { ...p, [field]: value } : p
        ));
    };

    const handleSubmitExtracted = async () => {
        if (extractedPhrases.length === 0) return;

        setIsSubmitting(true);
        try {
            await onAdd(extractedPhrases.map(p => ({
                target_text: p.target_text,
                translation: p.translation,
                tokens: p.tokens
            })));
            setExtractedPhrases([]);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setManualPhrases([{ id: '1', target_text: '', translation: '' }]);
        setExtractedPhrases([]);
        setActiveTab('manual');
        setJobSubmitted(false);
        setExtractionError(null);
        onClose();
    };

    const handleGoToHistory = () => {
        handleClose();
        router.push('/app/extraction-history');
    };

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
                padding: "1rem"
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    background: "var(--color-bg)",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "520px",
                    maxHeight: "85vh",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    display: "flex",
                    flexDirection: "column"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                        {t.add_phrases}
                    </h3>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "var(--color-bg-sub)",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            color: "var(--color-fg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: "flex",
                    padding: "0.75rem 1.5rem",
                    gap: "0.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    flexShrink: 0
                }}>
                    <button
                        onClick={() => setActiveTab('manual')}
                        style={{
                            flex: 1,
                            padding: "0.75rem",
                            borderRadius: "10px",
                            border: "none",
                            background: activeTab === 'manual' ? "var(--color-accent)" : "var(--color-bg-sub)",
                            color: activeTab === 'manual' ? "white" : "var(--color-fg)",
                            cursor: "pointer",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 0.2s"
                        }}
                    >
                        <Type size={16} />
                        {t.manual_input}
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        style={{
                            flex: 1,
                            padding: "0.75rem",
                            borderRadius: "10px",
                            border: "none",
                            background: activeTab === 'image' ? "var(--color-accent)" : "var(--color-bg-sub)",
                            color: activeTab === 'image' ? "white" : "var(--color-fg)",
                            cursor: "pointer",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 0.2s"
                        }}
                    >
                        <Image size={16} />
                        {t.image_analysis}
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.5rem"
                }}>
                    {activeTab === 'manual' ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {manualPhrases.map((phrase, index) => (
                                <div key={phrase.id} style={{
                                    padding: "1rem",
                                    background: "var(--color-bg-sub)",
                                    borderRadius: "12px",
                                    position: "relative"
                                }}>
                                    {manualPhrases.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveManualPhrase(phrase.id)}
                                            style={{
                                                position: "absolute",
                                                top: "8px",
                                                right: "8px",
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                color: "var(--color-fg-muted)",
                                                padding: "4px"
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <div style={{ marginBottom: "0.75rem" }}>
                                        <label style={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "var(--color-fg-muted)",
                                            marginBottom: "0.25rem"
                                        }}>
                                            {t.target_text}
                                        </label>
                                        <input
                                            type="text"
                                            value={phrase.target_text}
                                            onChange={(e) => handleManualPhraseChange(phrase.id, 'target_text', e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "8px",
                                                background: "var(--color-bg)",
                                                color: "var(--color-fg)",
                                                fontSize: "0.95rem"
                                            }}
                                            autoFocus={index === 0}
                                        />
                                    </div>
                                    <div>
                                        <label style={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "var(--color-fg-muted)",
                                            marginBottom: "0.25rem"
                                        }}>
                                            {t.translation}
                                        </label>
                                        <input
                                            type="text"
                                            value={phrase.translation}
                                            onChange={(e) => handleManualPhraseChange(phrase.id, 'translation', e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "8px",
                                                background: "var(--color-bg)",
                                                color: "var(--color-fg)",
                                                fontSize: "0.95rem"
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleAddManualPhrase}
                                style={{
                                    padding: "0.75rem",
                                    border: "2px dashed var(--color-border)",
                                    borderRadius: "12px",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: "var(--color-fg-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    fontWeight: 500
                                }}
                            >
                                <Plus size={16} />
                                {t.add_another}
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Job Submitted Success State */}
                            {jobSubmitted ? (
                                <div style={{
                                    padding: "2rem",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "1.5rem"
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
                                            {t.processing_started || "処理を開始しました"}
                                        </h4>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "0.9rem",
                                            color: "var(--color-fg-muted)",
                                            lineHeight: 1.5
                                        }}>
                                            {t.processing_message || "バックグラウンドで画像を解析中です。完了したら通知でお知らせします。"}
                                        </p>
                                    </div>
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
                                            {t.go_to_history || "履歴を確認"}
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            style={{
                                                flex: 1,
                                                padding: "0.875rem",
                                                background: "var(--color-bg-sub)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "12px",
                                                cursor: "pointer",
                                                color: "var(--color-fg)",
                                                fontSize: "0.95rem",
                                                fontWeight: 500
                                            }}
                                        >
                                            {t.close || "閉じる"}
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
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            padding: "2rem",
                                            border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
                                            borderRadius: "12px",
                                            background: isDragging ? "var(--color-accent-light)" : "var(--color-bg-sub)",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            transition: "all 0.2s",
                                            marginBottom: "1rem"
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file);
                                            }}
                                            style={{ display: "none" }}
                                        />
                                        {isAnalyzing ? (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                                <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)" }} />
                                                <span style={{ color: "var(--color-fg-muted)" }}>{t.analyzing_image}</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                                <Upload size={32} style={{ color: "var(--color-fg-muted)" }} />
                                                <span style={{ color: "var(--color-fg-muted)" }}>{t.drag_drop_image}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Extracted Phrases - kept for backwards compatibility but won't be used in async flow */}
                                    {extractedPhrases.length > 0 && (
                                <div>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "1rem"
                                    }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            color: "var(--color-fg)"
                                        }}>
                                            {t.extracted_phrases}
                                        </h4>
                                        <span style={{
                                            fontSize: "0.8rem",
                                            color: "var(--color-fg-muted)",
                                            background: "var(--color-bg-sub)",
                                            padding: "0.25rem 0.75rem",
                                            borderRadius: "20px"
                                        }}>
                                            {extractedPhrases.length} phrases
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        {extractedPhrases.map((phrase, index) => (
                                            <div key={index} style={{
                                                padding: "1rem",
                                                background: "var(--color-bg-sub)",
                                                borderRadius: "12px",
                                                borderLeft: "3px solid var(--color-accent)"
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "0.75rem"
                                                }}>
                                                    <span style={{
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        color: "var(--color-accent)",
                                                        background: "var(--color-accent-light, rgba(var(--color-accent-rgb), 0.1))",
                                                        padding: "0.25rem 0.5rem",
                                                        borderRadius: "4px",
                                                        minWidth: "24px",
                                                        textAlign: "center"
                                                    }}>
                                                        {index + 1}
                                                    </span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ marginBottom: "0.75rem" }}>
                                                            <label style={{
                                                                display: "block",
                                                                fontSize: "0.7rem",
                                                                fontWeight: 600,
                                                                color: "var(--color-fg-muted)",
                                                                marginBottom: "0.25rem",
                                                                textTransform: "uppercase"
                                                            }}>
                                                                {t.target_text}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={phrase.target_text}
                                                                onChange={(e) => handleEditExtracted(index, 'target_text', e.target.value)}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "0.625rem 0.75rem",
                                                                    border: "1px solid var(--color-border)",
                                                                    borderRadius: "8px",
                                                                    background: "var(--color-bg)",
                                                                    color: "var(--color-fg)",
                                                                    fontSize: "0.95rem",
                                                                    fontWeight: 500
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{
                                                                display: "block",
                                                                fontSize: "0.7rem",
                                                                fontWeight: 600,
                                                                color: "var(--color-fg-muted)",
                                                                marginBottom: "0.25rem",
                                                                textTransform: "uppercase"
                                                            }}>
                                                                {t.translation}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={phrase.translation}
                                                                onChange={(e) => handleEditExtracted(index, 'translation', e.target.value)}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "0.625rem 0.75rem",
                                                                    border: "1px solid var(--color-border)",
                                                                    borderRadius: "8px",
                                                                    background: "var(--color-bg)",
                                                                    color: "var(--color-fg-muted)",
                                                                    fontSize: "0.9rem"
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveExtracted(index)}
                                                        style={{
                                                            background: "transparent",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "var(--color-fg-muted)",
                                                            padding: "0.5rem",
                                                            borderRadius: "6px",
                                                            transition: "all 0.2s",
                                                            flexShrink: 0
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                                            e.currentTarget.style.color = "#ef4444";
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.background = "transparent";
                                                            e.currentTarget.style.color = "var(--color-fg-muted)";
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}

                                    {/* Error Display */}
                                    {extractionError && (
                                        <div style={{
                                            padding: "1rem",
                                            background: "rgba(239, 68, 68, 0.1)",
                                            border: "1px solid rgba(239, 68, 68, 0.3)",
                                            borderRadius: "12px",
                                            color: "#ef4444",
                                            fontSize: "0.9rem",
                                            textAlign: "center"
                                        }}>
                                            {extractionError}
                                        </div>
                                    )}

                                    {!isAnalyzing && !extractionError && extractedPhrases.length === 0 && (
                                        <p style={{
                                            textAlign: "center",
                                            color: "var(--color-fg-muted)",
                                            fontSize: "0.9rem"
                                        }}>
                                            {t.no_phrases_extracted}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer - hidden when job is submitted (success state has its own buttons) */}
                {!(activeTab === 'image' && jobSubmitted) && (
                    <div style={{
                        padding: "1rem 1.5rem",
                        borderTop: "1px solid var(--color-border)",
                        display: "flex",
                        gap: "0.75rem",
                        flexShrink: 0
                    }}>
                        <button
                            onClick={handleClose}
                            style={{
                                flex: 1,
                                padding: "0.875rem",
                                background: "var(--color-bg-sub)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "12px",
                                cursor: "pointer",
                                color: "var(--color-fg)",
                                fontSize: "0.95rem",
                                fontWeight: 500
                            }}
                        >
                            {t.cancel}
                        </button>
                        {activeTab === 'manual' && (
                            <button
                                onClick={handleSubmitManual}
                                disabled={isSubmitting || !manualPhrases.some(p => p.target_text.trim() && p.translation.trim())}
                                style={{
                                    flex: 1,
                                    padding: "0.875rem",
                                    background: "var(--color-accent)",
                                    border: "none",
                                    borderRadius: "12px",
                                    cursor: isSubmitting ? "wait" : "pointer",
                                    color: "white",
                                    fontSize: "0.95rem",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    opacity: isSubmitting || !manualPhrases.some(p => p.target_text.trim() && p.translation.trim()) ? 0.5 : 1
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                        {t.tokenizing}
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        {t.add}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
