"use client";

import React from "react";
import { useStreamStore } from "./store";
import InputNode from "./InputNode";
import StreamCard from "./StreamCard";
import StreamSummary from "./StreamSummary";
import ParticleNetwork from "./visuals/ParticleNetwork";

import StreamPronunciationCard from "./StreamPronunciationCard";
import TokenizedSentence from "@/components/TokenizedSentence";
import { computeDiff, DiffPart } from "@/lib/diff";

export default function StreamCanvas() {
    const { streamItems } = useStreamStore();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0, // Allow shrinking
            overflow: "hidden", // Disable outer scroll
            position: "relative",
            background: "var(--color-bg)"
        }}>
            <ParticleNetwork intensity="low" />

            <div style={{
                zIndex: 1,
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Fixed Header Area */}
                <div style={{
                    flexShrink: 0,
                    zIndex: 10,
                    background: "linear-gradient(to bottom, var(--color-bg) 80%, transparent)"
                }}>
                    <InputNode />
                </div>

                {/* Scrollable Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "var(--space-4)",
                    paddingTop: "0", // Space is handled by gap
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    paddingBottom: "150px"
                }}>
                    {streamItems.length === 0 && (
                        <div style={{
                            textAlign: "center",
                            padding: "var(--space-8)",
                            color: "var(--color-fg-muted)",
                            fontStyle: "italic",
                            opacity: 0.6
                        }}>
                            Speak your mind...
                        </div>
                    )}

                    {streamItems.map((item, idx) => {
                        if (item.kind === "sentence" || item.kind === "candidate" || item.kind === "correction-card") {
                            return <StreamCard key={`${item.data.sid}-${idx}`} item={item} />;
                        }
                        if (item.kind === "summary") {
                            // @ts-ignore
                            return <StreamSummary key={`sum-${idx}`} item={item} />;
                        }

                        if (item.kind === "user-speech") {
                            // @ts-ignore
                            return <StreamPronunciationCard key={`speech-${idx}`} item={item} />;
                        }
                        if (item.kind === "correction") {
                            return (
                                <div key={`correction-${idx}`} style={{
                                    alignSelf: 'flex-start',
                                    background: 'var(--color-bg)',
                                    padding: '1.25rem',
                                    borderRadius: '16px 16px 16px 4px',
                                    border: '1px solid var(--color-border)',
                                    maxWidth: '90%',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correction</div>
                                    </div>

                                    <div style={{ fontSize: '1.1rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                                        {(() => {
                                            const diffs = computeDiff(item.data.original, item.data.corrected);
                                            // Check if essentially unchanged to avoid noise
                                            const isChanged = item.data.original.trim() !== item.data.corrected.trim();

                                            if (!isChanged) {
                                                return (
                                                    <TokenizedSentence
                                                        text={item.data.corrected}
                                                        tokens={item.data.corrected.split(/([\s,.!?;:]+)/).filter(Boolean)}
                                                        phraseId={`corr-${idx}`}
                                                    />
                                                );
                                            }

                                            // Split view for clarity
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {/* Original */}
                                                    <div style={{ color: 'var(--color-fg-muted)', fontSize: '0.95rem' }}>
                                                        {diffs.map((part, i) => {
                                                            if (part.type === 'equal') return <span key={i} style={{ opacity: 0.8 }}>{part.value}</span>;
                                                            if (part.type === 'delete') {
                                                                if (!part.value.trim()) return null;
                                                                return (
                                                                    <span key={i} style={{
                                                                        textDecoration: 'line-through',
                                                                        color: 'var(--color-destructive)',
                                                                        background: 'rgba(255, 0, 0, 0.1)',
                                                                        padding: '0 2px'
                                                                    }}>
                                                                        {part.value}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>

                                                    {/* Arrow */}
                                                    <div style={{ opacity: 0.5, lineHeight: 0.8 }}>↓</div>

                                                    {/* Corrected */}
                                                    <div style={{ color: 'var(--color-fg)', fontWeight: 500 }}>
                                                        {diffs.map((part, i) => {
                                                            if (part.type === 'equal') return <span key={i}>{part.value}</span>;
                                                            if (part.type === 'insert') {
                                                                return (
                                                                    <span key={i} style={{
                                                                        color: 'var(--color-success)',
                                                                        background: 'rgba(0, 255, 0, 0.1)',
                                                                        padding: '0 2px'
                                                                    }}>
                                                                        {part.value}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div style={{
                                        fontSize: '0.95rem',
                                        color: 'var(--color-fg-muted)',
                                        background: 'var(--color-bg-alt)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        lineHeight: 1.6
                                    }}>
                                        {item.data.explanation}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}
