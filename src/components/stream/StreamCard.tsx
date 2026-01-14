import React, { useState } from "react";
import { StreamItem, CorrectionCardData } from "@/types/stream";
import styles from "./StreamCard.module.css";
import { useStreamStore } from "./store";
import { useHistoryStore } from "@/store/history-store";
import { Volume2, Bookmark, ChevronDown, ChevronUp, Copy, Check, MoveRight, Star, ArrowDown } from "lucide-react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";

import { translations } from "@/lib/translations";

const useCopyToClipboard = () => {
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setTimeout(() => setCopiedText(null), 2000);
        } catch (e) {
            console.error("Failed to copy:", e);
        }
    };

    return { copiedText, copy };
};

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
// v0.7 Correction Card (Assessment -> Sentence Blocks)
// ------------------------------------------------------------------
function CorrectionCard({ item }: { item: Extract<StreamItem, { kind: "correction-card" }> }) {
    const data = item.data;
    const [isDiffOpen, setIsDiffOpen] = useState(true);
    const [isBoundaryOpen, setIsBoundaryOpen] = useState(false);
    const [isAlternativesOpen, setIsAlternativesOpen] = useState(false);
    const { verifyAttemptedMemosInText } = useAwarenessStore();
    const { savePhrase } = useHistoryStore();
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { copiedText, copy } = useCopyToClipboard();

    const t = translations[nativeLanguage] || translations.ja;

    const handleSavePhrase = async (text: string, translation?: string) => {
        if (!user || !activeLanguageCode) return;
        try {
            await savePhrase(user.id, activeLanguageCode, text, translation || "");
            alert(`Saved "${text}" to History!`); // Could be localized too or toast
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save.");
        }
    };

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

    // Fallback if sentences are missing (legacy data)
    const displaySentences = (data.sentences && data.sentences.length > 0)
        ? data.sentences
        : [{ text: data.recommended, translation: data.recommended_translation }];

    return (
        <div className={styles.card} style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
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
                    {t.yourAttempt}
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
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)' }}>{t.naturalnessScore}</div>
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
               SECTION 2: SOLUTION (Recommendation Blocks)
               ------------------------------------------------------------- */}
            <div style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-primary)', // Accent border for solution
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                        {t.betterPhrasing}
                    </div>
                </div>

                {/* Render Sentences Loop */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {displaySentences.map((sent, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            marginBottom: (i < displaySentences.length - 1) ? '16px' : '0',
                            paddingBottom: (i < displaySentences.length - 1) ? '16px' : '0',
                            borderBottom: (i < displaySentences.length - 1) ? '1px dashed var(--color-border-sub)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 600,
                                    color: 'var(--color-fg)',
                                    lineHeight: 1.3,
                                    flex: 1
                                }}>
                                    {sent.text}
                                </div>
                                {/* Sentence Actions */}
                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copy(sent.text);
                                        }}
                                        className={styles.iconBtn}
                                        title={copiedText === sent.text ? "Copied!" : "Copy"}
                                        style={{ color: copiedText === sent.text ? 'var(--color-success, #22c55e)' : undefined }}
                                    >
                                        {copiedText === sent.text ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            verifyAttemptedMemosInText(sent.text);
                                            if ('speechSynthesis' in window) {
                                                const u = new SpeechSynthesisUtterance(sent.text);
                                                u.lang = 'en';
                                                window.speechSynthesis.speak(u);
                                            }
                                        }}
                                        className={styles.iconBtn}
                                        title="Play Sentence"
                                    >
                                        <Volume2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            verifyAttemptedMemosInText(sent.text);
                                            handleSavePhrase(sent.text, sent.translation);
                                        }}
                                        className={styles.iconBtn}
                                        title="Save Sentence"
                                    >
                                        <Bookmark size={18} />
                                    </button>
                                </div>
                            </div>

                            {sent.translation && (
                                <div style={{ fontSize: '0.95rem', color: 'var(--color-fg-muted)' }}>
                                    {sent.translation}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Why? (Reasoning/Points) */}
                {data.points && data.points.length > 0 && (
                    <div style={{
                        background: 'var(--color-bg-sub)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {t.whyBetter}
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

                {/* Diff */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-fg-muted)', marginRight: '4px' }}>{t.diff}:</span>
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
               SECTION 3: EXTRAS (Nuance & Alternatives)
               ------------------------------------------------------------- */}

            {/* Nuance / Boundary Note */}
            {data.boundary_1l && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={toggleBoundary}
                        style={{
                            width: '100%',
                            padding: '12px 4px', // Reduced side padding, keeping touch target
                            borderRadius: '8px',
                            border: 'none', // No border by default
                            background: isBoundaryOpen ? 'var(--color-bg-sub)' : 'transparent', // Transparent when closed
                            fontSize: '0.9rem',
                            color: isBoundaryOpen ? 'var(--color-primary)' : 'var(--color-fg-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            // Add a subtle border bottom if not last? or just keep it clean.
                        }}
                    >
                        <span style={{ fontWeight: isBoundaryOpen ? 700 : 600 }}>{t.nuance}</span>
                        <span>{isBoundaryOpen ? '▲' : '▼'}</span>
                    </button>

                    {isBoundaryOpen && (
                        <div style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {data.boundary_1l}
                        </div>
                    )}
                </div>
            )}

            {/* Alternatives */}
            {data.alternatives && data.alternatives.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={toggleAlternatives}
                        style={{
                            width: '100%',
                            padding: '12px 4px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isAlternativesOpen ? 'var(--color-bg-sub)' : 'transparent',
                            fontSize: '0.9rem',
                            color: isAlternativesOpen ? 'var(--color-primary)' : 'var(--color-fg-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontWeight: isAlternativesOpen ? 700 : 600 }}>{t.otherOptions}</span>
                        <span>{isAlternativesOpen ? '▲' : '▼'}</span>
                    </button>

                    {isAlternativesOpen && (
                        <div style={{
                            marginTop: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {data.alternatives.map((alt, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '16px',
                                    background: 'var(--color-surface)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            background: 'var(--color-fg)',
                                            color: 'var(--color-bg)',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {alt.label}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copy(alt.text);
                                                }}
                                                className={styles.iconBtn}
                                                title={copiedText === alt.text ? "Copied!" : "Copy"}
                                                style={{ padding: '6px', color: copiedText === alt.text ? 'var(--color-success, #22c55e)' : undefined }}
                                            >
                                                {copiedText === alt.text ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    verifyAttemptedMemosInText(alt.text);
                                                    if ('speechSynthesis' in window) {
                                                        const u = new SpeechSynthesisUtterance(alt.text);
                                                        u.lang = 'en';
                                                        window.speechSynthesis.speak(u);
                                                    }
                                                }}
                                                className={styles.iconBtn}
                                                title="Play TTS"
                                                style={{ padding: '6px' }}
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    verifyAttemptedMemosInText(alt.text);
                                                    handleSavePhrase(alt.text, "Alternative phrasing");
                                                }}
                                                className={styles.iconBtn}
                                                title="Save"
                                                style={{ padding: '6px' }}
                                            >
                                                <Bookmark size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        color: 'var(--color-fg)',
                                        fontWeight: 500,
                                        marginTop: '4px',
                                        lineHeight: 1.4
                                    }}>
                                        {alt.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
