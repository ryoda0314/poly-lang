"use client";

import React, { useState } from "react";
import { useStreamStore } from "./store";
import { correctText } from "@/actions/correct";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { CasualnessLevel } from "@/prompts/correction";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import { Info } from "lucide-react";
import { translations } from "@/lib/translations";

const CASUALNESS_KEYS: { value: CasualnessLevel; key: string }[] = [
    { value: "casual", key: "casualness_casual" },
    { value: "neutral", key: "casualness_neutral" },
    { value: "formal", key: "casualness_formal" }
];

interface InputNodeProps {
    onInfoClick?: () => void;
}

export default function InputNode({ onInfoClick }: InputNodeProps) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [casualnessLevel, setCasualnessLevel] = useState<CasualnessLevel>("neutral");
    const { addStreamItem, setStreamItems } = useStreamStore();
    const { checkCorrectionAttempts } = useAwarenessStore();
    const { logEvent } = useHistoryStore();
    const { nativeLanguage, activeLanguageCode, profile, refreshProfile } = useAppStore();
    const t = translations[nativeLanguage] || translations.en;

    const handleSubmit = async () => {
        if (!text.trim() || loading) return;

        // Client-side credit check
        const credits = profile?.correction_credits ?? 0;
        if (credits <= 0) {
            alert((t as any).stream_insufficient_correction_credits || "Insufficient Correction Credits");
            return;
        }

        setLoading(true);

        setStreamItems([]);
        const submissionText = text;

        try {
            const inputSid = `input-${Date.now()}`;

            const [result] = await Promise.all([
                correctText(submissionText, activeLanguageCode || "en", nativeLanguage, casualnessLevel),
                checkCorrectionAttempts(submissionText).catch(e => console.error("Awareness check failed", e))
            ]);

            // Refresh credits AFTER successful submission/correction attempt
            refreshProfile().catch(console.error);

            if (!result) {
                alert((t as any).correctionFailedApi || "Correction failed (API Error)");
                return;
            }

            addStreamItem({
                kind: "correction-card",
                data: {
                    sid: `corr-${inputSid}`,
                    original: submissionText,
                    score: result.score,
                    recommended: result.recommended,
                    recommended_translation: result.recommended_translation,
                    sentences: result.sentences,
                    summary_1l: result.summary_1l,
                    points: result.points,
                    diff: result.diff,
                    boundary_1l: result.boundary_1l,
                    alternatives: result.alternatives
                }
            });

            // Log Correction Request
            logEvent(TRACKING_EVENTS.CORRECTION_REQUEST, 1, {
                input_length: submissionText.length,
                language: activeLanguageCode,
                casualness: casualnessLevel
            });

            setText("");
        } catch (e) {
            console.error(e);
            alert((t as any).correctionFailed || "Correction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            alignItems: "center",
            padding: "var(--space-8) 0"
        }}>
            {/* Info Button + Casualness Selector */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {onInfoClick && (
                    <button
                        onClick={onInfoClick}
                        title={(t as any).howToUse || "How to Use"}
                        style={{
                            position: "absolute",
                            left: "-48px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            background: "rgba(255,255,255,0.6)",
                            color: "var(--color-fg-muted, #6b7280)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            borderRadius: "50%",
                            cursor: "pointer",
                            backdropFilter: "blur(8px)"
                        }}
                    >
                        <Info size={18} />
                    </button>
                )}
                <div style={{
                    display: "flex",
                    gap: "0",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "25px",
                    padding: "4px",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(0,0,0,0.08)"
                }}>
                    {CASUALNESS_KEYS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setCasualnessLevel(option.value)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: "none",
                                background: casualnessLevel === option.value
                                    ? "var(--color-accent, #D94528)"
                                    : "transparent",
                                color: casualnessLevel === option.value
                                    ? "#fff"
                                    : "var(--color-fg-muted)",
                                fontWeight: casualnessLevel === option.value ? 600 : 400,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            {(t as any)[option.key] || option.value}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Field */}
            <div style={{ position: "relative", width: "100%" }}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={(t as any).inputPlaceholder || "Enter your sentence..."}
                    style={{
                        width: "100%",
                        padding: "16px 120px 16px 24px", // Right padding for button
                        borderRadius: "50px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        background: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(8px)",
                        fontFamily: "inherit",
                        fontSize: "1.1rem",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                        outline: "none",
                        textAlign: "left" // Standardize
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />

                <div style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center"
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!text.trim() || loading}
                        style={{
                            padding: "8px 20px",
                            backgroundColor: "var(--color-fg)",
                            color: "var(--color-bg)",
                            border: "none",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                            opacity: (!text.trim() || loading) ? 0 : 1,
                            transform: (!text.trim() || loading) ? "scale(0.9)" : "scale(1)",
                            pointerEvents: (!text.trim() || loading) ? "none" : "auto",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                    >
                        {loading ? "..." : "Check"}
                    </button>
                </div>
            </div>
        </div>
    );
}
