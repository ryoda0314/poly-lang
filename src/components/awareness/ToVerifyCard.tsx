"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain } from "lucide-react";

interface ToVerifyCardProps {
    unverifiedMemos: { id: string, token_text: string | null }[];
}

import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

import styles from "./ActionCard.module.css";

export default function ToVerifyCard({ unverifiedMemos }: ToVerifyCardProps) {
    const router = useRouter();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage as "ja" | "ko" | "en"] || translations.en;

    if (unverifiedMemos.length === 0) return null;

    return (
        <div className={`${styles.card} ${styles.verifyCard}`}>
            <div className={styles.headerRow}>
                <div className={styles.leftGroup}>
                    <div className={`${styles.iconCircle} ${styles.iconVerify}`}>
                        <Brain size={18} />
                    </div>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>
                            {t.readyToVerify}
                        </h2>
                        <p className={styles.subtitle}>
                            {unverifiedMemos.length} {t.verifyDesc}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/app/corrections')}
                    className={styles.actionButton}
                >
                    {t.startSession} <ArrowRight size={14} />
                </button>
            </div>

            <div className={styles.tokenList}>
                {unverifiedMemos.slice(0, 5).map((memo, idx) => (
                    <span key={memo.id} className={`${styles.token} ${styles.tokenVerify}`}>
                        {memo.token_text || "???"}
                    </span>
                ))}
                {unverifiedMemos.length > 5 && (
                    <span className={styles.moreCount}>
                        +{unverifiedMemos.length - 5}
                    </span>
                )}
            </div>

            <div className={styles.footer}>
                {t.verifyTip}
            </div>
        </div>
    );
}
