"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { queueIPAFetch, getCachedIPA } from "@/lib/ipa";
import { openIPA, onIPAChange, getIPAId } from "@/lib/ipa-accordion";
import StressColoredIPA from "@/components/StressColoredIPA";

interface Props {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    /** Wrapper element type. Default: 'span' */
    as?: "span" | "div";
}

function isLikelyEnglish(text: string): boolean {
    if (!text) return false;
    const stripped = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
    if (stripped.length === 0) return false;
    const latinCount = (stripped.match(/[a-zA-Z\u00C0-\u024F]/g) || []).length;
    return latinCount / stripped.length > 0.7;
}

export default function IPAText({ text, className, style, as: Tag = "span" }: Props) {
    const { ipaMode, setIPAMode } = useSettingsStore();
    const [revealed, setRevealed] = useState(false);
    const [ipa, setIpa] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const english = isLikelyEnglish(text);

    // Stable unique ID for accordion
    const idRef = useRef(getIPAId());

    // Long-press state
    const lpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lpTriggeredRef = useRef(false);

    // Accordion: close when another IPA opens
    useEffect(() => {
        return onIPAChange((activeId) => {
            if (activeId !== idRef.current) {
                setRevealed(false);
            }
        });
    }, []);

    // Fetch IPA when revealed
    useEffect(() => {
        if (!revealed || !english || !text?.trim()) return;

        const cached = getCachedIPA(text, ipaMode);
        if (cached) {
            setIpa(cached);
            return;
        }

        setLoading(true);
        const cleanup = queueIPAFetch(text, ipaMode, (result) => {
            setIpa(result);
            setLoading(false);
        });

        return cleanup;
    }, [revealed, ipaMode, text, english]);

    // Reset IPA when mode changes while revealed
    useEffect(() => {
        if (revealed && english && text?.trim()) {
            const cached = getCachedIPA(text, ipaMode);
            if (cached) {
                setIpa(cached);
            } else {
                setIpa("");
                setLoading(true);
                const cleanup = queueIPAFetch(text, ipaMode, (result) => {
                    setIpa(result);
                    setLoading(false);
                });
                return cleanup;
            }
        }
    }, [ipaMode]);

    const handleTap = useCallback(() => {
        setRevealed(prev => {
            const next = !prev;
            if (next) openIPA(idRef.current);
            return next;
        });
    }, []);

    const handleLongPress = useCallback(() => {
        const next = ipaMode === "word" ? "connected" : "word";
        setIPAMode(next);
        if (!revealed) {
            setRevealed(true);
            openIPA(idRef.current);
        }
    }, [ipaMode, setIPAMode, revealed]);

    const startLp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        lpTriggeredRef.current = false;
        lpTimerRef.current = setTimeout(() => {
            lpTriggeredRef.current = true;
            if (navigator.vibrate) navigator.vibrate(30);
        }, 400);
    }, []);

    const endLp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (lpTimerRef.current) clearTimeout(lpTimerRef.current);
        if (lpTriggeredRef.current) {
            handleLongPress();
        } else {
            handleTap();
        }
    }, [handleLongPress, handleTap]);

    const cancelLp = useCallback(() => {
        if (lpTimerRef.current) { clearTimeout(lpTimerRef.current); lpTimerRef.current = null; }
        lpTriggeredRef.current = false;
    }, []);

    if (!english) {
        return <Tag className={className} style={style}>{text}</Tag>;
    }

    return (
        <Tag
            className={className}
            style={{
                ...style,
                ...(revealed ? {
                    display: Tag === "span" ? "inline-flex" : "flex",
                    flexDirection: "column" as const,
                    gap: "2px",
                } : {}),
            }}
        >
            <span style={{ display: "inline" }}>
                {text}
                <button
                    onMouseDown={startLp}
                    onMouseUp={endLp}
                    onMouseLeave={cancelLp}
                    onTouchStart={startLp}
                    onTouchEnd={endLp}
                    onTouchCancel={cancelLp}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: "6px",
                        padding: "1px 5px",
                        border: revealed ? "1.5px solid var(--color-accent, #7c3aed)" : "1px solid var(--color-border, #d1d5db)",
                        borderRadius: "4px",
                        background: revealed ? "var(--color-accent, #7c3aed)" : "transparent",
                        color: revealed ? "#fff" : "var(--color-fg-muted, #6b7280)",
                        fontSize: "0.65em",
                        fontWeight: 600,
                        fontFamily: "system-ui, sans-serif",
                        lineHeight: 1.4,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                    }}
                    title={revealed ? `IPA: ${ipaMode === "word" ? "単語" : "つながり"} (長押しで切替)` : "Show IPA (長押しでモード切替)"}
                >
                    {revealed ? (ipaMode === "word" ? "IPA" : "IPA~") : "IPA"}
                </button>
            </span>
            {revealed && (
                <span style={{
                    opacity: loading && !ipa ? 0.4 : 1,
                    transition: "opacity 0.2s",
                }}>
                    {loading && !ipa
                        ? <span style={{ fontSize: "0.78em", color: "var(--color-fg-muted)" }}>...</span>
                        : <StressColoredIPA ipa={ipa} fontSize="0.78em" />
                    }
                </span>
            )}
        </Tag>
    );
}
