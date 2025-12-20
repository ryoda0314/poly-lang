"use client";

import React from "react";
import { StreamItem } from "@/types/stream";
import ReactMarkdown from "react-markdown";

interface Props {
    item: Extract<StreamItem, { kind: "summary" }>;
}

export default function StreamSummary({ item }: Props) {
    const { score, text } = item.data;

    return (
        <div style={{
            padding: "var(--space-4)",
            background: "white",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            marginBottom: "var(--space-4)",
            position: "relative",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
            <div style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "var(--space-2)",
                color: "var(--color-fg-muted)"
            }}>
                Insight ({score}/100)
            </div>

            <div style={{
                fontSize: "1rem",
                color: "var(--color-fg)",
                lineHeight: 1.5
            }}>
                <ReactMarkdown>{text}</ReactMarkdown>
            </div>
        </div>
    );
}
