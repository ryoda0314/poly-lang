"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Match actual app styles
const CARD_STYLE: React.CSSProperties = {
    background: "var(--color-surface, #fff)",
    border: "1px solid var(--color-border, #e5e7eb)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "16px",
    boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))"
};

const TOKEN_STYLE: React.CSSProperties = {
    padding: "2px 0",
    fontSize: "1.1rem",
    fontFamily: "var(--font-display, inherit)",
    color: "var(--color-fg, #111827)",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "all 0.15s"
};

// Mobile Finger Component
const FINGER_STYLE: React.CSSProperties = {
    width: "40px",
    height: "40px",
    position: "absolute",
    pointerEvents: "none",
    zIndex: 10,
    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.25))"
};

function Finger({ tapping = false, holding = false }: { tapping?: boolean; holding?: boolean }) {
    return (
        <motion.div
            style={FINGER_STYLE}
            animate={{
                scale: tapping ? 0.85 : holding ? 0.9 : 1,
                y: tapping ? 3 : holding ? 1 : 0
            }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
            <svg viewBox="0 0 40 40" width="40" height="40">
                {tapping && (
                    <motion.circle
                        cx="20" cy="20" r="18"
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.4)"
                        strokeWidth="2"
                        initial={{ r: 8, opacity: 1 }}
                        animate={{ r: 22, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}
                {holding && (
                    <motion.circle
                        cx="20" cy="20" r="16"
                        fill="rgba(59, 130, 246, 0.2)"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                )}
                <ellipse cx="20" cy="20" rx="10" ry="12" fill="#fcd5ce" stroke="#e5a99a" strokeWidth="1.5" />
                <ellipse cx="20" cy="14" rx="5" ry="4" fill="#fff" opacity="0.5" />
            </svg>
        </motion.div>
    );
}

// Multi-Select Toggle Button
function MultiSelectToggle({ active, size = "normal" }: { active: boolean; size?: "normal" | "small" }) {
    const isSmall = size === "small";
    return (
        <motion.div
            animate={{
                background: active ? "var(--color-accent, #3b82f6)" : "var(--color-bg-sub, #f3f4f6)",
                color: active ? "#fff" : "var(--color-fg-muted, #6b7280)"
            }}
            style={{
                padding: isSmall ? "4px 8px" : "8px 12px",
                borderRadius: "6px",
                fontSize: isSmall ? "0.65rem" : "0.75rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                border: "1px solid var(--color-border, #d1d5db)"
            }}
        >
            <span>☑</span>
            <span>複数選択</span>
        </motion.div>
    );
}

// ============================================================
// M1. Mobile Slide Select Demo
// ============================================================
export function MobileSlideSelectDemo({ onComplete }: { onComplete?: () => void }) {
    const words = ["I", "want", "to", "eat", "sushi"];
    const [step, setStep] = useState(0);
    const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
    const [fingerPos, setFingerPos] = useState({ x: 80, y: 80 });
    const [tapping, setTapping] = useState(false);
    const [multiSelectActive, setMultiSelectActive] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setFingerPos({ x: 80, y: 80 }); },
            () => { setTapping(true); setMultiSelectActive(true); },
            () => { setTapping(false); },
            () => { setFingerPos({ x: -60, y: 20 }); },
            () => { setTapping(true); setSelectedRange([1, 1]); },
            () => { setFingerPos({ x: -20, y: 20 }); setSelectedRange([1, 2]); },
            () => { setFingerPos({ x: 20, y: 20 }); setSelectedRange([1, 3]); },
            () => { setTapping(false); },
            () => { /* Hold */ },
            () => {
                if (onComplete) { onComplete(); return; }
                setMultiSelectActive(false);
                setSelectedRange(null);
                setFingerPos({ x: 80, y: 80 });
                setStep(-1);
            }
        ];

        const timer = setTimeout(() => {
            if (step === 8 && onComplete) { sequence[step](); onComplete(); return; }
            if (step < sequence.length) { sequence[step](); setStep(s => s + 1); }
        }, step === 0 ? 600 : step === 8 ? 1500 : 400);

        return () => clearTimeout(timer);
    }, [step, onComplete]);

    return (
        <div style={{ ...CARD_STYLE, position: "relative", padding: "16px", minHeight: "140px" }}>
            <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                <MultiSelectToggle active={multiSelectActive} size="small" />
            </div>
            <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px" }}>
                {words.map((word, i) => {
                    const isSelected = selectedRange && i >= selectedRange[0] && i <= selectedRange[1];
                    const isStart = selectedRange && i === selectedRange[0];
                    const isEnd = selectedRange && i === selectedRange[1];
                    return (
                        <motion.span
                            key={i}
                            style={{
                                ...TOKEN_STYLE, padding: "4px 8px", background: "transparent",
                                borderStyle: "solid", borderColor: isSelected ? "#ea580c" : "transparent",
                                borderTopWidth: "2px", borderBottomWidth: "2px",
                                borderLeftWidth: isSelected && isStart ? "2px" : isSelected ? "0" : "2px",
                                borderRightWidth: isSelected && isEnd ? "2px" : isSelected ? "0" : "2px",
                                borderRadius: isSelected ? `${isStart ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isStart ? "6px" : "0"}` : "6px",
                                margin: isSelected ? "0 -1px" : "0", zIndex: isSelected ? 1 : 0
                            }}
                            animate={{ scale: isSelected ? 1.05 : 1 }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </div>
            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", fontWeight: 500 }}>
                スライドで範囲選択
            </div>
            <motion.div
                animate={{ x: fingerPos.x, y: fingerPos.y }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{ position: "absolute", left: "50%", top: "40%", marginLeft: "-20px", pointerEvents: "none", zIndex: 100 }}
            >
                <Finger tapping={tapping} />
            </motion.div>
        </div>
    );
}

// ============================================================
// M2. Mobile Drag Drop Demo
// ============================================================
export function MobileDragDropDemo({ onComplete }: { onComplete?: () => void }) {
    const [phase, setPhase] = useState<'idle' | 'approach' | 'hold' | 'dragging' | 'drop' | 'dropped'>('idle');

    useEffect(() => {
        const sequence = [
            { phase: 'idle' as const, delay: 500 },
            { phase: 'approach' as const, delay: 600 },
            { phase: 'hold' as const, delay: 800 },
            { phase: 'dragging' as const, delay: 800 },
            { phase: 'drop' as const, delay: 200 },
            { phase: 'dropped' as const, delay: 2000 },
        ];
        let stepIndex = 0;
        let timer: NodeJS.Timeout;
        const runStep = () => {
            const currentStep = sequence[stepIndex];
            setPhase(currentStep.phase);
            if (currentStep.phase === 'dropped' && onComplete) { onComplete(); return; }
            timer = setTimeout(() => {
                stepIndex++;
                if (stepIndex >= sequence.length) { if (onComplete) { onComplete(); return; } stepIndex = 0; }
                runStep();
            }, sequence[stepIndex].delay);
        };
        runStep();
        return () => clearTimeout(timer);
    }, [onComplete]);

    const isHolding = phase === 'hold';
    const isDragging = phase === 'dragging' || phase === 'drop';
    const isDropped = phase === 'dropped';
    const showGhost = isDragging;
    let fingerX = 0, fingerY = 40;
    if (phase === 'idle') { fingerX = 60; fingerY = 70; }
    if (phase === 'approach') { fingerX = 0; fingerY = 40; }
    if (phase === 'hold') { fingerX = 0; fingerY = 40; }
    if (phase === 'dragging') { fingerX = 0; fingerY = -70; }
    if (phase === 'drop') { fingerX = 0; fingerY = -70; }

    return (
        <div style={{ ...CARD_STYLE, position: "relative", minHeight: "280px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "24px" }}>
            <div style={{ minHeight: "100px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                {isDropped ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "12px 20px", background: "var(--color-bg-sub, #f9fafb)", border: "2px solid var(--color-accent, #3b82f6)", borderRadius: "8px", fontWeight: 600 }}>
                        ✓ eat 登録完了
                    </motion.div>
                ) : (
                    <motion.div animate={{ borderColor: isDragging ? "var(--color-accent, #3b82f6)" : "var(--color-border, #d1d5db)", background: isDragging ? "rgba(59,130,246,0.1)" : "transparent", scale: isDragging ? 1.02 : 1 }} style={{ padding: "12px 24px", borderRadius: "8px", border: "2px dashed var(--color-border, #d1d5db)", fontSize: "0.85rem", color: "var(--color-fg-muted, #6b7280)" }}>
                        Drop words here
                    </motion.div>
                )}
            </div>
            <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: "6px", alignItems: "center", position: "relative" }}>
                <span style={TOKEN_STYLE}>I want to</span>
                <span style={{ ...TOKEN_STYLE, padding: "4px 8px", background: "var(--color-bg-sub, #f3f4f6)", borderRadius: "6px", opacity: showGhost ? 0.4 : 1 }}>eat</span>
                <span style={TOKEN_STYLE}>sushi</span>
            </div>
            {showGhost && (
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: fingerY + 30 }} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "50%", padding: "4px 8px", background: "#fff", border: "2px solid var(--color-accent, #3b82f6)", borderRadius: "6px", fontSize: "1.1rem", boxShadow: "0 8px 20px rgba(0,0,0,0.15)", pointerEvents: "none", zIndex: 50 }}>
                    eat
                </motion.div>
            )}
            {!isDropped && (
                <motion.div animate={{ x: fingerX, y: fingerY }} transition={{ type: "spring", stiffness: 120, damping: 18 }} style={{ position: "absolute", left: "50%", top: "50%", marginLeft: "-20px", pointerEvents: "none", zIndex: 100 }}>
                    <Finger holding={isHolding} tapping={phase === 'drop'} />
                </motion.div>
            )}
            <div style={{ position: "absolute", bottom: "12px", left: 0, right: 0, textAlign: "center", fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)" }}>
                長押しでドラッグ
            </div>
        </div>
    );
}

// ============================================================
// M3. Mobile Tap Explore Demo
// ============================================================
export function MobileTapExploreDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);
    const [fingerPos, setFingerPos] = useState({ x: 60, y: 20 });
    const [tapping, setTapping] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setFingerPos({ x: 0, y: 10 }); },
            () => { setTapping(true); },
            () => { setTapping(false); setPanelOpen(true); },
            () => { /* Hold */ },
            () => { if (onComplete) { onComplete(); return; } setPanelOpen(false); setFingerPos({ x: 60, y: 20 }); setStep(-1); }
        ];
        const timer = setTimeout(() => {
            if (step === 3 && onComplete) { sequence[step](); onComplete(); return; }
            if (step < sequence.length) { sequence[step](); setStep(s => s + 1); }
        }, step === 0 ? 600 : step === 3 ? 2000 : 400);
        return () => clearTimeout(timer);
    }, [step, onComplete]);

    return (
        <div style={{ ...CARD_STYLE, position: "relative", minHeight: "200px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", padding: "16px" }}>
                <span style={TOKEN_STYLE}>I often</span>
                <motion.span animate={{ background: panelOpen ? "rgba(59, 130, 246, 0.15)" : "transparent", color: panelOpen ? "var(--color-accent, #3b82f6)" : TOKEN_STYLE.color }} style={{ ...TOKEN_STYLE, padding: "2px 6px", borderRadius: "4px" }}>
                    eat
                </motion.span>
                <span style={TOKEN_STYLE}>fresh sushi</span>
            </div>
            <AnimatePresence>
                {panelOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ background: "var(--color-bg-sub, #f9fafb)", borderRadius: "8px", padding: "12px", margin: "0 12px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "8px", color: "var(--color-accent, #3b82f6)" }}>eat</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted, #6b7280)" }}>I <b>eat</b> rice → 私はご飯を食べます</div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", marginTop: "auto", paddingBottom: "8px" }}>
                タップで辞書を表示
            </div>
            <motion.div animate={{ x: fingerPos.x, y: fingerPos.y }} transition={{ type: "spring", stiffness: 150, damping: 20 }} style={{ position: "absolute", left: "50%", top: "30%", marginLeft: "-20px", pointerEvents: "none", zIndex: 100 }}>
                <Finger tapping={tapping} />
            </motion.div>
        </div>
    );
}
