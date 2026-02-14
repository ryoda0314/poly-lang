"use client";

import React from "react";

interface Props {
    ipa: string;
    fontSize?: string;
}

interface IPASyllable {
    text: string;
    stress: "primary" | "secondary" | "none";
}

interface IPAWord {
    syllables: IPASyllable[];
    /** Word-level: stressed (content word) or unstressed (function word) */
    wordStress: "stressed" | "unstressed";
}

/**
 * Parse IPA string into word groups, each containing syllable segments.
 *
 * Word-level stress is determined solely by the * marker from the API.
 * If no * markers exist in the IPA (legacy cache), word-level distinction is disabled
 * and all words are treated as "stressed" (no dimming).
 */
function parseIPA(ipa: string): { words: IPAWord[]; hasStarMarkers: boolean } {
    const inner = ipa.replace(/^\/|\/$/g, "").trim();
    if (!inner) return { words: [], hasStarMarkers: false };

    const rawWords = inner.split(/\s+/);
    const hasStarMarkers = rawWords.some(w => w.startsWith("*"));
    const words: IPAWord[] = [];

    rawWords.forEach((rawWord) => {
        const isMarkedStressed = rawWord.startsWith("*");
        const word = isMarkedStressed ? rawWord.slice(1) : rawWord;

        const syllables: IPASyllable[] = [];
        const parts = word.split(".");

        parts.forEach((syl) => {
            if (!syl) return;

            let stress: IPASyllable["stress"] = "none";
            let text = syl;

            if (text.startsWith("ˈ")) {
                stress = "primary";
                text = text.slice(1);
            } else if (text.startsWith("ˌ")) {
                stress = "secondary";
                text = text.slice(1);
            }

            // Handle embedded stress markers
            if (text.includes("ˈ")) {
                const splits = text.split("ˈ");
                if (splits[0]) {
                    syllables.push({ text: splits[0], stress: "none" });
                }
                syllables.push({ text: splits.slice(1).join(""), stress: "primary" });
                return;
            }
            if (text.includes("ˌ")) {
                const splits = text.split("ˌ");
                if (splits[0]) {
                    syllables.push({ text: splits[0], stress: "none" });
                }
                syllables.push({ text: splits.slice(1).join(""), stress: "secondary" });
                return;
            }

            if (text) {
                syllables.push({ text, stress });
            }
        });

        if (syllables.length === 0) return;

        // Word-level stress: rely on * marker only
        let wordStress: IPAWord["wordStress"];
        if (hasStarMarkers) {
            // New format: * present in IPA → use it as source of truth
            wordStress = isMarkedStressed ? "stressed" : "unstressed";
        } else {
            // Legacy format: no * markers → no word-level distinction
            wordStress = "stressed";
        }

        words.push({ syllables, wordStress });
    });

    return { words, hasStarMarkers };
}

/**
 * Renders IPA with two levels of stress visualization:
 *
 * 1. **Word-level** (when API provides * markers):
 *    content words get a subtle accent underline, function words are dimmed.
 *
 * 2. **Syllable-level**: primary/secondary/unstressed syllables colored differently.
 */
export default function StressColoredIPA({ ipa, fontSize = "0.85rem" }: Props) {
    const { words, hasStarMarkers } = parseIPA(ipa);

    if (words.length === 0) {
        return <span style={{ fontSize, color: "var(--color-accent, #7c3aed)" }}>{ipa}</span>;
    }

    return (
        <span style={{
            display: "inline-flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "0",
            fontFamily: "'Noto Sans', 'Lucida Sans Unicode', 'Segoe UI', sans-serif",
            fontSize,
            lineHeight: 1.4,
        }}>
            <span style={{ color: "var(--color-fg-muted)", opacity: 0.5, marginRight: "1px" }}>/</span>
            {words.map((word, wi) => {
                const isStressed = word.wordStress === "stressed";

                return (
                    <React.Fragment key={wi}>
                        {wi > 0 && <span style={{ width: "5px", display: "inline-block" }} />}
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                borderBottom: hasStarMarkers && isStressed
                                    ? "2px solid var(--color-accent, #7c3aed)"
                                    : "1px solid transparent",
                                paddingBottom: "1px",
                                opacity: hasStarMarkers && !isStressed ? 0.55 : 1,
                                transition: "all 0.2s",
                            }}
                            title={
                                hasStarMarkers
                                    ? (isStressed ? "強勢語 (Content word)" : "弱勢語 (Function word)")
                                    : undefined
                            }
                        >
                            {word.syllables.map((syl, si) => {
                                const isPrimary = syl.stress === "primary";
                                const isSecondary = syl.stress === "secondary";

                                return (
                                    <span
                                        key={si}
                                        style={{
                                            display: "inline-block",
                                            padding: "1px 2px",
                                            borderRadius: "3px",
                                            fontWeight: isPrimary ? 700 : isSecondary ? 500 : 400,
                                            color: isPrimary
                                                ? "var(--color-accent, #7c3aed)"
                                                : isSecondary
                                                    ? "var(--color-accent-secondary, #a78bfa)"
                                                    : "var(--color-fg-muted, #6b7280)",
                                            background: isPrimary
                                                ? "var(--color-accent-subtle, rgba(124, 58, 237, 0.12))"
                                                : isSecondary
                                                    ? "rgba(167, 139, 250, 0.08)"
                                                    : "transparent",
                                            transition: "all 0.2s",
                                        }}
                                        title={
                                            isPrimary ? "第一強勢 (Primary stress)"
                                                : isSecondary ? "第二強勢 (Secondary stress)"
                                                    : "無強勢 (Unstressed)"
                                        }
                                    >
                                        {isPrimary && <span style={{ fontSize: "0.7em", opacity: 0.6, marginRight: "1px" }}>ˈ</span>}
                                        {isSecondary && <span style={{ fontSize: "0.7em", opacity: 0.6, marginRight: "1px" }}>ˌ</span>}
                                        {syl.text}
                                    </span>
                                );
                            })}
                        </span>
                    </React.Fragment>
                );
            })}
            <span style={{ color: "var(--color-fg-muted)", opacity: 0.5, marginLeft: "1px" }}>/</span>
        </span>
    );
}
