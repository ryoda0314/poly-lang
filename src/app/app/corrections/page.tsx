"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-context";
import { correctText, CorrectionResult } from "@/actions/correction";
import { Check, Loader2, ArrowRight } from "lucide-react";
import styles from "./page.module.css";
import TokenizedSentence from "@/components/TokenizedSentence";

export default function CorrectionPage() {
    const { activeLanguage } = useAppStore();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CorrectionResult | null>(null);

    const handleCorrect = async () => {
        if (!input.trim() || !activeLanguage) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await correctText(input, activeLanguage.name);
            setResult(res);
        } finally {
            setLoading(false);
        }
    };

    if (!activeLanguage) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>AI Correction</h1>
                <p className={styles.subtitle}>
                    Write in <span className={styles.langName}>{activeLanguage.name}</span> and get instant feedback.
                </p>
            </header>

            <div className={styles.editor}>
                <textarea
                    className={styles.textarea}
                    placeholder={`Type something in ${activeLanguage.name}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={6}
                />
                <div className={styles.actions}>
                    <button
                        className={styles.correctBtn}
                        onClick={handleCorrect}
                        disabled={loading || !input.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className={styles.spin} size={18} />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Check My Grammar
                            </>
                        )}
                    </button>
                </div>
            </div>

            {result && (
                <div className={styles.resultContainer}>
                    <div className={styles.resultCard}>
                        <h3 className={styles.cardTitle}>Correction</h3>
                        <div className={styles.correctionBox}>
                            <div className={styles.original}>
                                <span className={styles.label}>Your text:</span>
                                <p>{result.original}</p>
                            </div>
                            <div className={styles.arrow}><ArrowRight size={20} /></div>
                            <div className={styles.corrected}>
                                <span className={styles.label}>Improved:</span>
                                <div className={styles.tokenizedWrapper}>
                                    <TokenizedSentence text={result.corrected} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.explanation}>
                            <strong>Why?</strong> {result.explanation}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
