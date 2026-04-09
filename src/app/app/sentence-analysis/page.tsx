"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";
import { useSentenceAnalysisStore } from "@/store/sentence-analysis-store";
import SentenceInput from "@/components/sentence-analysis/SentenceInput";
import AnalysisResult from "@/components/sentence-analysis/AnalysisResult";
import { Search, Sparkles, Check } from "lucide-react";
import styles from "./page.module.css";

export default function SentenceAnalysisPage() {
    const { activeLanguageCode } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (activeLanguageCode && activeLanguageCode !== 'en') {
            router.replace('/app/dashboard');
        }
    }, [activeLanguageCode, router]);
    const {
        viewState,
        inputSentence,
        analysisResult,
        isAnalyzing,
        loadingStage,
        error,
        setInputSentence,
        analyze,
        goBackToInput,
    } = useSentenceAnalysisStore();

    // Unlock orientation on this page (manifest locks to portrait globally)
    useEffect(() => {
        const so = screen?.orientation as any;
        if (!so) return;
        so.unlock?.();
        return () => {
            so.lock?.("portrait")?.catch?.(() => {});
        };
    }, []);

    const handleAnalyze = useCallback((sentence: string) => {
        analyze(sentence);
    }, [analyze]);

    // Loading view
    if (viewState === "loading") {
        const stages = [
            { icon: Search, label: "主節のSVOCを解析中..." },
            { icon: Sparkles, label: "句・節を展開中..." },
            { icon: Sparkles, label: "解説を生成中..." },
        ];

        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <p className={styles.loadingSentence}>{inputSentence}</p>
                    <div className={styles.stages}>
                        {stages.map((stage, i) => {
                            const isDone = loadingStage > i;
                            const isActive = loadingStage === i;
                            const isPending = loadingStage < i;
                            const Icon = stage.icon;
                            return (
                                <div
                                    key={i}
                                    className={`${styles.stage} ${isDone ? styles.stageDone : ""} ${isActive ? styles.stageActive : ""} ${isPending ? styles.stagePending : ""}`}
                                >
                                    <div className={styles.stageIcon}>
                                        {isDone ? <Check size={14} /> : <Icon size={14} />}
                                    </div>
                                    <span className={styles.stageLabel}>{stage.label}</span>
                                    {isActive && <span className={styles.stageDot} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Result view
    if (viewState === "result" && analysisResult) {
        return (
            <div className={styles.container}>
                <AnalysisResult
                    result={analysisResult}
                    onBack={goBackToInput}
                    onNewAnalysis={(sentence) => {
                        setInputSentence(sentence);
                        analyze(sentence);
                    }}
                />
            </div>
        );
    }

    // Input view (default)
    return (
        <div className={styles.container}>
            <SentenceInput
                value={inputSentence}
                onChange={setInputSentence}
                onSubmit={handleAnalyze}
                isLoading={isAnalyzing}
                error={error}
            />
        </div>
    );
}
