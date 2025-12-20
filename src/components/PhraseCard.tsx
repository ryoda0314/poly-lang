"use client";

import React from "react";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Phrase } from "@/lib/data";
import { generateSpeech } from "@/actions/speech";
import { useAppStore } from "@/store/app-context";
import { Volume2 } from "lucide-react";
import { playBase64Audio } from "@/lib/audio";

interface Props {
    phrase: Phrase;
}

export default function PhraseCard({ phrase }: Props) {
    const { activeLanguageCode } = useAppStore();
    const [audioLoading, setAudioLoading] = React.useState(false);
    const isRtl = activeLanguageCode === "ar";

    const playAudio = async (text: string) => {
        if (audioLoading) return;
        setAudioLoading(true);

        try {
            const result = await generateSpeech(text, activeLanguageCode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType });
            } else {
                if (result && 'error' in result) {
                    console.warn("TTS generation failed:", result.error);
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
            <div style={{ fontSize: "1.1rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", textAlign: "start" }}>
                <div style={{ flex: 1 }}>
                    <TokenizedSentence text={phrase.targetText} tokens={phrase.tokens} phraseId={phrase.id} />
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

            <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", marginTop: "auto", textAlign: "start" }}>
                {phrase.translation}
            </div>
        </div>
    );
}
