import React, { useState } from "react";
import { StreamItem, CorrectionCardData } from "@/types/stream";
import styles from "./StreamCard.module.css";
import { useStreamStore } from "./store";
import ReactMarkdown from "react-markdown";
import { Volume2, Bookmark, ChevronDown, ChevronUp, Copy, MoveRight, Star, ArrowDown } from "lucide-react";
import { useAwarenessStore } from "@/store/awareness-store";

interface Props {
    item: Extract<StreamItem, { kind: "sentence" | "candidate" | "correction-card" }>;
}

export default function StreamCard({ item }: Props) {
    if (item.kind === "correction-card") {
        return <CorrectionCard item={item} />;
    }
    // Legacy support
    if (item.kind === "sentence" || item.kind === "candidate") {
        return <LegacyStreamCard item={item} />;
    }
    return null;
}

// ------------------------------------------------------------------
// v0.6 Correction Card (Assessment -> Solution)
// ------------------------------------------------------------------
function CorrectionCard({ item }: { item: Extract<StreamItem, { kind: "correction-card" }> }) {
    const data = item.data;
    const [isDiffOpen, setIsDiffOpen] = useState(true);
    const [isBoundaryOpen, setIsBoundaryOpen] = useState(false);
    const [isAlternativesOpen, setIsAlternativesOpen] = useState(false);
    const { verifyAttemptedMemosInText } = useAwarenessStore();

    const handleVerifyLikeAction = () => {
        verifyAttemptedMemosInText(data.recommended);
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleVerifyLikeAction();
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(data.recommended);
            u.lang = 'en';
            window.speechSynthesis.speak(u);
        }
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleVerifyLikeAction();
        alert("Saved to Library! (Mock)");
    };

    const toggleBoundary = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsBoundaryOpen(!isBoundaryOpen);
    };

    const toggleAlternatives = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAlternativesOpen(!isAlternativesOpen);
    };

    const score = data.score || 0;

    return (
        <div className={styles.card} style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px' // Increased gap clearly separating Assessment from Solution
        }}>
            {/* -------------------------------------------------------------
               SECTION 1: ASSESSMENT (Your Attempt + Score + General Feedback)
               ------------------------------------------------------------- */}
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative'
            }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Your Attempt
                </div>

                {/* Original Text (Large) */}
                <div style={{
                    fontSize: '1.25rem', // Larger
                    color: 'var(--color-fg)',
                    lineHeight: 1.4,
                    marginBottom: '16px'
                }}>
                    "{data.original}"
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

                {/* Score & General Feedback */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)' }}>Naturalness Score</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={14} fill={i * 20 <= score ? "var(--color-accent)" : "none"} color="var(--color-accent)" />
                                ))}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{score}</span>
                        </div>
                    </div>
                    {/* Summary (Verdict) */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        color: 'var(--color-fg)',
                        fontWeight: 500
                    }}>
                        <span style={{ fontSize: '1.2em' }}>📝</span>
                        <span>{data.summary_1l}</span>
                    </div>
                </div>
            </div>

            {/* Visual Flow Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-8px', marginBottom: '-8px' }}>
                <div style={{ background: 'var(--color-bg-sub)', borderRadius: '50%', padding: '4px' }}>
                    <ArrowDown size={16} color="var(--color-fg-muted)" />
                </div>
            </div>

            {/* -------------------------------------------------------------
               SECTION 2: SOLUTION (Recommendation + Why + Diff)
               ------------------------------------------------------------- */}
            <div style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-primary)', // Accent border for solution
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                        Better Phrasing
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handlePlay} className={styles.iconBtn} title="Play TTS">
                            <Volume2 size={18} />
                        </button>
                        <button onClick={handleSave} className={styles.iconBtn} title="Save">
                            <Bookmark size={18} />
                        </button>
                    </div>
                </div>

                {/* Recommended Text (Very Prominent) */}
                <div style={{
                    fontSize: '1.4rem', // Big! 
                    fontWeight: 600,
                    color: 'var(--color-fg)',
                    lineHeight: 1.3,
                    marginBottom: '8px'
                }}>
                    {data.recommended}
                </div>

                {data.recommended_translation && (
                    <div style={{ fontSize: '0.95rem', color: 'var(--color-fg-muted)', marginBottom: '20px' }}>
                        {data.recommended_translation}
                    </div>
                )}

                {/* Why? (Reasoning/Points) */}
                {data.points && data.points.length > 0 && (
                    <div style={{
                        background: 'var(--color-bg-sub)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Why this is better
                        </div>
                        <ul style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '0.95rem',
                            color: 'var(--color-fg)',
                            lineHeight: 1.6
                        }}>
                            {data.points.map((p, i) => (
                                <li key={i}>{p}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Diff (Collapsible or always visible? User asked for "Why" next, diff is part of "How". Keep it simple) */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-fg-muted)', marginRight: '4px' }}>Diff:</span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--color-destructive)', background: 'rgba(255,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {data.diff.before}
                    </span>
                    <MoveRight size={14} color="var(--color-fg-muted)" />
                    <span style={{ color: 'var(--color-success)', background: 'rgba(0,255,0,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {data.diff.after}
                    </span>
                </div>

            </div>

            {/* -------------------------------------------------------------
               SECTION 3: EXTRAS (Alternatives)
               ------------------------------------------------------------- */}
            {(data.boundary_1l || (data.alternatives && data.alternatives.length > 0)) && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {data.boundary_1l && (
                        <button
                            onClick={toggleBoundary}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                fontSize: '0.85rem',
                                color: 'var(--color-fg-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span>Boundary Note</span>
                            <span>{isBoundaryOpen ? '▲' : '▼'}</span>
                        </button>
                    )}
                    {(data.alternatives && data.alternatives.length > 0) && (
                        <button
                            onClick={toggleAlternatives}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                fontSize: '0.85rem',
                                color: 'var(--color-fg-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span>Other Options</span>
                            <span>{isAlternativesOpen ? '▲' : '▼'}</span>
                        </button>
                    )}
                </div>
            )}

            {isBoundaryOpen && data.boundary_1l && (
                <div style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    {data.boundary_1l}
                </div>
            )}
            {isAlternativesOpen && data.alternatives && (
                <div style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.alternatives.map((alt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--color-fg-muted)', color: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>{alt.label}</span>
                            <span style={{ fontSize: '0.95rem' }}>{alt.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------------
// Legacy Support (Sentence / Candidate)
// ------------------------------------------------------------------
function LegacyStreamCard({ item }: { item: Extract<StreamItem, { kind: "sentence" | "candidate" }> }) {
    const { selectedSid, toggleSelection } = useStreamStore();
    const data = item.data;
    const isSelected = selectedSid === data.sid;
    const [isDiffOpen, setIsDiffOpen] = useState(false);

    const sourceClass = data.source === "BASE" ? styles.base
        : data.source === "CANDIDATE" ? styles.candidate
            : styles.compare;

    const toggleDiff = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDiffOpen(!isDiffOpen);
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
            <div className={styles.text}>{data.learn}</div>
            <div className={styles.translation}>{data.translation}</div>
            {hasDiff && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={toggleDiff}
                        // Simple inline style to reduce complexity
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}
                    >
                        {isDiffOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span style={{ marginLeft: 4 }}>Diff</span>
                    </button>
                    {isDiffOpen && item.diff && (
                        <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                            <span style={{ color: 'red', textDecoration: 'line-through' }}>{item.diff.before}</span>
                            {' -> '}
                            <span style={{ color: 'green' }}>{item.diff.after}</span>
                        </div>
                    )}
                </div>
            )}
            {'tags' in item && (
                <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {/* @ts-ignore */}
                    {item.tags?.map((t: string) => (
                        <span key={t} style={{ fontSize: '0.7em', background: '#eee', padding: '2px 4px', borderRadius: 4 }}>{t}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
