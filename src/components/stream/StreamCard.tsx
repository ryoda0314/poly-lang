"use client";

import React from "react";
import { StreamItem } from "@/types/stream";
import styles from "./StreamCard.module.css";
import { useStreamStore } from "./store";
import ReactMarkdown from "react-markdown";

interface Props {
    item: Extract<StreamItem, { kind: "sentence" | "candidate" }>;
}

export default function StreamCard({ item }: Props) {
    const { selectedSid, toggleSelection } = useStreamStore();
    const data = item.data;
    const isSelected = selectedSid === data.sid;

    const sourceClass = data.source === "BASE" ? styles.base
        : data.source === "CANDIDATE" ? styles.candidate
            : styles.compare;

    return (
        <div
            className={`${styles.card} ${sourceClass} ${isSelected ? styles.selected : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                toggleSelection(data.sid);
            }}
        >
            <div className={styles.meta}>{data.source}</div>
            <div className={styles.text}>{data.learn}</div>
            <div className={styles.translation}>{data.translation}</div>

            {'tags' in item && (
                <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {/* @ts-ignore */}
                        {item.tags?.map((t: string) => (
                            <span key={t} style={{ fontSize: '0.7em', background: '#eee', padding: '2px 4px', borderRadius: 4 }}>{t}</span>
                        ))}
                    </div>
                    {/* @ts-ignore */}
                    {item.hint && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)', lineHeight: 1.5 }}>
                            {/* @ts-ignore */}
                            <ReactMarkdown>{item.hint}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
