import React, { useState, useEffect } from "react";
import { StreamItem, CorrectionCardData } from "@/types/stream";
import styles from "./StreamCard.module.css";
import { useStreamStore } from "./store";
import { useHistoryStore } from "@/store/history-store";
import { Volume2, Bookmark, ChevronDown, ChevronUp, Copy, Check, MoveRight, Star, ArrowDown, BookOpen } from "lucide-react";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";

import { translations } from "@/lib/translations";
import { explainPhraseElements, ExplanationResult } from "@/actions/explain";
import { computeDiff } from "@/lib/diff";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";

const useCopyToClipboard = () => {
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setTimeout(() => setCopiedText(null), 2000);
            return true;
        } catch (e) {
            console.error("Failed to copy:", e);
            return false;
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
    const [isAlternativesOpen, setIsAlternativesOpen] = useState(true);
    const { verifyAttemptedMemosInText } = useAwarenessStore();
    const { savePhrase, logEvent } = useHistoryStore();
    const { user, profile, activeLanguageCode, nativeLanguage, refreshProfile } = useAppStore();
    const { copiedText, copy } = useCopyToClipboard();

    // Explanation State
    const [explanation, setExplanation] = useState<{ targetText: string, result: ExplanationResult } | null>(null);
    const [isExplanationOpen, setIsExplanationOpen] = useState(true);
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanationError, setExplanationError] = useState<string | null>(null);

    // Auto-verify memos when correction result is displayed
    useEffect(() => {
        if (data.recommended) {
            verifyAttemptedMemosInText(data.recommended);
        }
        // Also check all sentences
        data.sentences?.forEach(sent => {
            if (sent.text) {
                verifyAttemptedMemosInText(sent.text);
            }
        });
    }, [data.recommended, data.sentences, verifyAttemptedMemosInText]);

    const t: any = translations[nativeLanguage] || translations.ja;

    const handleExplain = async (targetText: string) => {
        if (isExplaining) return;

        // 1. Check if we already have this explanation loaded (reuse cache)
        if (explanation?.targetText === targetText) {
            // Toggle visibility without credit check or API call
            setIsExplanationOpen(!isExplanationOpen);
            return;
        }

        // 2. Client-side credit check for NEW explanations
        const credits = profile?.explanation_credits ?? 0;
        if (credits <= 0) {
            setExplanationError("解説クレジットが不足しています (Insufficient Credits)");
            return;
        }

        setIsExplaining(true);
        setExplanationError(null);

        try {
            logEvent(TRACKING_EVENTS.EXPLANATION_REQUEST, 0, { phrase_id: item.data.sid, text_length: targetText.length });

            // Check if we have cached explanation? (Not implemented locally in component for simplification)
            const result = await explainPhraseElements(targetText, activeLanguageCode || "en", nativeLanguage);
            if (!result) throw new Error("Failed to explain");
            if (result.error) {
                throw new Error(result.error);
            }

            setExplanation({
                targetText,
                result
            });
            setIsExplanationOpen(true);

            // Refresh profile to update credits count
            refreshProfile().catch(console.error);

        } catch (e: any) {
            console.error(e);
            setExplanationError(e.message || "Explanation failed. Please try again.");
        } finally {
            setIsExplaining(false);
        }
    };

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

        // Client-side credit check
        const credits = profile?.audio_credits ?? 0;
        if (credits <= 0) {
            alert("音声クレジットが不足しています (Insufficient Audio Credits)");
            return;
        }

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
                            {/* Sentence Text - Full Width */}
                            <div style={{
                                fontSize: '1.4rem',
                                fontWeight: 600,
                                color: 'var(--color-fg)',
                                lineHeight: 1.3
                            }}>
                                {sent.text}
                            </div>

                            {/* Action Buttons - Wrap on mobile */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                                scrollbarWidth: 'none', // Firefox
                                msOverflowStyle: 'none', // IE/Edge
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: '4px' // Space for scrollbar if visible
                            }}>
                                <style jsx>{`
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const success = await copy(sent.text);
                                        if (success) {
                                            logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { text_length: sent.text.length, source: 'stream_card' });
                                        }
                                    }}
                                    className={styles.iconBtn}
                                    title={t.copy}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--color-bg-sub)',
                                        color: copiedText === sent.text ? 'var(--color-success, #22c55e)' : 'var(--color-fg)',
                                        flexShrink: 0
                                    }}
                                >
                                    {copiedText === sent.text ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        // Client-side credit check for Correction Audio
                                        const credits = profile?.audio_credits ?? 0;
                                        if (credits <= 0) {
                                            alert("音声クレジットが不足しています (Insufficient Audio Credits)");
                                            return;
                                        }

                                        verifyAttemptedMemosInText(sent.text);
                                        if ('speechSynthesis' in window) {
                                            const u = new SpeechSynthesisUtterance(sent.text);
                                            u.lang = 'en';
                                            window.speechSynthesis.speak(u);
                                            logEvent(TRACKING_EVENTS.AUDIO_PLAY, 0, { text_length: sent.text.length, source: 'stream_card' });
                                        }
                                    }}
                                    className={styles.iconBtn}
                                    title={t.play}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--color-bg-sub)',
                                        color: 'var(--color-fg)',
                                        flexShrink: 0
                                    }}
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
                                    title={t.save}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--color-bg-sub)',
                                        color: 'var(--color-fg)',
                                        flexShrink: 0
                                    }}
                                >
                                    <Bookmark size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExplain(sent.text);
                                    }}
                                    className={styles.iconBtn}
                                    title={t.explain}
                                    disabled={isExplaining}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--color-bg-sub)',
                                        color: explanation?.targetText === sent.text ? 'var(--color-primary)' : 'var(--color-fg)',
                                        border: explanation?.targetText === sent.text ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        flexShrink: 0
                                    }}
                                >
                                    {isExplaining && explanation?.targetText !== sent.text && isExplaining ? (
                                        <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                    ) : (
                                        <BookOpen size={18} color={explanation?.targetText === sent.text ? "var(--color-primary)" : "currentColor"} />
                                    )}
                                </button>
                            </div>

                            {sent.translation && (
                                <div style={{ fontSize: '0.95rem', color: 'var(--color-fg-muted)' }}>
                                    {sent.translation}
                                </div>
                            )}

                            {/* Explanation UI - Collapsible */}
                            {explanation && explanation.targetText === sent.text && (
                                <div style={{
                                    marginTop: '12px',
                                    background: 'var(--color-bg-sub)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Collapsible Header */}
                                    <button
                                        onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                            📖 {t.explain || 'Explanation'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {isExplanationOpen ? <ChevronUp size={14} color="var(--color-fg-muted)" /> : <ChevronDown size={14} color="var(--color-fg-muted)" />}
                                        </div>
                                    </button>

                                    {/* Collapsible Content */}
                                    {isExplanationOpen && (
                                        <div style={{ padding: '0 12px 12px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {explanation.result.items.map((item, idx) => (
                                                    <div key={idx} style={{
                                                        background: 'var(--color-surface)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--color-border)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1px'
                                                    }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg)' }}>{item.token}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-fg-muted)' }}>{item.meaning}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>{item.grammar}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {explanation.result.nuance && (
                                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-fg)', lineHeight: 1.4, borderTop: '1px solid var(--color-border-sub)', paddingTop: '6px' }}>
                                                    <span style={{ fontWeight: 600 }}>💡 </span>
                                                    {explanation.result.nuance}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {explanationError && (explanation?.targetText === sent.text || !explanation) && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-destructive)', marginTop: '4px', padding: '0 4px', fontWeight: 600 }}>
                                    Warning: {explanationError}
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
                        marginBottom: '12px'
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

                {/* Nuance / Boundary Note - Parallel to points */}
                {data.boundary_1l && (
                    <div style={{
                        background: 'var(--color-bg-sub)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--color-fg-muted)',
                            textTransform: 'uppercase',
                            marginBottom: '8px'
                        }}>
                            {t.nuance}
                        </div>
                        {(() => {
                            const lines = data.boundary_1l.split('\n').filter(l => l.trim());
                            if (lines.length > 1) {
                                return (
                                    <ul style={{
                                        margin: 0,
                                        paddingLeft: '20px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-fg)',
                                        lineHeight: 1.6
                                    }}>
                                        {lines.map((line, i) => (
                                            <li key={i} style={{ fontStyle: 'italic' }}>{line}</li>
                                        ))}
                                    </ul>
                                );
                            }
                            return (
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontStyle: 'italic',
                                    color: 'var(--color-fg)',
                                    lineHeight: 1.5
                                }}>
                                    {data.boundary_1l}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Diff */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.9rem'
                }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-fg-muted)' }}>{t.diff}:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: "100%" }}>
                        {(() => {
                            const beforeText = data.diff.before || "";
                            const afterText = data.diff.after || "";

                            // Simple sentence splitting ensuring we capture the delimiter
                            // This regex matches a sequence of non-terminators followed by optional terminators
                            const splitRegex = /[^.!?。！？\n]+[.!?。！？\n]*/g;
                            const beforeSentences = beforeText.match(splitRegex)?.map(s => s.trim()) || [beforeText];
                            const afterSentences = afterText.match(splitRegex)?.map(s => s.trim()) || [afterText];

                            // Determine if we can pair them sentence-by-sentence
                            // We pair if counts match and we have multiples. 
                            // Even if count is 1, we still want the frame style, so we can just use the mapped loop universally.
                            // But if counts MISMATCH (e.g. 2 sentences became 1), we fallback to full block to avoid misalignment.
                            const useSplitView = beforeSentences.length > 1 && beforeSentences.length === afterSentences.length;

                            const pairs = useSplitView
                                ? beforeSentences.map((b, i) => ({ before: b, after: afterSentences[i] }))
                                : [{ before: beforeText, after: afterText }];

                            return pairs.map((pair, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {/* Original with Deletions */}
                                    <div style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-fg)',
                                        lineHeight: 1.5
                                    }}>
                                        {(() => {
                                            const diffs = computeDiff(pair.before, pair.after);
                                            return (
                                                <span>
                                                    {diffs.map((part, i) => {
                                                        if (part.type === 'equal') {
                                                            return <span key={i} style={{ opacity: 0.7 }}>{part.value}</span>;
                                                        }
                                                        if (part.type === 'delete') {
                                                            if (!part.value.trim()) return null;
                                                            return (
                                                                <span key={i} style={{
                                                                    textDecoration: 'line-through',
                                                                    color: 'var(--color-destructive)',
                                                                    background: 'rgba(255, 0, 0, 0.1)',
                                                                    padding: '0 2px',
                                                                    borderRadius: '2px'
                                                                }}>
                                                                    {part.value}
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {/* Arrow */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', opacity: 0.5 }}>
                                        <ArrowDown size={14} />
                                    </div>

                                    {/* New with Insertions */}
                                    <div style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '0.95rem',
                                        color: 'var(--color-fg)',
                                        fontWeight: 500,
                                        lineHeight: 1.5
                                    }}>
                                        {(() => {
                                            const diffs = computeDiff(pair.before, pair.after);
                                            return (
                                                <span>
                                                    {diffs.map((part, i) => {
                                                        if (part.type === 'equal') {
                                                            return <span key={i}>{part.value}</span>;
                                                        }
                                                        if (part.type === 'insert') {
                                                            return (
                                                                <span key={i} style={{
                                                                    color: 'var(--color-success)',
                                                                    background: 'rgba(0, 255, 0, 0.1)',
                                                                    padding: '0 2px',
                                                                    borderRadius: '2px'
                                                                }}>
                                                                    {part.value}
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

            </div>

            {/* Alternatives - Redesigned */}
            {data.alternatives && data.alternatives.length > 0 && (
                <div style={{
                    background: 'var(--color-bg-sub)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '8px'
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--color-fg-muted)',
                        textTransform: 'uppercase',
                        marginBottom: '12px'
                    }}>
                        {t.otherOptions}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {data.alternatives.map((alt, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '10px 12px',
                                background: 'var(--color-surface)',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)'
                            }}>
                                {/* Header: Label + Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        background: i === 0 ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                                        color: '#fff',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {alt.label}
                                    </span>

                                    {/* Actions moved to header */}
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const success = await copy(alt.text);
                                                if (success) {
                                                    logEvent(TRACKING_EVENTS.TEXT_COPY, 0, { text_length: alt.text.length, source: 'stream_card_alternative' });
                                                }
                                            }}
                                            className={styles.iconBtn}
                                            title={copiedText === alt.text ? "Copied!" : "Copy"}
                                            style={{
                                                padding: '4px',
                                                color: copiedText === alt.text ? 'var(--color-success, #22c55e)' : 'var(--color-fg-muted)'
                                            }}
                                        >
                                            {copiedText === alt.text ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if ('speechSynthesis' in window) {
                                                    const u = new SpeechSynthesisUtterance(alt.text);
                                                    u.lang = 'en';
                                                    window.speechSynthesis.speak(u);
                                                    logEvent(TRACKING_EVENTS.AUDIO_PLAY, 0, { text_length: alt.text.length, source: 'stream_card_alternative' });
                                                }
                                            }}
                                            className={styles.iconBtn}
                                            title="Play TTS"
                                            style={{ padding: '4px', color: 'var(--color-fg-muted)' }}
                                        >
                                            <Volume2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content (Full Width) */}
                                <div>
                                    <div style={{
                                        fontSize: '0.95rem',
                                        color: 'var(--color-fg)',
                                        fontWeight: 500,
                                        lineHeight: 1.4
                                    }}>
                                        {alt.text}
                                    </div>
                                    {alt.translation && (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--color-fg-muted)',
                                            marginTop: '4px'
                                        }}>
                                            {alt.translation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
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
