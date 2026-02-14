"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-context";
import { BASIC_PHRASE_CATEGORIES, getBasicPhrasesByCategory, getCategoryLabel, BasicPhraseItem } from "@/lib/basic-phrases";
import { translations } from "@/lib/translations";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { useSettingsStore } from "@/store/settings-store";
import IPAText from "@/components/IPAText";
import styles from "../phrases/phrases.module.css";
import clsx from "clsx";

function BasicPhraseCard({ phrase }: { phrase: BasicPhraseItem }) {
    const [audioLoading, setAudioLoading] = useState(false);
    const { ttsVoice, ttsLearnerMode } = useSettingsStore();

    const playAudio = async () => {
        if (audioLoading) return;
        setAudioLoading(true);
        try {
            const result = await generateSpeech(phrase.targetText, "en", ttsVoice, ttsLearnerMode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType });
            } else {
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(phrase.targetText);
                    utterance.lang = "en-US";
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
            <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                <IPAText text={phrase.targetText} />
                <button
                    onClick={playAudio}
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
            <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", marginTop: "auto" }}>{phrase.translation}</div>
        </div>
    );
}

export default function BasicPhrasesPage() {
    const { nativeLanguage } = useAppStore();
    const [selectedCategory, setSelectedCategory] = useState("all");

    const t = translations[nativeLanguage] || translations.ja;
    const phrases = getBasicPhrasesByCategory(selectedCategory);

    const categories = [
        { id: "all", name: t.all || "すべて" },
        ...BASIC_PHRASE_CATEGORIES.map(cat => ({
            id: cat,
            name: getCategoryLabel(cat)
        }))
    ];

    return (
        <div className={styles.container} style={{ padding: "var(--space-6)" }}>
            <div className={styles.leftArea}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div>
                            <h1 className={styles.title}>基本フレーズ集</h1>
                            <p style={{ color: "var(--color-fg-muted)", fontSize: "0.9rem", marginBottom: "var(--space-4)" }}>
                                旅行や日常会話で使える英語フレーズ
                            </p>
                            {/* Category Tabs */}
                            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        style={{
                                            padding: "var(--space-2) var(--space-3)",
                                            borderRadius: "var(--radius-md)",
                                            border: selectedCategory === cat.id ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                                            background: selectedCategory === cat.id ? "var(--color-accent-subtle)" : "var(--color-surface)",
                                            color: selectedCategory === cat.id ? "var(--color-accent)" : "var(--color-fg)",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            fontWeight: selectedCategory === cat.id ? 600 : 400,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div
                    layout
                    className={styles.gridClosed}
                    style={{ marginTop: "var(--space-6)" }}
                >
                    {phrases.map((phrase) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={phrase.id}
                        >
                            <BasicPhraseCard phrase={phrase} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
