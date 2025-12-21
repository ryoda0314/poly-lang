"use client";

import React from "react";
import { useStreamStore } from "./store";
import InputNode from "./InputNode";
import StreamCard from "./StreamCard";
import StreamSummary from "./StreamSummary";
import ParticleNetwork from "./visuals/ParticleNetwork";

import StreamPronunciationCard from "./StreamPronunciationCard";

export default function StreamCanvas() {
    const { streamItems } = useStreamStore();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
            position: "relative",
            background: "var(--color-bg)"
        }}>
            <ParticleNetwork intensity="low" />

            <div style={{ zIndex: 1, position: "relative", minHeight: "100%" }}> {/* Content Wrapper */}
                <InputNode />

                <div style={{
                    padding: "var(--space-4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    paddingBottom: "var(--space-8)"
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
                        if (item.kind === "sentence" || item.kind === "candidate") {
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

                                    <div style={{ fontSize: '1.1rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                        {item.data.corrected}
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
