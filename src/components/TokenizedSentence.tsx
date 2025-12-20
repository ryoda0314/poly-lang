"use client";

import React from "react";
import { useExplorer } from "@/hooks/use-explorer";
import styles from "./TokenizedSentence.module.css";

interface Props {
    text: string;
}

export default function TokenizedSentence({ text }: Props) {
    const { openExplorer } = useExplorer();

    // Split logic: keep delimiters
    // Simple regex for MVP: splits by space or punctuation
    const tokens = text.split(/([ \t\n\r,.!?;:"'’]+)/).filter(Boolean);

    const isWord = (t: string) => {
        return !/^[ \t\n\r,.!?;:"'’]+$/.test(t);
    };

    const handleTokenClick = (e: React.MouseEvent, token: string) => {
        e.stopPropagation();
        openExplorer(token);
    };

    return (
        <div className={styles.container}>
            {tokens.map((token, i) => {
                if (isWord(token)) {
                    return (
                        <button
                            key={i}
                            className={styles.tokenBtn}
                            onClick={(e) => handleTokenClick(e, token)}
                        >
                            {token}
                        </button>
                    );
                }
                return <span key={i} className={styles.punct}>{token}</span>;
            })}
        </div>
    );
}
