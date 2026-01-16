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

// Mobile Touch Indicator - Subtle design
const TOUCH_STYLE: React.CSSProperties = {
    width: "36px",
    height: "36px",
    position: "absolute",
    pointerEvents: "none",
    zIndex: 10
};

function Finger({ tapping = false, holding = false }: { tapping?: boolean; holding?: boolean }) {
    return (
        <motion.div
            style={TOUCH_STYLE}
            animate={{
                scale: tapping ? 0.85 : holding ? 0.95 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <svg viewBox="0 0 36 36" width="36" height="36">
                {/* Subtle ripple on tap */}
                {tapping && (
                    <motion.circle
                        cx="18" cy="18" r="16"
                        fill="none"
                        stroke="rgba(156, 163, 175, 0.4)"
                        strokeWidth="1"
                        initial={{ r: 10, opacity: 0.6 }}
                        animate={{ r: 18, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}

                {/* Holding indicator - subtle pulse */}
                {holding && (
                    <motion.circle
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke="rgba(156, 163, 175, 0.3)"
                        strokeWidth="1.5"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    />
                )}

                {/* Main touch circle - subtle gray */}
                <circle
                    cx="18" cy="18" r="8"
                    fill="rgba(107, 114, 128, 0.15)"
                    stroke="rgba(107, 114, 128, 0.4)"
                    strokeWidth="1.5"
                />
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
    const [fingerPos, setFingerPos] = useState({ x: 80, y: -60 });
    const [tapping, setTapping] = useState(false);
    const [multiSelectActive, setMultiSelectActive] = useState(false);

    useEffect(() => {
        const sequence = [
            // Move to toggle button area (top right)
            () => { setFingerPos({ x: 80, y: -60 }); },
            // Tap toggle
            () => { setTapping(true); setMultiSelectActive(true); },
            () => { setTapping(false); },
            // Move to first word position ("want")
            () => { setFingerPos({ x: -40, y: -10 }); },
            // Start selecting
            () => { setTapping(true); setSelectedRange([1, 1]); },
            // Slide to "to"
            () => { setFingerPos({ x: 0, y: -10 }); setSelectedRange([1, 2]); },
            // Slide to "eat"
            () => { setFingerPos({ x: 35, y: -10 }); setSelectedRange([1, 3]); },
            // Release
            () => { setTapping(false); },
            // Hold to show result
            () => { /* Hold */ },
            // Reset
            () => {
                if (onComplete) { onComplete(); return; }
                setMultiSelectActive(false);
                setSelectedRange(null);
                setFingerPos({ x: 80, y: -60 });
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
            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.7rem", color: "var(--color-fg-muted, #6b7280)" }}>
                スライドで範囲選択
            </div>
            {/* Finger - positioned relative to center of word area */}
            <motion.div
                animate={{ x: fingerPos.x, y: fingerPos.y }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{ position: "absolute", left: "50%", top: "55%", marginLeft: "-18px", marginTop: "-18px", pointerEvents: "none", zIndex: 100 }}
            >
                <Finger tapping={tapping} />
            </motion.div>
        </div>
    );
}

// ============================================================
// M2. Mobile Drag Drop Demo - Matches PC DragDropDemo layout
// ============================================================
export function MobileDragDropDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);

    const phases = ['idle', 'approach', 'hold', 'dragging', 'drop', 'dropped'] as const;
    const delays = [500, 600, 800, 800, 200, 2500];
    const phase = phases[Math.min(step, phases.length - 1)];

    useEffect(() => {
        if (step >= phases.length) return;

        const timer = setTimeout(() => {
            if (step < phases.length - 1) {
                setStep(s => s + 1);
            } else if (onComplete) {
                onComplete();
            }
        }, delays[step]);

        return () => clearTimeout(timer);
    }, [step, onComplete, phases.length, delays]);

    const isHolding = phase === 'hold';
    const isDragging = phase === 'dragging' || phase === 'drop';
    const isDropped = phase === 'dropped';
    const showGhost = isHolding || isDragging;

    // Finger position
    let fingerX = 0, fingerY = 60;
    if (phase === 'idle') { fingerX = 60; fingerY = 80; }
    if (phase === 'approach') { fingerX = 10; fingerY = 60; }
    if (phase === 'hold') { fingerX = 10; fingerY = 60; }
    if (phase === 'dragging') { fingerX = 10; fingerY = -60; }
    if (phase === 'drop') { fingerX = 10; fingerY = -60; }

    return (
        <div style={{
            ...CARD_STYLE,
            position: "relative",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            padding: "20px"
        }}>
            {/* Drop Zone / Memo Card Area */}
            <div style={{ minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                {isDropped ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{
                            width: "100%",
                            maxWidth: "280px",
                            background: "var(--color-surface, #fff)",
                            border: "1px solid var(--color-border, #e5e7eb)",
                            borderRadius: "8px",
                            padding: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            position: "relative",
                            overflow: "hidden"
                        }}
                    >
                        {/* Red left bar */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "#ef4444", borderRadius: "8px 0 0 8px" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>eat</span>
                            <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-sub, #f3f4f6)", borderRadius: "4px", padding: "2px" }}>
                                <span style={{ padding: "2px 6px", fontSize: "0.6rem", color: "var(--color-fg-muted, #6b7280)" }}>HIGH</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.6rem", color: "var(--color-fg-muted, #6b7280)" }}>MED</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.6rem", background: "#ef4444", color: "#fff", borderRadius: "2px", fontWeight: 600 }}>LOW</span>
                            </div>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted, #9ca3af)", paddingLeft: "8px" }}>Add a note...</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--color-border-subtle, #f3f4f6)", paddingLeft: "8px" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #9ca3af)" }}>2026/1/16</span>
                            <span style={{
                                background: "var(--color-fg, #1f2937)",
                                color: "#fff",
                                borderRadius: "4px",
                                padding: "6px 14px",
                                fontSize: "0.75rem",
                                fontWeight: 600
                            }}>Register</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        animate={{
                            borderColor: isDragging ? "var(--color-accent, #3b82f6)" : "var(--color-border, #d1d5db)",
                            background: isDragging ? "rgba(59,130,246,0.08)" : "transparent",
                            scale: isDragging ? 1.02 : 1
                        }}
                        style={{
                            padding: "14px 28px",
                            borderRadius: "8px",
                            border: "2px dashed var(--color-border, #d1d5db)",
                            fontSize: "0.85rem",
                            color: "var(--color-fg-muted, #6b7280)"
                        }}
                    >
                        Drop words here
                    </motion.div>
                )}
            </div>

            {/* Phrase Card */}
            <div style={{
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "12px",
                padding: "16px 24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                display: "flex",
                gap: "6px",
                alignItems: "center",
                position: "relative"
            }}>
                <span style={TOKEN_STYLE}>I want to</span>
                <span style={{
                    ...TOKEN_STYLE,
                    padding: "4px 10px",
                    background: "var(--color-bg-sub, #f3f4f6)",
                    borderRadius: "6px",
                    opacity: showGhost ? 0.4 : 1,
                    transition: "opacity 0.15s"
                }}>eat</span>
            </div>

            {/* Ghost Token */}
            {showGhost && (
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 1 }}
                    animate={{
                        opacity: 1,
                        y: fingerY + 25,
                        scale: isDragging ? 1.05 : 1,
                        rotate: isDragging ? -2 : 0
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translateX(-50%)",
                        padding: "4px 10px",
                        background: "#fff",
                        border: "2px solid var(--color-accent, #3b82f6)",
                        borderRadius: "6px",
                        fontSize: "1.05rem",
                        boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.18)" : "0 4px 12px rgba(0,0,0,0.1)",
                        pointerEvents: "none",
                        zIndex: 50
                    }}
                >
                    eat
                </motion.div>
            )}

            {/* Finger */}
            {!isDropped && (
                <motion.div
                    animate={{ x: fingerX, y: fingerY }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    style={{ position: "absolute", left: "50%", top: "50%", marginLeft: "-20px", pointerEvents: "none", zIndex: 100 }}
                >
                    <Finger holding={isHolding} tapping={phase === 'drop'} />
                </motion.div>
            )}

            {/* Caption */}
            <div style={{
                position: "absolute",
                bottom: "10px",
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: "0.7rem",
                color: "var(--color-fg-muted, #6b7280)"
            }}>
                長押しでドラッグ
            </div>
        </div>
    );
}

// ============================================================
// M3. Mobile Tap Explore Demo - Right sidebar version
// ============================================================
export function MobileTapExploreDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);
    const [fingerPos, setFingerPos] = useState({ x: 60, y: 20 });
    const [tapping, setTapping] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setFingerPos({ x: 0, y: 10 }); setHovered(true); },
            () => { setTapping(true); },
            () => { setTapping(false); setPanelOpen(true); },
            () => { /* Hold */ },
            () => { if (onComplete) { onComplete(); return; } setPanelOpen(false); setHovered(false); setFingerPos({ x: 60, y: 20 }); setStep(-1); }
        ];
        const timer = setTimeout(() => {
            if (step === 3 && onComplete) { sequence[step](); onComplete(); return; }
            if (step < sequence.length) { sequence[step](); setStep(s => s + 1); }
        }, step === 0 ? 600 : step === 3 ? 2500 : 400);
        return () => clearTimeout(timer);
    }, [step, onComplete]);

    return (
        <div style={{
            ...CARD_STYLE,
            position: "relative",
            minHeight: "280px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            padding: 0
        }}>
            {/* Left: Phrase Card */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                paddingRight: panelOpen ? "180px" : "24px",
                transition: "padding-right 0.3s"
            }}>
                <div style={{
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    whiteSpace: "nowrap",
                    fontSize: "0.9rem"
                }}>
                    <span style={{ ...TOKEN_STYLE, fontSize: "inherit" }}>I often</span>
                    <motion.span
                        animate={{
                            background: hovered || panelOpen ? "rgba(59, 130, 246, 0.15)" : "transparent",
                            color: panelOpen ? "var(--color-accent, #3b82f6)" : TOKEN_STYLE.color
                        }}
                        style={{ ...TOKEN_STYLE, fontSize: "inherit", padding: "2px 6px", borderRadius: "4px" }}
                    >
                        eat
                    </motion.span>
                    <span style={{ ...TOKEN_STYLE, fontSize: "inherit" }}>fresh sushi</span>
                </div>
            </div>

            {/* Right: Explorer Panel Sidebar */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 40, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "180px" }}
                        exit={{ opacity: 0, x: 40, width: 0 }}
                        style={{
                            background: "var(--color-surface, #fff)",
                            borderLeft: "1px solid var(--color-border, #e5e7eb)",
                            height: "100%",
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "-4px 0 15px rgba(0,0,0,0.08)",
                            padding: "12px",
                            zIndex: 10
                        }}
                    >
                        {/* Panel Header */}
                        <div style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "var(--color-fg, #111827)",
                            borderBottom: "1px solid var(--color-border, #e5e7eb)",
                            paddingBottom: "8px",
                            marginBottom: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <span style={{ color: "var(--color-accent, #3b82f6)" }}>eat</span>
                            <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #9ca3af)" }}>✕</span>
                        </div>

                        {/* Example Sentences */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem" }}>
                            <div style={{
                                padding: "8px",
                                background: "var(--color-bg-sub, #f9fafb)",
                                borderRadius: "6px"
                            }}>
                                <div style={{ marginBottom: "4px" }}>I <b style={{ color: "#3b82f6" }}>eat</b> rice</div>
                                <div style={{ color: "var(--color-fg-muted, #6b7280)", fontSize: "0.7rem" }}>私はご飯を食べます</div>
                            </div>
                            <div style={{
                                padding: "8px",
                                background: "var(--color-bg-sub, #f9fafb)",
                                borderRadius: "6px"
                            }}>
                                <div style={{ marginBottom: "4px" }}>We <b style={{ color: "#3b82f6" }}>eat</b> lunch</div>
                                <div style={{ color: "var(--color-fg-muted, #6b7280)", fontSize: "0.7rem" }}>昼食を食べます</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Caption - positioned below phrase, not overlapping panel */}
            <div style={{
                position: "absolute",
                bottom: "8px",
                left: "8px",
                width: panelOpen ? "calc(100% - 196px)" : "calc(100% - 16px)",
                textAlign: "center",
                fontSize: "0.65rem",
                color: "var(--color-fg-muted, #6b7280)",
                transition: "width 0.3s",
                whiteSpace: "nowrap"
            }}>
                タップで探索
            </div>

            {/* Finger */}
            <motion.div
                animate={{ x: fingerPos.x, y: fingerPos.y }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{ position: "absolute", left: "35%", top: "40%", marginLeft: "-20px", pointerEvents: "none", zIndex: 100 }}
            >
                <Finger tapping={tapping} />
            </motion.div>
        </div>
    );
}

// ============================================================
// M4. Mobile Prediction Memo Demo - Uses touch indicator
// ============================================================
export function MobilePredictionMemoDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);
    const [inputText, setInputText] = useState("");
    const [confidence, setConfidence] = useState<'Low' | 'Med' | 'High' | null>(null);
    const [fingerPos, setFingerPos] = useState({ x: 0, y: 0 });
    const [tapping, setTapping] = useState(false);

    const phases = [
        'idle', 'moveInput', 'tapInput', 'typing', 'typed',
        'moveMed', 'tapMed', 'moveRegister', 'tapRegister', 'submitted'
    ] as const;
    const delays = [400, 500, 300, 800, 600, 500, 300, 500, 300, 2000];
    const phase = phases[Math.min(step, phases.length - 1)];

    useEffect(() => {
        if (step >= phases.length) return;

        // Handle actions based on phase
        if (phase === 'typing') {
            const text = "食べる";
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    setInputText(text.slice(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 120);
        } else if (phase === 'tapMed') {
            setConfidence('Med');
        } else if (phase === 'submitted') {
            if (onComplete) { onComplete(); return; }
        }

        // Finger position - adjusted based on visual feedback
        // Card is ~280px wide, centered in container
        // Positions relative to center of container (0,0)

        // Idle: start off to the side
        if (phase === 'idle') {
            setFingerPos({ x: 120, y: 80 });
            setTapping(false);
        }
        // Move to input area - should be on "Add a note..." text
        else if (phase === 'moveInput') {
            setFingerPos({ x: -30, y: 0 });
            setTapping(false);
        }
        else if (phase === 'tapInput') { setTapping(true); }
        else if (phase === 'typing') { setTapping(false); }
        else if (phase === 'typed') { setTapping(false); }
        // Move to MED button - center of the three buttons (HIGH/MED/LOW)
        else if (phase === 'moveMed') {
            setFingerPos({ x: 35, y: -35 });
            setTapping(false);
        }
        else if (phase === 'tapMed') { setTapping(true); }
        // Move to Register button
        else if (phase === 'moveRegister') {
            setFingerPos({ x: 55, y: 40 });
            setTapping(false);
        }
        else if (phase === 'tapRegister') { setTapping(true); }

        const timer = setTimeout(() => {
            if (step < phases.length - 1) {
                setStep(s => s + 1);
            } else if (onComplete) {
                onComplete();
            }
        }, delays[step] + (phase === 'typing' ? 400 : 0));

        return () => clearTimeout(timer);
    }, [step, onComplete]);

    const borderColor = confidence === 'High' ? "#10b981" : confidence === 'Med' ? "#f59e0b" : "#ef4444";

    return (
        <div style={{ ...CARD_STYLE, position: "relative", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{
                width: "100%",
                maxWidth: "280px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                position: "relative",
                overflow: "hidden"
            }}>
                {/* Left color bar */}
                <motion.div
                    animate={{ background: borderColor }}
                    style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", borderRadius: "8px 0 0 8px" }}
                />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>eat</span>
                    <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-sub, #f3f4f6)", borderRadius: "4px", padding: "2px" }}>
                        {['HIGH', 'MED', 'LOW'].map(level => {
                            const isActive = confidence === (level === 'HIGH' ? 'High' : level === 'MED' ? 'Med' : 'Low');
                            const levelKey = level === 'HIGH' ? 'High' : level === 'MED' ? 'Med' : 'Low';
                            return (
                                <motion.span
                                    key={level}
                                    animate={{
                                        backgroundColor: isActive ? (levelKey === 'Low' ? "#ef4444" : levelKey === 'Med' ? "#f59e0b" : "#10b981") : "transparent",
                                        color: isActive ? "#fff" : "var(--color-fg-muted, #6b7280)"
                                    }}
                                    style={{ padding: "2px 6px", fontSize: "0.6rem", borderRadius: "2px", fontWeight: 600 }}
                                >
                                    {level}
                                </motion.span>
                            );
                        })}
                    </div>
                </div>

                {/* Input */}
                <div style={{ fontSize: "0.9rem", minHeight: "1.4em", paddingLeft: "8px", borderBottom: "1px solid var(--color-border-subtle, #f3f4f6)", paddingBottom: "4px" }}>
                    {inputText ? (
                        <span>{inputText}</span>
                    ) : (
                        <span style={{ color: "var(--color-fg-muted, #9ca3af)" }}>Add a note...</span>
                    )}
                    {['tapInput', 'typing'].includes(phase) && (
                        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>|</motion.span>
                    )}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #9ca3af)" }}>2026/1/16</span>
                    <span style={{ background: "var(--color-fg, #1f2937)", color: "#fff", borderRadius: "4px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 600 }}>
                        Register
                    </span>
                </div>
            </div>

            {/* Finger - positioned relative to outer container center */}
            {/* Card is 280px max width, ~120px height. Center = (0,0) */}
            {/* Input: left area at y≈0,  MED: right side at y≈-40, Register: right at y≈+40 */}
            <motion.div
                animate={{ x: fingerPos.x, y: fingerPos.y }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-18px",
                    marginTop: "-18px",
                    pointerEvents: "none",
                    zIndex: 100
                }}
            >
                <Finger tapping={tapping} />
            </motion.div>
        </div>
    );
}
