"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import { LANGUAGE_SCRIPTS, SCRIPT_LANGUAGE_CODES } from "@/data/scripts";
import styles from "./page.module.css";
import clsx from "clsx";

// Static preview data so we don't need to lazy-load all JSON for the list
const SCRIPT_PREVIEWS: Record<string, { name: string; nameNative: string; total: number; sample: string }> = {
    "ja-hiragana":    { name: "Hiragana",          nameNative: "ひらがな",           total: 46,  sample: "あいうえお" },
    "ja-katakana":    { name: "Katakana",          nameNative: "カタカナ",           total: 46,  sample: "アイウエオ" },
    "ko-jamo":        { name: "Hangul Jamo",       nameNative: "한글 자모",          total: 24,  sample: "ㄱㄴㄷㄹㅁ" },
    "zh-hsk1":        { name: "HSK 1",             nameNative: "HSK一级",            total: 150, sample: "人大中国学" },
    "ru-cyrillic":    { name: "Cyrillic",          nameNative: "Кириллица",          total: 33,  sample: "АБВГД" },
    "th-consonants":  { name: "Thai Consonants",   nameNative: "พยัญชนะไทย",         total: 44,  sample: "กขคงจ" },
    "th-vowels":      { name: "Thai Vowels",       nameNative: "สระไทย",              total: 24,  sample: "อะ อา อิ อี" },
    "hi-devanagari":  { name: "Devanagari",        nameNative: "देवनागरी",            total: 46,  sample: "अआइईउ" },
    "ar-alphabet":    { name: "Arabic Alphabet",   nameNative: "الأبجدية",           total: 28,  sample: "ابتثج" },
    "en-alphabet":    { name: "English Alphabet",  nameNative: "ABC",                total: 26,  sample: "ABCDE" },
};

export default function ScriptLearningPage() {
    const { activeLanguageCode, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage || "ja"] as any;

    const [selectedLang, setSelectedLang] = useState(activeLanguageCode || "ja");
    const availableScripts = LANGUAGE_SCRIPTS[selectedLang]?.scripts ?? [];

    return (
        <div className={styles.container}>
            <div className={styles.page}>
                {/* Header */}
                <h1 className={styles.title}>{t.scriptLearning || "文字学習"}</h1>

                {/* Language tabs — underline style */}
                <div className={styles.langBar}>
                    {SCRIPT_LANGUAGE_CODES.map((code) => (
                        <button
                            key={code}
                            className={clsx(styles.langTab, selectedLang === code && styles.langTabActive)}
                            onClick={() => setSelectedLang(code)}
                        >
                            {LANGUAGE_SCRIPTS[code].languageName}
                        </button>
                    ))}
                </div>

                {/* Script cards */}
                {availableScripts.length > 0 ? (
                    <div className={styles.scriptList}>
                        {availableScripts.map((sid) => {
                            const preview = SCRIPT_PREVIEWS[sid];
                            if (!preview) return null;

                            return (
                                <Link
                                    key={sid}
                                    href={`/app/script-learning/${sid}`}
                                    className={styles.scriptCard}
                                >
                                    <div className={styles.cardSample}>{preview.sample}</div>
                                    <div className={styles.cardBody}>
                                        <span className={styles.cardNative}>{preview.nameNative}</span>
                                        <span className={styles.cardName}>{preview.name}</span>
                                        <span className={styles.cardMeta}>{preview.total} characters</span>
                                    </div>
                                    <ChevronRight size={18} className={styles.cardArrow} />
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.emptyText}>{t.scriptNoScripts || "この言語のスクリプトデータはまだありません"}</p>
                )}
            </div>
        </div>
    );
}
