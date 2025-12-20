"use client";

import React from "react";
import { useStreamStore } from "./store";
import InputNode from "./InputNode";
import StreamCard from "./StreamCard";
import StreamSummary from "./StreamSummary";
import ParticleNetwork from "./visuals/ParticleNetwork";

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
                    paddingBottom: "120px"
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
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}
