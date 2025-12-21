"use client";

import React, { useState } from "react";
import { StreamItem, PronunciationDetailedWord, PronunciationScore } from "@/types/stream";
import { ChevronDown, ChevronUp, Mic } from "lucide-react";

interface StreamPronunciationCardProps {
    item: StreamItem & { kind: "user-speech" };
}

export default function StreamPronunciationCard({ item }: StreamPronunciationCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!item.score || !item.details) {
        // Fallback for simple display if no detailed data
        return (
            <div style={{
                alignSelf: 'flex-end',
                background: 'var(--color-surface)',
                padding: '1rem',
                borderRadius: '16px 16px 4px 16px',
                maxWidth: '90%',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '0.5rem',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ fontSize: '1rem' }}>{item.text}</div>
            </div>
        );
    }

    const { accuracy, fluency, completeness, prosody } = item.score;

    return (
        <div style={{
            alignSelf: 'flex-end',
            width: '100%',
            maxWidth: '600px', // Allow wider card for details
            marginBottom: '1rem',
            background: 'var(--color-surface)',
            borderRadius: '16px 16px 4px 16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
        }}>
            {/* Header: Score Summary */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-bg-sub)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: 48, height: 48,
                        borderRadius: '50%',
                        background: getScoreColor(accuracy, 'bg'),
                        color: getScoreColor(accuracy, 'fg'),
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '1.1rem',
                        border: `2px solid ${getScoreColor(accuracy, 'border')}`
                    }}>
                        {Math.round(accuracy)}
                        <span style={{ fontSize: '0.5rem', fontWeight: 500, opacity: 0.8 }}>ACC</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                            PRONUNCIATION SCORE
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                            <ScoreLabel label="Fluency" value={fluency} />
                            <ScoreLabel label="Completeness" value={completeness} />
                            <ScoreLabel label="Prosody" value={prosody} />
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '8px', color: 'var(--color-fg-muted)'
                    }}
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Content: Text & Word Analysis */}
            <div style={{ padding: '1rem', display: isExpanded ? 'block' : 'none' }}>
                {/* Full Text Display */}
                <div style={{
                    fontSize: '1.2rem',
                    marginBottom: '1.5rem',
                    lineHeight: 1.5,
                    fontWeight: 500,
                    color: 'var(--color-fg)'
                }}>
                    {item.text}
                </div>

                {/* Word Analysis List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Word Analysis
                    </div>

                    {item.details.map((word, idx) => (
                        <WordAnalysisCard key={idx} word={word} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ScoreLabel({ label, value }: { label: string, value: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--color-fg-muted)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: getScoreColor(value, 'fg') }}>{Math.round(value)}</span>
        </div>
    );
}

function WordAnalysisCard({ word }: { word: PronunciationDetailedWord }) {
    const score = word.accuracyScore;
    const isGood = score >= 80;
    const isWarning = score >= 60 && score < 80;

    // Main card color based on score
    const borderColor = isGood ? 'var(--color-border)' : (isWarning ? '#f59e0b' : '#ef4444');
    const borderStyle = isGood ? 'solid' : 'solid'; // Could be dashed for bad
    const bgBase = 'var(--color-bg-alt)';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            background: bgBase,
            border: `1px ${borderStyle} ${borderColor}`,
            position: 'relative',
        }}>
            {/* Word Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{word.word}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {word.errorType && word.errorType !== "None" && (
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                            color: '#ef4444', padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)'
                        }}>
                            {word.errorType}
                        </span>
                    )}
                    <span style={{
                        fontSize: '1rem', fontWeight: 700,
                        color: getScoreColor(score, 'fg')
                    }}>
                        {Math.round(score)}
                    </span>
                </div>
            </div>

            {/* Phonemes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {word.phonemes.map((p, i) => (
                    <PhonemeBadge key={i} phoneme={p.phoneme} score={p.accuracyScore} />
                ))}
            </div>
        </div>
    );
}

function PhonemeBadge({ phoneme, score }: { phoneme: string, score: number }) {
    const bg = getScoreColor(score, 'bg');
    const fg = getScoreColor(score, 'fg'); // Use FG color for text
    // For badge, we might want custom colors matching the image (Green/Tealish, Orange, Red)

    let badgeBg = 'rgba(74, 222, 128, 0.2)';
    let badgeFg = 'var(--color-success-fg)';
    let badgeBorder = 'rgba(74, 222, 128, 0.3)';

    if (score < 60) { // Red
        badgeBg = 'rgba(239, 68, 68, 0.2)';
        badgeFg = '#ef4444';
        badgeBorder = 'rgba(239, 68, 68, 0.3)';
    } else if (score < 80) { // Yellow/Orange
        badgeBg = 'rgba(250, 204, 21, 0.2)';
        badgeFg = '#b45309';
        badgeBorder = 'rgba(250, 204, 21, 0.3)';
    } else {
        // High score - Teal/Cyan vibe from image
        badgeBg = 'rgba(45, 212, 191, 0.15)';
        badgeFg = '#0d9488';
        badgeBorder = 'rgba(45, 212, 191, 0.3)';
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            fontSize: '0.8rem',
            background: badgeBg,
            color: badgeFg,
            border: `1px solid ${badgeBorder}`,
            borderRadius: '6px',
            overflow: 'hidden'
        }}>
            <span style={{ padding: '2px 6px', fontWeight: 500 }}>/{phoneme}/</span>
            <span style={{
                padding: '2px 6px',
                background: 'rgba(0,0,0,0.05)',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderLeft: `1px solid ${badgeBorder}`
            }}>
                {Math.round(score)}
            </span>
        </div>
    );
}

function getScoreColor(score: number, type: 'bg' | 'fg' | 'border') {
    if (score >= 80) {
        if (type === 'bg') return 'var(--color-success-bg)';
        if (type === 'fg') return 'var(--color-success-fg)';
        if (type === 'border') return 'var(--color-success-fg)';
    }
    if (score >= 60) {
        if (type === 'bg') return '#fef9c3'; // yellow-100
        if (type === 'fg') return '#b45309'; // amber-700
        if (type === 'border') return '#facc15'; // yellow-400
    }
    // < 60
    if (type === 'bg') return '#fee2e2'; // red-100
    if (type === 'fg') return '#b91c1c'; // red-700
    if (type === 'border') return '#ef4444'; // red-500
    return 'gray';
}
