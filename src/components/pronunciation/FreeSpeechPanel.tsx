"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, Square, RotateCcw, ChevronLeft } from "lucide-react";
import { useSpeakingPronunciation } from "@/hooks/use-speaking-pronunciation";
import styles from "./FreeSpeechPanel.module.css";

function scoreColor(s: number) {
    if (s >= 80) return "#10b981";
    if (s >= 60) return "#f59e0b";
    return "#ef4444";
}

function scoreGrade(s: number): string {
    if (s >= 90) return "Excellent";
    if (s >= 80) return "Great";
    if (s >= 65) return "Good";
    if (s >= 50) return "Fair";
    return "Keep Going";
}

export function FreeSpeechPanel({ onBack }: { onBack?: () => void }) {
    const pron = useSpeakingPronunciation();
    const [secs, setSecs] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    const handleStart = useCallback(async () => {
        setSecs(0);
        await pron.startFreeform();
        timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    }, [pron]);

    const handleStop = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        pron.stop();
    }, [pron]);

    const handleRetry = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        pron.cancel();
        setSecs(0);
    }, [pron]);

    const { state, result, error } = pron;
    const isRecording = state === "recording";
    const isProcessing = state === "processing";
    const isDone = state === "done" && result;

    /* ────────────────── RESULT VIEW ────────────────── */
    if (isDone && result) {
        const sc = result.scores;
        const overall = Math.round(sc?.overall ?? 0);
        const color = scoreColor(overall);
        const label = scoreGrade(overall);
        const metrics = sc ? [
            { label: "正確性", val: sc.accuracy },
            { label: "流暢さ",   val: sc.fluency },
            { label: "完全性", val: sc.completeness },
            { label: "抑揚",     val: sc.prosody },
        ] : [];
        const allWords = result.words;

        const R = 64, SW = 11;
        const circ = 2 * Math.PI * R;
        const dash = circ - (overall / 100) * circ;

        return (
            <div className={styles.page}>
                <div className={styles.scroll}>
                    {/* ── Hero (includes back button for seamless dark bg) ── */}
                    <div className={styles.heroContainer}>
                        <div className={styles.topBar}>
                            {onBack && (
                                <button className={styles.back} onClick={onBack}>
                                    <ChevronLeft size={16} /> 戻る
                                </button>
                            )}
                        </div>
                        <div className={styles.hero}>
                            <div className={styles.heroRing}>
                                <svg width={R * 2 + SW} height={R * 2 + SW} viewBox={`0 0 ${R * 2 + SW} ${R * 2 + SW}`}>
                                    <defs>
                                        <filter id="ringGlow">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>
                                    <circle
                                        cx={R + SW / 2} cy={R + SW / 2} r={R}
                                        fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={SW}
                                    />
                                    <circle
                                        cx={R + SW / 2} cy={R + SW / 2} r={R}
                                        fill="none" stroke={color} strokeWidth={SW}
                                        strokeLinecap="round"
                                        strokeDasharray={circ} strokeDashoffset={dash}
                                        transform={`rotate(-90 ${R + SW / 2} ${R + SW / 2})`}
                                        className={styles.ringAnim}
                                        filter="url(#ringGlow)"
                                    />
                                </svg>
                                <div className={styles.heroRingCenter}>
                                    <span className={styles.heroScore} style={{ color }}>{overall}</span>
                                    <span className={styles.heroScoreLabel}>/ 100</span>
                                </div>
                            </div>

                            <span className={styles.heroGrade}>{label}</span>
                            <div className={styles.heroStats}>
                                <span className={styles.heroStatPill}>{fmt(result.durationSeconds)}</span>
                                <span className={styles.heroStatPill}>{result.words.length} 語</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <div className={styles.content}>

                        {/* Metrics */}
                        {metrics.length > 0 && (
                            <div className={styles.card}>
                                <p className={styles.cardTitle}>詳細スコア</p>
                                {metrics.map(({ label: lbl, val }, i) => {
                                    const c = scoreColor(val);
                                    return (
                                        <div key={lbl} className={`${styles.metricRow} ${i > 0 ? styles.metricSep : ""}`}>
                                            <span className={styles.metricLabel}>{lbl}</span>
                                            <div className={styles.metricTrack}>
                                                <div className={styles.metricFill} style={{ width: `${val}%`, background: c }} />
                                            </div>
                                            <span className={styles.metricVal} style={{ color: c }}>{Math.round(val)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Colored transcript */}
                        <div className={styles.card}>
                            <p className={styles.cardTitle}>あなたの発話</p>
                            <div className={styles.chipWrap}>
                                {result.words.map((w, i) => {
                                    const c = scoreColor(w.accuracyScore);
                                    return (
                                        <span
                                            key={i}
                                            className={styles.chip}
                                            style={{
                                                color: c,
                                                background: c + "18",
                                                border: `1px solid ${c}35`,
                                            }}
                                        >
                                            {w.word}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className={styles.legend}>
                                <span style={{ color: "#10b981" }}>● 良い</span>
                                <span style={{ color: "#f59e0b" }}>● 要注意</span>
                                <span style={{ color: "#ef4444" }}>● 要改善</span>
                            </div>
                        </div>

                        {/* All words with phonemes */}
                        {allWords.length > 0 && (
                            <div className={styles.card}>
                                <div className={styles.cardTitleRow}>
                                    <p className={styles.cardTitle}>単語・音素評価</p>
                                    <span className={styles.badge}>{allWords.length} 語</span>
                                </div>
                                {allWords.map((w, i) => {
                                    const c = scoreColor(w.accuracyScore);
                                    return (
                                        <div key={i} className={`${styles.wordRow} ${i > 0 ? styles.metricSep : ""}`}>
                                            <div className={styles.wordRowMain}>
                                                <span className={styles.wordName} style={{ color: c }}>{w.word}</span>
                                                {w.errorType !== "None" && (
                                                    <span className={styles.errTag}>{w.errorType.toLowerCase()}</span>
                                                )}
                                                <div className={styles.metricTrack}>
                                                    <div className={styles.metricFill} style={{ width: `${w.accuracyScore}%`, background: c }} />
                                                </div>
                                                <span className={styles.metricVal} style={{ color: c }}>{Math.round(w.accuracyScore)}</span>
                                            </div>
                                            {w.phonemes.length > 0 && (
                                                <div className={styles.phonemeWrap}>
                                                    {w.phonemes.map((p, pi) => {
                                                        const pc = scoreColor(p.accuracyScore);
                                                        return (
                                                            <div
                                                                key={pi}
                                                                className={styles.phonemePill}
                                                                style={{
                                                                    background: pc + "18",
                                                                    border: `1px solid ${pc}35`,
                                                                    color: pc,
                                                                }}
                                                            >
                                                                <span className={styles.phonemeIpa}>/{p.phoneme}/</span>
                                                                <span className={styles.phonemeScore}>{Math.round(p.accuracyScore)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.dock}>
                    <button className={styles.retryBtn} onClick={handleRetry}>
                        <RotateCcw size={15} />
                        もう一度
                    </button>
                </div>
            </div>
        );
    }

    /* ────────────────── RECORDER VIEW ────────────────── */
    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                {onBack && (
                    <button className={styles.back} onClick={onBack}>
                        <ChevronLeft size={16} /> 戻る
                    </button>
                )}
            </div>

            <div className={styles.recBody}>
                {/* Top: mic area */}
                <div className={styles.recTop}>
                    <div className={styles.recText}>
                        <h2 className={styles.recTitle}>Free Speech</h2>
                        <p className={styles.recSub}>
                            {isProcessing
                                ? "Analyzing..."
                                : isRecording
                                ? "Speak freely  ·  tap to stop"
                                : "英語を話してAIが即時評価"}
                        </p>
                    </div>

                    {/* Mic scene: orbit rings + mic button */}
                    <div className={`${styles.micScene} ${isRecording ? styles.micSceneActive : ""} ${isProcessing ? styles.micSceneProcessing : ""}`}>
                        <div className={styles.orbit1} />
                        <div className={styles.orbit2} />

                        {isRecording && (
                            <div className={styles.wave}>
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <div key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.06}s` }} />
                                ))}
                            </div>
                        )}

                        <div className={styles.micWrap}>
                            {isRecording && (
                                <>
                                    <div className={styles.micRing1} />
                                    <div className={styles.micRing2} />
                                    <div className={styles.micRing3} />
                                </>
                            )}
                            {isProcessing ? (
                                <div className={styles.processingBtn}>
                                    <div className={styles.spinner} />
                                </div>
                            ) : isRecording ? (
                                <button className={styles.stopBtn} onClick={handleStop}>
                                    <Square size={26} fill="white" strokeWidth={0} />
                                </button>
                            ) : (
                                <button className={styles.micBtn} onClick={handleStart}>
                                    <Mic size={32} strokeWidth={1.5} />
                                </button>
                            )}
                        </div>
                    </div>

                    <p className={styles.micLabel}>
                        {isRecording
                            ? <span className={styles.recLabel}>{fmt(secs)}</span>
                            : isProcessing
                            ? "Analyzing..."
                            : "Tap to start"}
                    </p>
                </div>

                {/* Bottom: tips / error */}
                <div className={styles.recBottom}>
                    {error && (
                        <div className={styles.error}>
                            <span style={{ flex: 1 }}>{error}</span>
                            <button className={styles.errorRetry} onClick={handleRetry}>再試行</button>
                        </div>
                    )}
                    {!isRecording && !isProcessing && (
                        <div className={styles.tips}>
                            <p className={styles.tipsLabel}>Tips</p>
                            {["自然なペースで話す", "各単語をはっきり発音する", "10秒以上を目標に"].map(t => (
                                <p key={t} className={styles.tipItem}>{t}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
