"use client";

import React from "react";
import { useStreamStore } from "./store";
import { mockVoiceCheck } from "./mock/voice";
import { Mic, Lock } from "lucide-react";

export default function MouthpieceDock() {
    const {
        selectedSid,
        streamItems,
        voiceState,
        voiceResult,
        setVoiceState,
        setVoiceResult
    } = useStreamStore();

    const selectedItem = streamItems.find(
        i => (i.kind === "sentence" || i.kind === "candidate") && i.data.sid === selectedSid
    );

    const isRecordable = selectedItem && (selectedItem.kind === "sentence" || selectedItem.kind === "candidate");

    const handleRecordToggle = async () => {
        if (!selectedItem || !isRecordable) return;
        // Typescript knows it's recordable here, but we might need to cast or just trust runtime if complex
        // Actually since we checked isRecordable, we know it has .data.learn
        const learnText = selectedItem.data.learn;

        if (voiceState === "idle" || voiceState === "success") {
            setVoiceState("recording");
            setVoiceResult(null);

            setTimeout(async () => {
                setVoiceState("uploading");
                const result = await mockVoiceCheck(learnText, new Blob([]));
                setVoiceResult(result);
                setVoiceState("success");
            }, 2000);
        }
    };

    if (!selectedSid || !selectedItem || !isRecordable) {
        return (
            <div style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: "80px",
                background: "var(--color-surface-alt)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-fg-muted)",
                gap: "var(--space-2)",
                zIndex: 20
            }}>
                <Lock size={16} />
                <span>Select a sentence to unlock voice check</span>
            </div>
        );
    }

    const itemData = selectedItem.data;
    const isRecording = voiceState === "recording";
    const isUploading = voiceState === "uploading";

    return (
        <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            padding: "var(--space-4)",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
        }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{itemData.learn}</div>
                <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>{itemData.translation}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-4)" }}>
                <button
                    onClick={handleRecordToggle}
                    disabled={isUploading}
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: "none",
                        background: isRecording ? "var(--color-destructive)" : "var(--color-fg)",
                        color: "var(--color-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {isRecording ? (
                        <div style={{ width: 24, height: 24, background: "currentColor", borderRadius: 4 }} />
                    ) : (
                        <Mic size={32} />
                    )}
                </button>
            </div>

            {voiceResult && (
                <div style={{
                    background: "var(--color-bg-alt)",
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.95rem"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                        <strong>Score: {voiceResult.score}</strong>
                        <span style={{ color: "var(--color-fg-muted)" }}>{voiceResult.advice}</span>
                    </div>
                    <div>
                        <span style={{ color: "var(--color-fg-muted)", marginRight: 8 }}>You said:</span>
                        {voiceResult.asrText}
                    </div>
                </div>
            )}

            {isUploading && (
                <div style={{ textAlign: "center", color: "var(--color-fg-muted)" }}>Processing...</div>
            )}
        </div>
    );
}
