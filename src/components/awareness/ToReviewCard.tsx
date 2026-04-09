"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Repeat, Clock } from "lucide-react";

interface ToReviewCardProps {
    dueMemos: { id: string, token_text: string | null }[];
}

import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

import styles from "./ActionCard.module.css";

export default function ToReviewCard({ dueMemos }: ToReviewCardProps) {
    const router = useRouter();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage as "ja" | "ko" | "en"] || translations.en;

    if (dueMemos.length === 0) return null;

    return (
        <div className={`${styles.card} ${styles.reviewCard}`}>
            <div className={styles.headerRow}>
                <div className={styles.leftGroup}>
                    <div className={`${styles.iconCircle} ${styles.iconReview}`}>
                        <Repeat size={18} />
                    </div>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>
                            {t.timeToReview}
                        </h2>
                        <p className={styles.subtitle}>
                            {dueMemos.length} {t.reviewDesc}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/app/corrections')}
                    className={styles.actionButton}
                >
                    {t.startReview} <ArrowRight size={14} />
                </button>
            </div>

            <div className={styles.tokenList}>
                {dueMemos.slice(0, 5).map((memo, idx) => (
                    <span key={memo.id} className={`${styles.token} ${styles.tokenReview}`}>
                        {memo.token_text || "???"}
                    </span>
                ))}
                {dueMemos.length > 5 && (
                    <span className={styles.moreCount}>
                        +{dueMemos.length - 5}
                    </span>
                )}
            </div>

            <div className={styles.footer}>
                <Clock size={14} />
                {t.reviewTip}
            </div>
        </div>
    );
}
