"use client";

import React from "react";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Phrase } from "@/lib/data";
import { generateSpeech } from "@/actions/speech";
import { useAppStore } from "@/store/app-context";
import { Volume2 } from "lucide-react";

interface Props {
    phrase: Phrase;
}

export default function PhraseCard({ phrase }: Props) {
    const { activeLanguageCode } = useAppStore();
    const [audioLoading, setAudioLoading] = React.useState(false);

    const playAudio = async (text: string) => {
        if (audioLoading) return;
        setAudioLoading(true);

        try {
            const result = await generateSpeech(text, activeLanguageCode);
            if (result && 'data' in result) {
                const mime = result.mimeType || "audio/mp3";
                const audio = new Audio(`data:${mime};base64,${result.data}`);
                audio.play();
            } else {
                if (result && 'error' in result) {
                    alert(result.error);
                }
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = activeLanguageCode;
                    window.speechSynthesis.speak(utterance);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(false);
        }
    };

    return (
        <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            boxShadow: "var(--shadow-sm)",
            transition: "box-shadow 0.2s, transform 0.2s",
            height: "100%",
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <div style={{ fontSize: "1.1rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                <div style={{ flex: 1 }}>
                    <TokenizedSentence text={phrase.targetText} />
                </div>
                <button
                    onClick={() => playAudio(phrase.targetText)}
                    disabled={audioLoading}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--color-fg-muted)",
                        cursor: "pointer",
                        padding: "var(--space-1)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--color-accent)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--color-fg-muted)"}
                    title="Play audio"
                >
                    {audioLoading ? (
                        <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    ) : (
                        <Volume2 size={18} />
                    )}
                </button>
            </div>

            <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", marginTop: "auto" }}>
                {phrase.translation}
            </div>
        </div>
    );
}
