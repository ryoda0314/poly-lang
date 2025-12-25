import React, { useState } from "react";
import { StreamItem } from "@/types/stream";
import styles from "./StreamCard.module.css";
import { useStreamStore } from "./store";
import ReactMarkdown from "react-markdown";
import { Volume2, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { useAwarenessStore } from "@/store/awareness-store";

interface Props {
    item: Extract<StreamItem, { kind: "sentence" | "candidate" }>;
}

export default function StreamCard({ item }: Props) {
    const { selectedSid, toggleSelection } = useStreamStore();
    const { verifyAttemptedMemosInText } = useAwarenessStore();
    const data = item.data;
    const isSelected = selectedSid === data.sid;
    const [isDiffOpen, setIsDiffOpen] = useState(false);

    const sourceClass = data.source === "BASE" ? styles.base
        : data.source === "CANDIDATE" ? styles.candidate
            : styles.compare;

    const handleVerify = () => {
        // Trigger verification logic
        if (data.source === 'CANDIDATE') {
            verifyAttemptedMemosInText(data.learn);
        }
    }

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleVerify();
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(data.learn);
            u.lang = data.language || 'en'; // default logic
            window.speechSynthesis.speak(u);
        }
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleVerify();
        alert("Saved! (Mock)"); // Placeholder
    };

    const toggleDiff = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextState = !isDiffOpen;
        setIsDiffOpen(nextState);
        if (nextState) {
            handleVerify();
        }
    };

    const hasDiff = item.kind === 'candidate' && item.diff;

    return (
        <div
            className={`${styles.card} ${sourceClass} ${isSelected ? styles.selected : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                toggleSelection(data.sid);
            }}
        >
            <div className={styles.meta}>{data.source}</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div className={styles.text}>{data.learn}</div>

                {/* Actions for Candidates */}
                {data.source === 'CANDIDATE' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={handlePlay} style={actionButtonStyle} title="Play TTS">
                            <Volume2 size={16} />
                        </button>
                        <button onClick={handleSave} style={actionButtonStyle} title="Save Correction">
                            <Bookmark size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.translation}>{data.translation}</div>

            {/* Diffs and Hint Section */}
            {hasDiff && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={toggleDiff}
                        style={{
                            ...actionButtonStyle,
                            width: '100%',
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            fontSize: '0.8rem',
                            padding: '4px 8px',
                            marginBottom: 4
                        }}
                    >
                        {isDiffOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span style={{ marginLeft: 4 }}>{isDiffOpen ? "Hide Changes" : "Show Changes"}</span>
                    </button>

                    {isDiffOpen && item.diff && (
                        <div style={{
                            fontSize: '0.9rem',
                            background: 'rgba(255,255,255,0.5)',
                            padding: 8,
                            borderRadius: 4,
                            marginBottom: 8
                        }}>
                            <div style={{ color: 'var(--color-destructive)', textDecoration: 'line-through' }}>{item.diff.before}</div>
                            <div style={{ color: 'var(--color-accent)' }}>{item.diff.after}</div>
                        </div>
                    )}
                </div>
            )}

            {'tags' in item && (
                <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
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

const actionButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-fg-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    transition: 'background 0.2s',
};
