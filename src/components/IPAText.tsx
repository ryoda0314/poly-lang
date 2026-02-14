"use client";

import React, { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { queueIPAFetch, getCachedIPA } from "@/lib/ipa";

interface Props {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    /** Wrapper element type. Default: 'span' */
    as?: "span" | "div";
}

/**
 * Wraps English text and optionally shows IPA pronunciation below it.
 * Reads showIPA / ipaMode from global settings store.
 * Uses batched LLM-based IPA generation with multi-tier caching.
 */
export default function IPAText({ text, className, style, as: Tag = "span" }: Props) {
    const { showIPA, ipaMode } = useSettingsStore();
    const [ipa, setIpa] = useState<string>(() => {
        if (!showIPA || !text?.trim()) return "";
        return getCachedIPA(text, ipaMode) || "";
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!showIPA || !text?.trim()) {
            setIpa("");
            return;
        }

        // Check if already cached
        const cached = getCachedIPA(text, ipaMode);
        if (cached) {
            setIpa(cached);
            return;
        }

        // Fetch via batched queue
        setLoading(true);
        const cleanup = queueIPAFetch(text, ipaMode, (result) => {
            setIpa(result);
            setLoading(false);
        });

        return cleanup;
    }, [showIPA, ipaMode, text]);

    // When IPA is off, render text normally
    if (!showIPA) {
        return <Tag className={className} style={style}>{text}</Tag>;
    }

    return (
        <Tag
            className={className}
            style={{
                ...style,
                display: Tag === "span" ? "inline-flex" : "flex",
                flexDirection: "column",
                gap: "2px",
            }}
        >
            <span>{text}</span>
            {(ipa || loading) && (
                <span
                    style={{
                        fontSize: "0.78em",
                        color: "var(--color-accent, #7c3aed)",
                        fontFamily: "'Noto Sans', 'Lucida Sans Unicode', 'Segoe UI', sans-serif",
                        fontWeight: 400,
                        lineHeight: 1.2,
                        letterSpacing: "0.01em",
                        opacity: loading ? 0.4 : 0.85,
                        transition: "opacity 0.2s",
                    }}
                >
                    {loading ? "..." : ipa}
                </span>
            )}
        </Tag>
    );
}
