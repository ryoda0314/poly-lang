"use client";

import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./ChatCorrections.module.css";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatCorrections() {
    const { corrections } = useChatStore();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const getLabel = (key: string, fallback: string) => {
        return (t as Record<string, string>)[key] || fallback;
    };

    if (corrections.length === 0) {
        return (
            <div className={styles.emptyState}>
                <CheckCircle2 size={40} strokeWidth={1.5} />
                <p>{getLabel('chatNoCorrections', '添削はまだありません')}</p>
                <p className={styles.emptyHint}>
                    {getLabel('chatCorrectionsHint', '会話中の間違いがあればここに表示されます')}
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {corrections.slice().reverse().map((correction) => (
                    <motion.div
                        key={correction.id}
                        className={styles.card}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={styles.comparison}>
                            <span className={styles.original}>{correction.original}</span>
                            <ArrowRight size={16} className={styles.arrow} />
                            <span className={styles.corrected}>{correction.corrected}</span>
                        </div>
                        <p className={styles.explanation}>{correction.explanation}</p>
                        <span className={styles.timestamp}>
                            {new Date(correction.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
