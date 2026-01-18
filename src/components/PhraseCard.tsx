"use client";

import React from "react";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Phrase } from "@/lib/data";
import { generateSpeech } from "@/actions/speech";
import { useAppStore } from "@/store/app-context";
import { Volume2, Copy, Check } from "lucide-react";
import { playBase64Audio } from "@/lib/audio";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";

// Transform text based on gender
// Handles both French and Spanish patterns:
// French: "occupé(e)" → male: "occupé", female: "occupée" (append)
// Spanish: "ocupado(a)" → male: "ocupado", female: "ocupada" (replace o→a)
function applyGenderToText(text: string, gender: "male" | "female"): string {
    if (!text) return text;

    if (gender === "male") {
        // For male: simply remove all gender markers and their contents
        // "ocupado(a)" → "ocupado", "occupé(e)" → "occupé"
        return text.replace(/\(([a-záéíóúàâäèêëìîïòôöùûüç]+)\)/gi, "");
    } else {
        // For female: need to handle different patterns
        let result = text;

        // Spanish pattern: -o(a) → -a (replace the 'o' before parentheses with 'a')
        // "ocupado(a)" → "ocupada", "listo(a)" → "lista"
        result = result.replace(/o\(a\)/gi, "a");

        // Spanish pattern: -os(as) → -as (plural)
        // "ocupados(as)" → "ocupadas"
        result = result.replace(/os\(as\)/gi, "as");

        // French pattern: keep content, remove parentheses (append style)
        // "occupé(e)" → "occupée", "content(e)" → "contente"
        // This handles remaining patterns that weren't Spanish -o(a) style
        result = result.replace(/\(([a-záéíóúàâäèêëìîïòôöùûüç]+)\)/gi, "$1");

        return result;
    }
}

interface Props {
    phrase: Phrase;
}

export default function PhraseCard({ phrase }: Props) {
    const { activeLanguageCode, nativeLanguage, speakingGender } = useAppStore();
    const { logEvent } = useHistoryStore();
    const [audioLoading, setAudioLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const isRtl = activeLanguageCode === "ar";

    // Determine which translation to show
    // use nativeLanguage translation (which is the targetText in that language) or fallback to gloss_en
    const displayTranslation = phrase.translations?.[nativeLanguage] || phrase.translation;

    // Get target text and tokens for the ACTIVE learning language
    const rawText = phrase.translations?.[activeLanguageCode] || phrase.translation;
    // Apply gender transformation
    const effectiveText = applyGenderToText(rawText, speakingGender);
    const rawTokens = phrase.tokensMap?.[activeLanguageCode];

    // Flatten tokens if they are in nested string[][] format (e.g. for Korean multiple sentences)
    // Also apply gender transformation to tokens
    const effectiveTokens = React.useMemo(() => {
        if (!rawTokens) return undefined;
        let tokens: string[];
        // Check if the first element is an array to detect string[][]
        if (Array.isArray(rawTokens[0])) {
            tokens = (rawTokens as string[][]).flat();
        } else {
            tokens = rawTokens as string[];
        }
        // Apply gender transformation to each token
        return tokens.map(t => applyGenderToText(t, speakingGender));
    }, [rawTokens, speakingGender]);

    const playAudio = async (text: string) => {
        if (audioLoading) return;
        setAudioLoading(true);

        // Log interaction for Quests and Analytics
        logEvent('phrase_view', 1, { phrase_id: phrase.id, text: effectiveText });
        logEvent(TRACKING_EVENTS.AUDIO_PLAY, 0, { phrase_id: phrase.id, text_length: effectiveText.length, source: 'phrase_card' });

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

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(effectiveText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { phrase_id: phrase.id, text_length: effectiveText.length, source: 'phrase_card' });
        } catch (e) {
            console.error("Failed to copy:", e);
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
            <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", textAlign: "start" }}>
                <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>
                    <TokenizedSentence text={effectiveText} tokens={effectiveTokens} phraseId={phrase.id} />
                </div>

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                        onClick={copyToClipboard}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: copied ? "var(--color-success, #22c55e)" : "var(--color-fg-muted)",
                            cursor: "pointer",
                            padding: "var(--space-1)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => !copied && (e.currentTarget.style.color = "var(--color-accent)")}
                        onMouseLeave={e => !copied && (e.currentTarget.style.color = "var(--color-fg-muted)")}
                        title={copied ? "Copied!" : "Copy to clipboard"}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>

                    <button
                        onClick={() => playAudio(effectiveText)}
                        disabled={audioLoading}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "var(--color-fg-muted)",
                            cursor: "pointer",
                            padding: "var(--space-1)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
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
            </div>

            <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", marginTop: "auto", textAlign: "start" }}>
                {displayTranslation}
            </div>
        </div>
    );
}


