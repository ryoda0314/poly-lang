"use client";

import type { Cognate } from "@/actions/etymology";
import { Globe } from "lucide-react";
import styles from "./CognateList.module.css";

interface Props {
    cognates: Cognate[];
}

const LANG_FLAGS: Record<string, string> = {
    german: "DE",
    french: "FR",
    spanish: "ES",
    italian: "IT",
    dutch: "NL",
    portuguese: "PT",
    latin: "LA",
    greek: "GR",
    russian: "RU",
    swedish: "SE",
    danish: "DK",
    norwegian: "NO",
    japanese: "JP",
    chinese: "CN",
    korean: "KR",
};

function getLangCode(language: string | null | undefined): string {
    if (!language) return "??";
    return LANG_FLAGS[language.toLowerCase()] || language.slice(0, 2).toUpperCase();
}

export default function CognateList({ cognates }: Props) {
    if (!cognates || cognates.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.label}>
                <Globe size={14} />
                <span>コグネイト（親戚語）</span>
            </div>
            <div className={styles.list}>
                {cognates.map((c, i) => (
                    <div key={i} className={styles.item}>
                        <span className={styles.langCode}>{getLangCode(c.language)}</span>
                        <div className={styles.wordInfo}>
                            <span className={styles.word}>{c.word}</span>
                            <span className={styles.language}>{c.language}</span>
                        </div>
                        <span className={styles.meaning}>{c.meaning}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
