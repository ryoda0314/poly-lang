"use client";

import React from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import styles from "./TokenizedSentence.module.css";

interface Props {
    text: string;
    tokens?: string[];
    direction?: "ltr" | "rtl";
}

export default function TokenizedSentence({ text, tokens: providedTokens, direction }: Props) {
    const { openExplorer } = useExplorer();
    const { activeLanguageCode } = useAppStore();
    const isRtl = direction ? direction === "rtl" : activeLanguageCode === "ar";

    // Reconstruction logic: if providedTokens, map them to text to find gaps
    let items: { text: string; isToken: boolean }[] = [];

    if (providedTokens && providedTokens.length > 0) {
        let cursor = 0;
        providedTokens.forEach(token => {
            const index = text.indexOf(token, cursor);
            if (index !== -1) {
                // Gap
                if (index > cursor) {
                    items.push({ text: text.slice(cursor, index), isToken: false });
                }
                // Token
                items.push({ text: token, isToken: true });
                cursor = index + token.length;
            } else {
                // Fallback: just append token (shouldn't happen with valid data)
                items.push({ text: token, isToken: true });
            }
        });
        // Trailing text
        if (cursor < text.length) {
            items.push({ text: text.slice(cursor), isToken: false });
        }
    } else {
        const fallbackSegments = () =>
            text
                .split(/([ \t\n\r,.!?;:"'’]+)/)
                .filter(Boolean)
                .map(segment => ({
                    text: segment,
                    isToken: !/^[ \t\n\r,.!?;:"'’]+$/.test(segment)
                }));

        const intlSegments = () => {
            if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return null;
            try {
                const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
                const segmented = Array.from(segmenter.segment(text))
                    .filter(part => part.segment.length > 0)
                    .map(part => ({ text: part.segment, isToken: Boolean(part.isWordLike) }));
                return segmented.length ? segmented : null;
            } catch {
                return null;
            }
        };

        items = intlSegments() ?? fallbackSegments();
    }

    const isWord = (t: string) => {
        return !/^[ \t\n\r,.!?;:"'’]+$/.test(t);
    };

    const handleTokenClick = (e: React.MouseEvent, token: string) => {
        e.stopPropagation();
        openExplorer(token);
    };

    const containerClass = isRtl ? `${styles.container} ${styles.rtl}` : styles.container;

    return (
        <div className={containerClass} dir={isRtl ? "rtl" : "ltr"}>
            {items.map((item, i) => {
                const { text: tokenText, isToken } = item;
                // Only make it a button if it is a token AND it is a word
                if (isToken && isWord(tokenText)) {
                    return (
                        <button
                            key={i}
                            className={styles.tokenBtn}
                            onClick={(e) => handleTokenClick(e, tokenText)}
                        >
                            {tokenText}
                        </button>
                    );
                }
                return <span key={i} className={styles.punct}>{tokenText}</span>;
            })}
        </div>
    );
}
