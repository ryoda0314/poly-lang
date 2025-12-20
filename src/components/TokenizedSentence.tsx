"use client";

import React from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import styles from "./TokenizedSentence.module.css";
import { useAwarenessStore } from "@/store/awareness-store";

interface Props {
    text: string;
    tokens?: string[];
    direction?: "ltr" | "rtl";
    phraseId: string;
}

const CONFIDENCE_CLASS_MAP = {
    high: styles.confidenceHigh,
    medium: styles.confidenceMedium,
    low: styles.confidenceLow,
};

export default function TokenizedSentence({ text, tokens: providedTokens, direction, phraseId }: Props) {
    const { openExplorer } = useExplorer();
    const { activeLanguageCode, user } = useAppStore();
    const { memos, selectToken, memosByText, isMemoMode, addMemo } = useAwarenessStore();
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

    const handleTokenClick = async (token: string, index: number, e: React.MouseEvent) => {
        e.stopPropagation();

        // Normal Mode: Awareness / Explorer
        selectToken(phraseId, index, token);
        openExplorer(token);
    };

    const containerClass = isRtl ? `${styles.container} ${styles.rtl}` : styles.container;

    return (
        <div className={containerClass} dir={isRtl ? "rtl" : "ltr"}>
            {items.map((item, i) => {
                const { text: tokenText, isToken } = item;
                // Only make it a button if it is a token AND it is a word
                if (isToken && isWord(tokenText)) {
                    // Start of Memo Logic
                    // Logic for selecting the "best" memo to display (High > Medium > Low)
                    const getBestMemo = (memoList: any[]) => {
                        if (!memoList || memoList.length === 0) return null;
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

                    const confidenceClass = effectiveMemo?.confidence
                        ? CONFIDENCE_CLASS_MAP[effectiveMemo.confidence as keyof typeof CONFIDENCE_CLASS_MAP]
                        : undefined;
                    // const confidenceClass = undefined; // Temporarily disabled
                    // End of Memo Logic

                    // ...
                    return (
                        <button
                            key={i}
                            className={`${styles.tokenBtn} ${confidenceClass ?? ""}`.trim()}
                            onClick={(e) => handleTokenClick(tokenText, i, e)}
                            draggable
                            onDragStart={(e) => {
                                const data = JSON.stringify({ text: tokenText, phraseId, index: i });
                                e.dataTransfer.setData("application/json", data);
                                e.dataTransfer.effectAllowed = "copy";
                                // Optional: Custom drag image
                            }}
                            style={{ cursor: "grab" }}
                        >
                            {tokenText}
                        </button>
                    );
                    // ...
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
