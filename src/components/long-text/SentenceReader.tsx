"use client";

import React, { useState } from "react";
import { Volume2, Eye, EyeOff, Check } from "lucide-react";
import TokenizedSentence from "@/components/TokenizedSentence";
import type { LongTextSentence } from "@/types/long-text";
import styles from "./SentenceReader.module.css";

interface SentenceReaderProps {
    sentence: LongTextSentence;
    currentIndex: number;
    totalSentences: number;
    onPlayAudio: () => void;
    audioLoading: boolean;
    isCompleted?: boolean;
    onMarkCompleted?: () => void;
}

export default function SentenceReader({
    sentence,
    currentIndex,
    totalSentences,
    onPlayAudio,
    audioLoading,
    isCompleted,
    onMarkCompleted,
}: SentenceReaderProps) {
    const [showTranslation, setShowTranslation] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.counter}>
                    {currentIndex + 1}
                </span>
                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => setShowTranslation(!showTranslation)}
                        title={showTranslation ? "翻訳を隠す" : "翻訳を表示"}
                    >
                        {showTranslation ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                        className={styles.actionBtn}
                        onClick={onPlayAudio}
                        disabled={audioLoading}
                        title="音声を再生"
                    >
                        {audioLoading ? (
                            <div className={styles.spinner} />
                        ) : (
                            <Volume2 size={18} />
                        )}
                    </button>
                    {onMarkCompleted && (
                        <button
                            className={`${styles.actionBtn} ${isCompleted ? styles.completedBtn : ''}`}
                            onClick={onMarkCompleted}
                            title={isCompleted ? "完了済み" : "完了にする"}
                        >
                            <Check size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.sentenceWrapper}>
                <TokenizedSentence
                    text={sentence.text}
                    tokens={sentence.tokens}
                    phraseId={sentence.id}
                />
            </div>

            {showTranslation && sentence.translation && (
                <div className={styles.translation}>
                    {sentence.translation}
                </div>
            )}
        </div>
    );
}
