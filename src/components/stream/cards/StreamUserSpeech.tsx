"use client";

import React, { useState } from "react";
import { StreamItem, PronunciationDetailedWord, PronunciationDetailedPhoneme } from "@/types/stream";
import { ChevronDown, ChevronUp, Mic } from "lucide-react";

interface StreamUserSpeechProps {
    item: StreamItem & { kind: "user-speech" };
}

export default function StreamUserSpeech({ item }: StreamUserSpeechProps) {
    const [isExpanded, setIsExpanded] = useState(true); // Default expanded to show off the UI

    const { text, score, details } = item;

    // Helper to get color based on score
    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--color-success-fg)";
        if (score >= 60) return "#d97706"; // amber-600
        return "var(--color-destructive)";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "rgba(34, 197, 94, 0.1)"; // green
        if (score >= 60) return "rgba(245, 158, 11, 0.1)"; // amber
        return "rgba(239, 68, 68, 0.1)"; // red
    };

    return (
        <div style={{
            alignSelf: 'flex-end',
            background: 'var(--color-surface)',
            borderRadius: '16px 16px 4px 16px',
            maxWidth: '100%', // Allow full width for analysis
            width: 'min(600px, 90vw)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '1rem',
            overflow: 'hidden',
            border: '1px solid var(--color-border)'
        }}>
            {/* Header / Main Text */}
            <div style={{ padding: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500 }}>
                        {/* If no details, show raw text. If details, show color-coded text */}
                        {!details ? text : (
                            <span>
                                {details.map((w, i) => (
                                    <span key={i} style={{
                                        color: getScoreColor(w.accuracyScore),
                                        borderBottom: w.accuracyScore < 80 ? '2px dotted currentColor' : 'none',
                                        marginRight: '0.3em',
                                        display: 'inline-block'
                                    }}>
                                        {w.word}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>
                    {/* Overall Score Badge */}
                    {score && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                border: `3px solid ${getScoreColor(score.accuracy)}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', fontWeight: 800,
                                color: getScoreColor(score.accuracy),
                                background: getScoreBg(score.accuracy)
                            }}>
                                {Math.round(score.accuracy)}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-fg-muted)', marginTop: 4, fontWeight: 700 }}>ACCURACY</div>
                        </div>
                    )}
                </div>

                {/* Score Summary Row */}
                {score && (
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', paddingBottom: '0.5rem', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}>
                        <ScoreMetric label="FLUENCY" value={score.fluency} />
                        <ScoreMetric label="PROSODY" value={score.prosody} />
                        <ScoreMetric label="COMPLETENESS" value={score.completeness} />

                        <div style={{ flex: 1 }} />

                        {details && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--color-fg-muted)',
                                    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', cursor: 'pointer'
                                }}
                            >
                                {isExpanded ? "Hide Analysis" : "Show Analysis"}
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Analysis Area */}
            {isExpanded && details && (
                <div style={{
                    background: 'var(--color-bg-sub)',
                    padding: '1.25rem',
                    borderTop: '1px solid var(--color-border)',
                }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Word Analysis
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {details.map((wordData, i) => (
                            <WordCard key={i} wordData={wordData} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreMetric({ label, value }: { label: string, value: number }) {
    const getColor = (v: number) => v >= 80 ? 'var(--color-success-fg)' : v >= 60 ? '#d97706' : 'var(--color-destructive)';
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: getColor(value) }}>{Math.round(value)}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-fg-muted)', fontWeight: 600 }}>{label}</span>
        </div>
    );
}

function WordCard({ wordData }: { wordData: PronunciationDetailedWord }) {
    const score = wordData.accuracyScore;
    const isGood = score >= 80;
    const isWarn = score >= 60 && score < 80;

    const borderColor = isGood ? 'transparent' : isWarn ? '#d97706' : 'var(--color-destructive)';
    const bg = 'var(--color-bg)';

    return (
        <div style={{
            background: bg,
            borderRadius: '12px',
            padding: '1rem',
            border: `1px solid ${isGood ? 'var(--color-border)' : borderColor}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Word Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{wordData.word}</span>
                <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: isGood ? 'var(--color-success-fg)' : isWarn ? '#d97706' : 'var(--color-destructive)'
                }}>
                    {Math.round(score)}
                </span>
            </div>

            {/* Error Type Label if needed */}
            {wordData.errorType && wordData.errorType !== "None" && (
                <div style={{
                    fontSize: '0.6rem', textTransform: 'uppercase',
                    color: 'var(--color-destructive)', fontWeight: 700, marginBottom: '0.5rem'
                }}>
                    {wordData.errorType}
                </div>
            )}

            {/* Phonemes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {wordData.phonemes.map((p, i) => (
                    <PhonemeBadge key={i} phoneme={p} />
                ))}
            </div>

            {/* Background progress bar effect? Maybe too much. */}
        </div>
    );
}

function PhonemeBadge({ phoneme }: { phoneme: PronunciationDetailedPhoneme }) {
    const score = phoneme.accuracyScore;
    const isGood = score >= 80;
    const isWarn = score >= 60 && score < 80;

    const bg = isGood ? 'var(--color-bg-alt)' : isWarn ? '#fef3c7' : '#fee2e2'; // amber-100, red-100
    const fg = isGood ? 'var(--color-fg-muted)' : isWarn ? '#92400e' : '#991b1b';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            background: bg,
            borderRadius: '6px',
            padding: '2px 6px',
            gap: '4px',
            fontSize: '0.8rem'
        }}>
            <span style={{ color: fg, fontFamily: 'monospace' }}>/{phoneme.phoneme}/</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: fg, opacity: 0.8 }}>
                {Math.round(score)}
            </span>
        </div>
    );
}
