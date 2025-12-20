"use client";

import React from "react";

type Props = {
  open: boolean;
  phrase: string;
  mode: "play" | "record";
  isRecording: boolean;
  score?: number;
  comment?: string;
  onClose: () => void;
  onPlaySample: () => void;
  onStart: () => void;
  onStop: () => void;
};

export default function PronunciationModal({
  open,
  phrase,
  mode,
  isRecording,
  score,
  comment,
  onClose,
  onPlaySample,
  onStart,
  onStop,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          borderRadius: "var(--radius-xl)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-lg)",
          padding: "var(--space-6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>
            {mode === "play" ? "Listen" : "Record your voice"}
          </div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              borderRadius: 999,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: "1.05rem", fontWeight: 800 }}>
          {phrase || "—"}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={onPlaySample}
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              borderRadius: 999,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            🔊 Play sample
          </button>

          {mode === "record" && (
            <>
              {!isRecording ? (
                <button
                  onClick={onStart}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    borderRadius: 999,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  🎙 Start
                </button>
              ) : (
                <button
                  onClick={onStop}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    borderRadius: 999,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  ⏹ Stop & score
                </button>
              )}
            </>
          )}
        </div>

        {(score !== undefined || comment) && (
          <div style={{ marginTop: 18 }}>
            {score !== undefined && (
              <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>Score: {score}</div>
            )}
            {comment && (
              <div style={{ marginTop: 8, color: "var(--color-fg-muted)", lineHeight: 1.6 }}>
                {comment}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}