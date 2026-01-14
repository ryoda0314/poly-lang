"use client";

import React, { useState } from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import { motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import TokenizedSentence from "@/components/TokenizedSentence";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { GENDER_SUPPORTED_LANGUAGES } from "@/lib/data";

// Transform text based on gender
// For patterns like "(e)", "(es)", "(ne)", "(tte)", etc.
// Male: remove the parentheses and their content -> "occupé(e)" -> "occupé"
// Female: keep the content, remove parentheses -> "occupé(e)" -> "occupée"
function applyGenderToText(text: string, gender: "male" | "female"): string {
    if (!text) return text;

    // Match patterns like (e), (es), (ne), (tte), (ère), (rice), etc.
    // This regex matches parentheses containing lowercase letters
    const genderPattern = /\(([a-zéèêëàâäùûüôöîïç]+)\)/gi;

    if (gender === "male") {
        // Remove all gender parentheses and their contents
        return text.replace(genderPattern, "");
    } else {
        // Keep the content, remove the parentheses
        return text.replace(genderPattern, "$1");
    }
}

export default function ExplorerSidePanel() {
    const { trail, activeIndex, closeExplorer, refreshCurrentToken } = useExplorer();
    const { activeLanguageCode, nativeLanguage, speakingGender, setSpeakingGender } = useAppStore();
    const [audioLoading, setAudioLoading] = useState<string | null>(null);
    const isRtl = activeLanguageCode === "ar";

    const handleGenderChange = (gender: "male" | "female") => {
        if (gender !== speakingGender) {
            setSpeakingGender(gender);
            // Trigger refresh after state update
            setTimeout(() => refreshCurrentToken(), 0);
        }
    };

    // ... (playAudio function uses text arg, so no change needed there except call site) ...
    const playAudio = async (text: string, id: string) => {
        if (audioLoading) return;
        setAudioLoading(id);

        try {
            const result = await generateSpeech(text, activeLanguageCode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType });
            } else {
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = activeLanguageCode;
                    window.speechSynthesis.speak(utterance);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(null);
        }
    };

    const currentStep = trail[activeIndex];

    if (!currentStep) {
        return (
            <div style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-fg-muted)",
                fontStyle: "italic",
                padding: "var(--space-4)",
                textAlign: "center"
            }}>
                <p>Click a word in the phrases to explore its usage.</p>
            </div>
        );
    }

    const renderContent = () => {
        if (currentStep.loading) {
            // ... (loading state same) ...
            return (
                <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-fg-muted)" }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ width: 24, height: 24, margin: "0 auto var(--space-2)", border: "2px solid #ccc", borderTopColor: "var(--color-accent)", borderRadius: "50%" }}
                    />
                    <span>Exploring "{currentStep.token}"...</span>
                </div>
            );
        }

        if (currentStep.error) {
            return (
                <div style={{ padding: "var(--space-4)", color: "var(--color-destructive)" }}>
                    {currentStep.error}
                </div>
            );
        }

        if (!currentStep.examples || currentStep.examples.length === 0) {
            return (
                <div style={{ padding: "var(--space-4)", color: "var(--color-fg-muted)" }}>
                    No examples found for "{currentStep.token}".
                </div>
            );
        }

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {currentStep.examples.map((ex: any) => { // Use explicit any cast heavily to avoid TS issues if useExplorer types mismatch
                    const displayTranslation = (nativeLanguage === 'ko' && ex.translation_ko)
                        ? ex.translation_ko
                        : ex.translation;

                    // Apply gender transformation to text and tokens
                    const genderedText = applyGenderToText(ex.text, speakingGender);
                    const genderedTokens = ex.tokens?.map((t: string) => applyGenderToText(t, speakingGender));

                    return (
                        <div key={ex.id} style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3)",
                            boxShadow: "var(--shadow-sm)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                                <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
                                    <TokenizedSentence text={genderedText} tokens={genderedTokens} direction={isRtl ? "rtl" : "ltr"} phraseId={ex.id} />
                                </div>
                                <button
                                    onClick={() => playAudio(genderedText, ex.id)}
                                    disabled={audioLoading === ex.id}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--color-fg-muted)",
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    {audioLoading === ex.id ? (
                                        <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                    ) : (
                                        <Volume2 size={16} />
                                    )}
                                </button>
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>{displayTranslation}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        }}>
            <div style={{
                padding: "0 0 var(--space-4) 0",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--color-fg)",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "var(--space-4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span>{currentStep.token}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Gender Toggle */}
                    {GENDER_SUPPORTED_LANGUAGES.includes(activeLanguageCode) && (
                        <div style={{
                            display: "flex",
                            background: "var(--color-surface-hover)",
                            borderRadius: "var(--radius-sm)",
                            padding: "2px",
                            gap: "2px",
                        }}>
                            <button
                                onClick={() => handleGenderChange("male")}
                                style={{
                                    border: "none",
                                    background: speakingGender === "male" ? "var(--color-surface)" : "transparent",
                                    color: speakingGender === "male" ? "var(--color-fg)" : "var(--color-fg-muted)",
                                    padding: "4px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    boxShadow: speakingGender === "male" ? "var(--shadow-sm)" : "none",
                                    fontWeight: speakingGender === "male" ? 700 : 400,
                                    transition: "all 0.2s"
                                }}
                            >
                                ♂
                            </button>
                            <button
                                onClick={() => handleGenderChange("female")}
                                style={{
                                    border: "none",
                                    background: speakingGender === "female" ? "var(--color-surface)" : "transparent",
                                    color: speakingGender === "female" ? "var(--color-fg)" : "var(--color-fg-muted)",
                                    padding: "4px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    boxShadow: speakingGender === "female" ? "var(--shadow-sm)" : "none",
                                    fontWeight: speakingGender === "female" ? 700 : 400,
                                    transition: "all 0.2s"
                                }}
                            >
                                ♀
                            </button>
                        </div>
                    )}
                    <button
                        onClick={closeExplorer}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-fg-muted)",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: "var(--space-2)" }}>
                {renderContent()}
            </div>
        </div>
    );
}
