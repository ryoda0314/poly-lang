"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import { DEMO_CONTENT } from "./AnimatedTutorialDemos";

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
function MultiSelectToggle({ active, size = "normal", label }: { active: boolean; size?: "normal" | "small"; label?: string }) {
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
            <span>{label || "Multi-select"}</span>
        </motion.div>
    );
}

// ============================================================
// M1. Mobile Slide Select Demo
// ============================================================
export function MobileSlideSelectDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
    const words = content.shift_words;
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
                <MultiSelectToggle active={multiSelectActive} size="small" label={t.tutorial_multi_select} />
            </div>
            <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px", padding: "0 8px" }}>
                {words.map((word: string, i: number) => {
                    const isSelected = selectedRange && i >= selectedRange[0] && i <= selectedRange[1];
                    const isStart = selectedRange && i === selectedRange[0];
                    const isEnd = selectedRange && i === selectedRange[1];
                    return (
                        <motion.span
                            key={i}
                            style={{
                                ...TOKEN_STYLE, padding: "4px 6px", fontSize: "0.95rem", background: "transparent",
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
                {t.phrases_mobile_slide_desc}
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
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
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
                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{content.drag_word}</span>
                            <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-sub, #f3f4f6)", borderRadius: "4px", padding: "2px" }}>
                                <span style={{ padding: "2px 6px", fontSize: "0.6rem", color: "var(--color-fg-muted, #6b7280)" }}>{t.confidence_high || "HIGH"}</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.6rem", color: "var(--color-fg-muted, #6b7280)" }}>{t.confidence_med || "MED"}</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.6rem", background: "#ef4444", color: "#fff", borderRadius: "2px", fontWeight: 600 }}>{t.confidence_low || "LOW"}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted, #9ca3af)", paddingLeft: "8px" }}>{t.tutorial_add_note_placeholder}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--color-border-subtle, #f3f4f6)", paddingLeft: "8px" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #9ca3af)" }}>2026/1/16</span>
                            <span style={{
                                background: "var(--color-fg, #1f2937)",
                                color: "#fff",
                                borderRadius: "4px",
                                padding: "6px 14px",
                                fontSize: "0.75rem",
                                fontWeight: 600
                            }}>{t.tutorial_register_button}</span>
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
                        {t.tutorial_drop_zone}
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
                <span style={TOKEN_STYLE}>{content.drag_rest}</span>
                <span style={{
                    ...TOKEN_STYLE,
                    padding: "4px 10px",
                    background: "var(--color-bg-sub, #f3f4f6)",
                    borderRadius: "6px",
                    opacity: showGhost ? 0.4 : 1,
                    transition: "opacity 0.15s"
                }}>{content.drag_word}</span>
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
                    {content.drag_word}
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
                {t.phrases_mobile_drag_desc}
            </div>
        </div>
    );
}

// ============================================================
// M3. Mobile Tap Explore Demo - Right sidebar version
// ============================================================
export function MobileTapExploreDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
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
                    {content.tap_phrase.map((part: any, i: number) => (
                        <motion.span
                            key={i}
                            style={{
                                ...TOKEN_STYLE,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "inherit"
                            }}
                            animate={{
                                background: (part.highlight && (hovered || panelOpen)) ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                color: (part.highlight && panelOpen) ? "var(--color-accent, #3b82f6)" : TOKEN_STYLE.color
                            }}
                        >
                            {part.text}
                        </motion.span>
                    ))}
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
                            <span style={{ color: "var(--color-accent, #3b82f6)" }}>{content.tap_target}</span>
                            <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #9ca3af)" }}>✕</span>
                        </div>

                        {/* Example Sentences */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem" }}>
                            {content.explorer_examples && content.explorer_examples.map((ex: any, i: number) => {
                                const translation = typeof ex.translation === 'object'
                                    ? (ex.translation[nativeLanguage] || ex.translation.en || ex.translation)
                                    : ex.translation;
                                return (
                                    <div key={i} style={{
                                        padding: "8px",
                                        background: "var(--color-bg-sub, #f9fafb)",
                                        borderRadius: "6px"
                                    }}>
                                        <div style={{ marginBottom: "4px" }}>
                                            {ex.phrase.split(content.tap_target).map((part: string, idx: number, arr: string[]) => (
                                                <React.Fragment key={idx}>
                                                    {part}
                                                    {idx < arr.length - 1 && <b style={{ color: "#3b82f6" }}>{content.tap_target}</b>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <div style={{ color: "var(--color-fg-muted, #6b7280)", fontSize: "0.7rem" }}>{translation}</div>
                                    </div>
                                );
                            })}
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
                {t.phrases_mobile_tap_desc}
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
    const { activeLanguageCode: learningLanguage, nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
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

    // Use prediction meaning in native language for typing animation (user writes meaning in their native language)
    const meaningObj = content.prediction_meaning;
    const typingText = meaningObj && typeof meaningObj === 'object'
        ? (meaningObj[nativeLanguage] || meaningObj.en || content.prediction_text)
        : content.prediction_text;

    useEffect(() => {
        if (step >= phases.length) return;

        // Handle actions based on phase
        if (phase === 'typing') {
            let i = 0;
            const interval = setInterval(() => {
                if (i < typingText.length) {
                    setInputText(typingText.slice(0, i + 1));
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
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{content.drag_word}</span>
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
                        <span style={{ color: "var(--color-fg-muted, #9ca3af)" }}>{t.tutorial_add_note_placeholder || "Add a note..."}</span>
                    )}
                    {['tapInput', 'typing'].includes(phase) && (
                        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>|</motion.span>
                    )}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #9ca3af)" }}>2026/1/16</span>
                    <span style={{ background: "var(--color-fg, #1f2937)", color: "#fff", borderRadius: "4px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {t.tutorial_register_button || "Register"}
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

// ============================================================
// M5. Mobile Audio Play Demo - Uses touch indicator
// ============================================================
export function MobileAudioPlayDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
    const [step, setStep] = useState(0);
    const [fingerPos, setFingerPos] = useState({ x: 60, y: 0 });
    const [tapping, setTapping] = useState(false);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setFingerPos({ x: 60, y: 0 }); },  // Start from outside right
            () => { setFingerPos({ x: 0, y: 0 }); },  // Move onto button
            () => { setTapping(true); setPlaying(true); },
            () => { setTapping(false); },
            () => { /* Playing animation */ },
            () => {
                setPlaying(false);
                setFingerPos({ x: 60, y: 0 });
                if (onComplete) { onComplete(); }
            }
        ];

        const timer = setTimeout(() => {
            if (step === 2 && onComplete) {
                sequence[step]();
                onComplete();
                return;
            }

            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 600 : step === 3 ? 1200 : 400);

        return () => clearTimeout(timer);
    }, [step, onComplete]);

    return (
        <div style={{ ...CARD_STYLE, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
                <span style={TOKEN_STYLE}>{content.audio_phrase}</span>
            </div>

            <motion.button
                style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    background: playing ? "var(--color-accent, #3b82f6)" : "transparent",
                    color: playing ? "#fff" : "var(--color-fg-muted, #6b7280)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "1rem",
                    transition: "background 0.2s"
                }}
                animate={{ scale: playing ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: playing ? Infinity : 0, duration: 0.6 }}
            >
                {playing ? "♪" : "🔊"}
            </motion.button>

            <motion.div
                animate={{ x: fingerPos.x, y: fingerPos.y }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                style={{ position: "absolute", right: "45px", top: "50%", marginTop: "-18px", pointerEvents: "none", zIndex: 100 }}
            >
                <Finger tapping={tapping} />
            </motion.div>
        </div>
    );
}

// ============================================================
// MOBILE CORRECTION TUTORIAL DEMOS
// ============================================================

// MC1. Mobile Correction Typing Demo
export function MobileCorrectionTypingDemo({ onComplete }: { onComplete?: () => void }) {
    const [typedText, setTypedText] = useState("");
    const fullText = "I want eat sushi";

    useEffect(() => {
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < fullText.length) {
                setTypedText(fullText.slice(0, i + 1));
                i++;
            } else {
                clearInterval(typeInterval);
                if (onComplete) {
                    setTimeout(onComplete, 800);
                }
            }
        }, 80);

        return () => clearInterval(typeInterval);
    }, [onComplete]);

    return (
        <div style={{ padding: "12px" }}>
            {/* Input area */}
            <div style={{
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #E0DDD5)",
                borderRadius: "20px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
            }}>
                <div style={{ flex: 1, fontSize: "0.9rem", display: "flex", alignItems: "center" }}>
                    <span>{typedText}</span>
                    <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        style={{
                            display: "inline-block",
                            width: "2px",
                            height: "1.1em",
                            background: "var(--color-accent, #D94528)",
                            marginLeft: "2px"
                        }}
                    />
                </div>
                <motion.div
                    animate={{ scale: typedText.length === fullText.length ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: "var(--color-accent, #D94528)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "16px",
                        fontSize: "0.75rem",
                        fontWeight: 600
                    }}
                >
                    送信
                </motion.div>
            </div>
        </div>
    );
}

// MC2. Mobile Correction Feedback Demo
export function MobileCorrectionFeedbackDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const delays = [800, 1500, 1200];
        const timer = setTimeout(() => {
            if (step < 3) {
                setStep(s => s + 1);
            } else if (onComplete) {
                onComplete();
            }
        }, delays[step] || 800);

        return () => clearTimeout(timer);
    }, [step, onComplete]);

    const showLoading = step >= 1;
    const showResult = step >= 2;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px" }}>
            {/* User input */}
            <div style={{
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #E0DDD5)",
                borderRadius: "12px",
                padding: "8px 10px"
            }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--color-fg-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                    YOUR ATTEMPT
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                    &quot;Yesterday I go park&quot;
                </div>
            </div>

            {/* Loading / Result */}
            <AnimatePresence mode="wait">
                {showLoading && !showResult && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "12px"
                        }}
                    >
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            style={{ display: "flex", gap: "4px" }}
                        >
                            <span style={{ width: "6px", height: "6px", background: "var(--color-accent)", borderRadius: "50%" }} />
                            <span style={{ width: "6px", height: "6px", background: "var(--color-accent)", borderRadius: "50%" }} />
                            <span style={{ width: "6px", height: "6px", background: "var(--color-accent)", borderRadius: "50%" }} />
                        </motion.div>
                        <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)" }}>AI が添削中...</span>
                    </motion.div>
                )}

                {showResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "var(--color-surface, #fff)",
                            border: "2px solid var(--color-accent, #D94528)",
                            borderRadius: "12px",
                            padding: "10px"
                        }}
                    >
                        <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", marginBottom: "2px" }}>
                            BETTER PHRASING
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "3px" }}>
                            Yesterday I <span style={{ color: "#10b981" }}>went to the</span> park
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--color-fg-muted)", marginBottom: "6px" }}>
                            昨日、公園に行きました
                        </div>
                        {/* Diff */}
                        <div style={{
                            paddingTop: "6px",
                            borderTop: "1px solid var(--color-border, #E0DDD5)",
                            fontSize: "0.65rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}>
                            <span style={{ fontWeight: 600, color: "var(--color-fg-muted)" }}>Diff:</span>
                            <span style={{
                                textDecoration: "line-through",
                                color: "#ef4444",
                                background: "rgba(255,0,0,0.1)",
                                padding: "1px 3px",
                                borderRadius: "2px"
                            }}>go</span>
                            <span>→</span>
                            <span style={{
                                color: "#10b981",
                                background: "rgba(16,185,129,0.1)",
                                padding: "1px 3px",
                                borderRadius: "2px"
                            }}>went to the</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}



// MC3. Mobile Correction Word Track Demo
export function MobileCorrectionWordTrackDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const delays = [1000, 1200, 1200, 1000];
        const timer = setTimeout(() => {
            if (step < 4) {
                setStep(s => s + 1);
            } else if (onComplete) {
                onComplete();
            }
        }, delays[step] || 800);

        return () => clearTimeout(timer);
    }, [step, onComplete]);

    const showCorrection = step >= 1;
    const showVerified = step >= 2;
    const isComplete = step >= 3;

    return (
        <div style={{ padding: "10px" }}>
            {/* Vertical flow for mobile */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                {/* あいまい */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: showCorrection ? 0.5 : 1,
                    transition: "opacity 0.3s"
                }}>
                    <div style={{ fontSize: "0.7rem", color: "#999", minWidth: "50px" }}>🌫️ 曖昧</div>
                    <div style={{
                        flex: 1,
                        background: "#f5f5f5",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "0.8rem",
                        color: "#888"
                    }}>
                        ramen?
                    </div>
                </div>

                {/* Arrow */}
                <div style={{ textAlign: "center", color: showCorrection ? "#f59e0b" : "#ddd" }}>↓</div>

                {/* 添削結果 */}
                <motion.div
                    animate={{ opacity: showCorrection ? 1 : 0.3 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <div style={{ fontSize: "0.7rem", color: showCorrection ? "#d97706" : "#bbb", minWidth: "50px" }}>📝 確認</div>
                    <div style={{
                        flex: 1,
                        background: showCorrection ? "#fffbeb" : "#fafafa",
                        border: showCorrection ? "1px solid #fcd34d" : "1px dashed #ddd",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "0.8rem",
                        color: showCorrection ? "#92400e" : "#ccc"
                    }}>
                        {showCorrection ? "ramen ✓" : "—"}
                    </div>
                </motion.div>

                {/* Arrow */}
                <div style={{ textAlign: "center", color: showVerified ? "#10b981" : "#ddd" }}>↓</div>

                {/* はっきり */}
                <motion.div
                    animate={{ opacity: showVerified ? 1 : 0.3 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <div style={{ fontSize: "0.7rem", color: isComplete ? "#059669" : "#bbb", minWidth: "50px" }}>✨ 定着</div>
                    <motion.div
                        animate={{
                            background: isComplete ? "#ecfdf5" : "#fafafa",
                            borderColor: isComplete ? "#10b981" : "#ddd"
                        }}
                        style={{
                            flex: 1,
                            background: "#fafafa",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            color: isComplete ? "#059669" : "#ccc",
                            fontWeight: isComplete ? 600 : 400
                        }}
                    >
                        {isComplete ? "ramen ✓✓" : "—"}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

// MC4. Mobile Correction Loop Demo - Circular learning cycle
export function MobileCorrectionLoopDemo({ onComplete }: { onComplete?: () => void }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIdx(prev => {
                const next = (prev + 1) % 4;
                if (next === 0) {
                    setCycleCount(c => c + 1);
                    if (cycleCount >= 1 && onComplete) {
                        setTimeout(onComplete, 500);
                    }
                }
                return next;
            });
        }, 800);

        return () => clearInterval(timer);
    }, [onComplete, cycleCount]);

    const steps = [
        { icon: "✍️", label: "書く" },
        { icon: "📝", label: "添削" },
        { icon: "💡", label: "気づく" },
        { icon: "🎯", label: "定着" }
    ];

    return (
        <div style={{ padding: "16px 8px" }}>
            {/* Circular layout */}
            <div style={{
                position: "relative",
                width: "180px",
                height: "100px",
                margin: "0 auto"
            }}>
                {/* Center rotating arrow */}
                <motion.div
                    animate={{ rotate: activeIdx * 90 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "1.5rem"
                    }}
                >
                    🔄
                </motion.div>

                {/* Steps positioned around the center */}
                {steps.map((step, i) => {
                    const positions = [
                        { left: "5%", top: "50%", transform: "translateY(-50%)" },
                        { left: "30%", top: "0" },
                        { left: "55%", top: "0" },
                        { right: "5%", top: "50%", transform: "translateY(-50%)" }
                    ];
                    const isActive = activeIdx === i;
                    const isPast = (activeIdx > i) || (activeIdx === 0 && i === 3 && cycleCount > 0);

                    return (
                        <motion.div
                            key={i}
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                opacity: isActive ? 1 : isPast ? 0.7 : 0.4
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            style={{
                                position: "absolute",
                                ...positions[i],
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "2px"
                            }}
                        >
                            <motion.div
                                animate={{
                                    background: isActive ? "var(--color-accent, #D94528)" : isPast ? "#10b981" : "#e5e7eb"
                                }}
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1rem"
                                }}
                            >
                                {isPast && !isActive ? "✓" : step.icon}
                            </motion.div>
                            <span style={{
                                fontSize: "0.55rem",
                                fontWeight: 600,
                                color: isActive ? "var(--color-accent)" : isPast ? "#10b981" : "#9ca3af"
                            }}>
                                {step.label}
                            </span>
                        </motion.div>
                    );
                })}

                {/* Connecting lines */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                    <motion.path
                        d="M 45 50 Q 90 20 135 50"
                        fill="none"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        animate={{ stroke: activeIdx >= 1 ? "#10b981" : "#e5e7eb" }}
                    />
                </svg>
            </div>
        </div>
    );
}


// MC5. Mobile Correction Memo Button Demo - Shows memo button tap and sidebar
export function MobileCorrectionMemoButtonDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const delays = [1000, 800, 1500];
        const timer = setTimeout(() => {
            if (step < 3) {
                setStep(s => s + 1);
            } else if (onComplete) {
                onComplete();
            }
        }, delays[step] || 800);

        return () => clearTimeout(timer);
    }, [step, onComplete]);

    const showTap = step >= 1;
    const showSidebar = step >= 2;

    return (
        <div style={{ padding: "10px", position: "relative", height: "120px" }}>
            {/* Main screen mockup */}
            <div style={{
                background: "#faf9f6",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                height: "100%",
                position: "relative",
                overflow: "hidden"
            }}>
                {/* Input placeholder */}
                <div style={{
                    background: "#fff",
                    borderRadius: "16px",
                    border: "1px solid #ddd",
                    padding: "8px 12px",
                    margin: "10px",
                    fontSize: "0.7rem",
                    color: "#999"
                }}>
                    メッセージを入力...
                </div>

                {/* Memo button - bottom right */}
                <motion.div
                    animate={showTap ? { scale: [1, 0.9, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        width: "32px",
                        height: "32px",
                        background: "var(--color-accent, #D94528)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "0.9rem",
                        boxShadow: "0 2px 8px rgba(217, 69, 40, 0.3)"
                    }}
                >
                    📝
                </motion.div>

                {/* Tap indicator */}
                {showTap && !showSidebar && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.8, 1, 0.8] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        style={{
                            position: "absolute",
                            bottom: "6px",
                            right: "6px",
                            width: "40px",
                            height: "40px",
                            border: "2px solid var(--color-accent)",
                            borderRadius: "50%"
                        }}
                    />
                )}

                {/* Sidebar overlay */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "70%",
                                height: "100%",
                                background: "#fff",
                                borderRight: "1px solid #e5e7eb",
                                padding: "8px"
                            }}
                        >
                            <div style={{
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                color: "var(--color-accent)",
                                borderBottom: "2px solid var(--color-accent)",
                                paddingBottom: "4px",
                                marginBottom: "6px"
                            }}>
                                📝 気付きメモ
                            </div>
                            <div style={{
                                background: "#f9f8f4",
                                borderRadius: "4px",
                                padding: "6px",
                                fontSize: "0.55rem"
                            }}>
                                <div style={{ fontWeight: 600, color: "#333" }}>ramen</div>
                                <div style={{ color: "#888" }}>ラーメン</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
