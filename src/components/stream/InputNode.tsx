"use client";

import React, { useState } from "react";
import { useStreamStore } from "./store";
import { correctText } from "@/actions/correct";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";

export default function InputNode() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const { addStreamItem, setStreamItems } = useStreamStore();
    const { checkCorrectionAttempts } = useAwarenessStore();
    const { nativeLanguage, activeLanguageCode } = useAppStore();

    const handleSubmit = async () => {
        if (!text.trim() || loading) return;
        setLoading(true);

        // Blackboard Mode: Clear previous items to start fresh
        setStreamItems([]);

        // Capture text before clearing input
        const submissionText = text;

        try {
            const inputSid = `input-${Date.now()}`;

            // Parallel: Correct text AND check awareness attempts
            const [result] = await Promise.all([
                correctText(submissionText, activeLanguageCode || "en", nativeLanguage),
                checkCorrectionAttempts(submissionText).catch(e => console.error("Awareness check failed", e))
            ]);

            if (!result) {
                alert("Correction failed (API Error)");
                return;
            }

            // v0.4 Strategy: Single "Correction Card" (A/B/C/D Layers)
            addStreamItem({
                kind: "correction-card",
                data: {
                    sid: `corr-${inputSid}`,
                    original: submissionText,
                    score: result.score,
                    recommended: result.recommended,
                    recommended_translation: result.recommended_translation,
                    sentences: result.sentences,
                    summary_1l: result.summary_1l,
                    points: result.points,
                    diff: result.diff,
                    boundary_1l: result.boundary_1l,
                    alternatives: result.alternatives
                }
            });

            setText("");
        } catch (e) {
            console.error(e);
            alert("Correction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            // ... rest of render unchanged ...
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            alignItems: "center",
            padding: "var(--space-8) 0"
        }}>
            <div style={{
                position: "relative",
                width: "100%"
            }}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Yesterday I go to park..."
                    style={{
                        width: "100%",
                        padding: "16px 24px",
                        borderRadius: "50px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        background: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(8px)",
                        fontFamily: "inherit",
                        fontSize: "1.1rem",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                        outline: "none",
                        textAlign: "center"
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSubmit();
                        }
                    }}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!text.trim() || loading}
                style={{
                    padding: "12px 32px",
                    backgroundColor: "transparent",
                    color: "var(--color-fg)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "all 0.3s ease",
                    opacity: (!text.trim() || loading) ? 0 : 1,
                    transform: (!text.trim() || loading) ? "translateY(10px)" : "translateY(0)"
                }}
            >
                {loading ? "Connecting..." : "Connect"}
            </button>
        </div>
    );
}
