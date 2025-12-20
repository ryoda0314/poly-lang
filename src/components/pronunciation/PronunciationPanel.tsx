"use client";

import React from "react";

type Props = {
  title?: string;
  targetText?: string;
  hint?: string;

  // UI state
  isRecording?: boolean;
  score?: number; // 0-100

  // handlers (先留空也没关系)
  onPlaySample?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
};

export default function PronunciationPanel({
  title = "Voice Check",
  targetText = "Select a sentence to unlock voice check",
  hint = "Try saying it naturally. We’ll check clarity and rhythm.",
  isRecording = false,
  score,
  onPlaySample,
  onStartRecording,
  onStopRecording,
}: Props) {
  return (
    <div
      style={{
        height: "100%",
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-bg)",
        padding: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 12, opacity: 0.6 }}>beta</span>
      </div>

      <div style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6 }}>
        {targetText}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>
        {hint}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onPlaySample} type="button">
          ▶︎ Play sample
        </button>

        {!isRecording ? (
          <button onClick={onStartRecording} type="button">
            🎙 Start
          </button>
        ) : (
          <button onClick={onStopRecording} type="button">
            ⏹ Stop
          </button>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Result</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>
          {typeof score === "number" ? `${score}/100` : "—"}
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.65 }}>
        (UI only for now — we’ll wire scoring later.)
      </div>
    </div>
  );
}