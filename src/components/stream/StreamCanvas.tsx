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

import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

export default function StreamCanvas() {
    const { streamItems } = useStreamStore();
    const { nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;

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
                flexDirection: "column",
                overflowY: "auto", // Allow main wrapper to scroll
                overflowX: "hidden"
            }}>
                {/* Header Area - Scrolls with content now */}
                <div style={{
                    flexShrink: 0,
                    zIndex: 10,
                    // Remove gradient if not needed, or keep for aesthetic separation
                    background: "var(--color-bg)" // Solid background to cover potential elements if any?
                    // Actually transparent or gradient is fine if it's the top element.
                }}>
                    <InputNode />
                </div>

                {/* Content Area - No independent scroll */}
                <div style={{
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
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.stream_correction_label}</div>
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

                                            // Split view for clarity (Pinyin supported via TokenizedSentence)
                                            // Calculate ranges for original (deletions) and corrected (insertions)
                                            const originalRanges: any[] = []; // Type import needed or use any
                                            let origPos = 0;

                                            const correctedRanges: any[] = [];
                                            let corrPos = 0;

                                            diffs.forEach(part => {
                                                const len = part.value.length;
                                                if (part.type === 'delete') {
                                                    originalRanges.push({ startIndex: origPos, endIndex: origPos + len - 1, type: 'delete' });
                                                    origPos += len;
                                                } else if (part.type === 'equal') {
                                                    origPos += len;
                                                    corrPos += len;
                                                } else if (part.type === 'insert') {
                                                    correctedRanges.push({ startIndex: corrPos, endIndex: corrPos + len - 1, type: 'insert' });
                                                    corrPos += len;
                                                }
                                            });

                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {/* Original */}
                                                    <div style={{ color: 'var(--color-fg-muted)', fontSize: '0.95rem' }}>
                                                        <TokenizedSentence
                                                            text={item.data.original}
                                                            phraseId={`orig-${idx}`}
                                                            highlightRanges={originalRanges}
                                                            disableMemoColors
                                                        />
                                                    </div>

                                                    {/* Arrow */}
                                                    <div style={{ opacity: 0.5, lineHeight: 0.8 }}>↓</div>

                                                    {/* Corrected */}
                                                    <div style={{ color: 'var(--color-fg)', fontWeight: 500 }}>
                                                        <TokenizedSentence
                                                            text={item.data.corrected}
                                                            phraseId={`corr-${idx}`}
                                                            highlightRanges={correctedRanges}
                                                            disableMemoColors
                                                        />
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
