"use client";

import React, { useState } from "react";

export type Suggestion = {
  id: string;
  text: string;
};

type Props = {
  onSubmit: (text: string) => void;
  suggestions: Suggestion[];
  onPlay: (s: Suggestion) => void;
  onRecord: (s: Suggestion) => void;
};

export default function PhraseSuggestionDock({
  onSubmit,
  suggestions,
  onPlay,
  onRecord,
}: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-bg)",
        padding: "var(--space-3)",
        display: "grid",
        gap: "var(--space-3)",
      }}
    >
      {/* 输入框 */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type what you want to say..."
          style={{
            flex: 1,
            height: 44,
            padding: "0 14px",
            borderRadius: 999,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            outline: "none",
          }}
        />
        <button
          onClick={submit}
          style={{
            height: 44,
            padding: "0 14px",
            borderRadius: 999,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Generate
        </button>
      </div>

      {/* 例句列表 */}
      {suggestions.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {suggestions.map((s) => (
            <div
              key={s.id}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface)",
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ lineHeight: 1.5 }}>{s.text}</div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onPlay(s)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  🔊 Play
                </button>
                <button
                  onClick={() => onRecord(s)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  🎙 Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}