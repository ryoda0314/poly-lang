"use client";

import React from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import styles from "./TokenizedSentence.module.css";

interface Props {
    text: string;
    tokens?: string[];
    direction?: "ltr" | "rtl";
    phraseId: string;
}

import { useAwarenessStore } from "@/store/awareness-store";

const CONFIDENCE_COLORS = {
    high: { color: "#22c55e", bg: "#dcfce7" }, // Green
    medium: { color: "#f97316", bg: "#ffedd5" }, // Orange
    low: { color: "#ef4444", bg: "#fee2e2" },   // Red
};

export default function TokenizedSentence({ text, tokens: providedTokens, direction, phraseId }: Props) {
    const { openExplorer } = useExplorer();
    const { activeLanguageCode } = useAppStore();
    const { memos, selectToken, memosByText } = useAwarenessStore();
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

    const handleTokenClick = (token: string, index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        // Determine intention: Simple click = Select for Memo. Shift+Click or Alt+Click could be Explorer?
        // For now, let's make Click = Memo Selection (User Request).
        // Maybe add a small icon for explorer? Or double click?
        // User said: "Click to add to memo". 
        // Accessing explorer was existing feature.
        // Let's call BOTH for now, or just selectToken.
        // "This is a 4-column block... open noticeable memo on right"

        selectToken(phraseId, index, token);
        // openExplorer(token); // Disable explorer on click for now to prioritize Memo, or allow both (might be confusing)
    };

    const containerClass = isRtl ? `${styles.container} ${styles.rtl}` : styles.container;

    return (
        <div className={containerClass} dir={isRtl ? "rtl" : "ltr"}>
            {items.map((item, i) => {
                const { text: tokenText, isToken } = item;
                // Only make it a button if it is a token AND it is a word
                if (isToken && isWord(tokenText)) {
                    // Check memo status
                    // Note: 'i' here is index in 'items', which includes punctuation. 
                    // We need a stable index for the token. 
                    // Using 'i' is risky if segmentation changes. 
                    // But 'providedTokens' logic maps to 'items'.
                    // Let's use 'i' for now as it maps to the rendered array. 
                    // Ideally we track "Nth word index".

                    // Logic for selecting the "best" memo to display (High > Medium > Low)
                    const getBestMemo = (memoList: any[]) => {
                        if (!memoList || memoList.length === 0) return null;
                        // Priority: High > Medium > Low. Sort? Or just find?
                        // Simple find:
                        const high = memoList.find(m => m.confidence === 'high');
                        if (high) return high;
                        const medium = memoList.find(m => m.confidence === 'medium');
                        if (medium) return medium;
                        return memoList[0]; // fallback to first (Low)
                    };

                    const key = `${phraseId}-${i}`;
                    const localMemos = memos[key];
                    const globalMemos = memosByText[tokenText] || [];

                    // Use local memo if exists, otherwise global
                    const effectiveMemo = getBestMemo(localMemos) || getBestMemo(globalMemos);

                    const style = effectiveMemo?.confidence ? CONFIDENCE_COLORS[effectiveMemo.confidence as keyof typeof CONFIDENCE_COLORS] : undefined;

                    return (
                        <button
                            key={i}
                            className={styles.tokenBtn}
                            onClick={(e) => handleTokenClick(tokenText, i, e)}
                            style={style ? {
                                color: style.color,
                                backgroundColor: style.bg,
                                fontWeight: 700
                            } : {}}
                        >
                            {tokenText}
                        </button>
                    );
                }
                return (
                    <span key={i} className={styles.punct}>
                        {tokenText}
                    </span>
                );
            })}
        </div>
    );
}
