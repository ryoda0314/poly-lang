"use client";

import React, { useState } from "react";
import { useStreamStore } from "./store";
import { correctText } from "@/actions/correct";
import { useAwarenessStore } from "@/store/awareness-store";

export default function InputNode() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const { addStreamItem } = useStreamStore();
    const { checkCorrectionAttempts } = useAwarenessStore();

    const handleSubmit = async () => {
        if (!text.trim() || loading) return;
        setLoading(true);
        // Capture text before clearing
        const submissionText = text;

        try {
            const inputSid = `input-${Date.now()}`;

            // Parallel: Correct text AND check awareness attempts
            const [result] = await Promise.all([
                correctText(submissionText, "en"),
                checkCorrectionAttempts(submissionText).catch(e => console.error("Awareness check failed", e))
            ]);

            if (!result) {
                alert("Correction failed (API Error)");
                return;
            }
            // ... rest of logic unchanged ...
            // Summary
            addStreamItem({
                kind: "summary",
                data: {
                    score: result.score,
                    text: result.summary,
                    fromSid: inputSid
                }
            });

            // Candidates
            result.candidates.forEach((c) => {
                addStreamItem({
                    kind: "candidate",
                    data: c.ref,
                    fromSid: inputSid,
                    diff: c.diff,
                    // @ts-ignore
                    tags: c.tags,
                    hint: c.hint
                });
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
