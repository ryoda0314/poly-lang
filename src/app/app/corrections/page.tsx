"use client";

import React, { useMemo, useState } from "react";
import StreamLayout from "@/components/stream/StreamLayout";
import StreamCanvas from "@/components/stream/StreamCanvas";
import PhraseSuggestionDock, { Suggestion } from "@/components/stream/PhraseSuggestionDock";
import PronunciationModal from "@/components/pronunciation/PronunciationModal";

type PronResult = {
  phrase: string;
  score: number;
  comment: string;
};

export default function CorrectionPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"play" | "record">("play");
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<PronResult | null>(null);

  const selectedPhrase = selected?.text ?? "";

  const makeSuggestions = (text: string): Suggestion[] => {
    // ✅ 先 UI-only：用“成果导向”的方式给几条可直接说的句子
    // 以后可以替换成你队友的 AI 生成逻辑
    const base = text.trim();
    return [
      { id: "s1", text: base },
      { id: "s2", text: base + "（more polite）" },
      { id: "s3", text: "In this situation, you can say: " + base },
    ];
  };

  const onSubmit = (text: string) => {
    setSuggestions(makeSuggestions(text));
    setResult(null); // 生成新例句时，清掉旧评价
  };

  const onPlay = (s: Suggestion) => {
    setSelected(s);
    setModalMode("play");
    setModalOpen(true);
  };

  const onRecord = (s: Suggestion) => {
    setSelected(s);
    setModalMode("record");
    setModalOpen(true);
  };

  const onPlaySample = () => {
    // 先 UI：后面接 TTS（Gemini/OpenAI 都行）
    alert("Play sample (UI only)");
  };

  const onStart = () => {
    setIsRecording(true);
    // UI-only：开始录音时先清掉本次结果
    setResult(null);
  };

  const onStop = () => {
    setIsRecording(false);

    // UI-only：假装打分完成（之后让队友把真实发音评分逻辑接在这里）
    const score = Math.floor(70 + Math.random() * 25);
    const comment =
      score > 90
        ? "Great clarity. Try a bit more natural rhythm next."
        : score > 80
          ? "Good! Focus on vowel length and stress."
          : "Nice start. Slow down and articulate the ending.";

    setResult({
      phrase: selectedPhrase,
      score,
      comment,
    });

    // 也可以：录完自动关弹窗（你喜欢哪种都行）
    // setModalOpen(false);
  };

  const resultCard = useMemo(() => {
    if (!result) return null;
    return (
      <div
        style={{
          pointerEvents: "auto",
          width: "min(560px, 92%)",
          padding: "var(--space-6)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
          Pronunciation feedback
        </div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: "1.05rem" }}>
          {result.phrase}
        </div>

        <div style={{ marginTop: 12, fontWeight: 900, fontSize: "1.4rem" }}>
          Score: {result.score}
        </div>
        <div style={{ marginTop: 10, lineHeight: 1.6, color: "var(--color-fg-muted)" }}>
          {result.comment}
        </div>
      </div>
    );
  }, [result]);

  return (
    <StreamLayout>
      {/* 顶部条 */}
      <div
        style={{
          padding: "var(--space-3)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--color-bg)",
        }}
      >
        <h2 style={{ fontSize: "1rem", margin: 0 }}>Speak without fear</h2>
        <div style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>beta</div>
      </div>

      {/* 中间区域：StreamCanvas + 评价居中显示 */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <StreamCanvas />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            padding: 16,
          }}
        >
          {resultCard}
        </div>
      </div>

      {/* 底部：输入 + 例句列表 + 按钮 */}
      <PhraseSuggestionDock
        onSubmit={onSubmit}
        suggestions={suggestions}
        onPlay={onPlay}
        onRecord={onRecord}
      />

      {/* 弹窗 */}
      <PronunciationModal
        open={modalOpen}
        phrase={selectedPhrase}
        mode={modalMode}
        isRecording={isRecording}
        score={result?.phrase === selectedPhrase ? result.score : undefined}
        comment={result?.phrase === selectedPhrase ? result.comment : undefined}
        onClose={() => setModalOpen(false)}
        onPlaySample={onPlaySample}
        onStart={onStart}
        onStop={onStop}
      />
    </StreamLayout>
  );
}