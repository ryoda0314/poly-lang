"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X } from "lucide-react";

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

const CURSOR_STYLE: React.CSSProperties = {
    width: "24px",
    height: "24px",
    position: "absolute",
    pointerEvents: "none",
    zIndex: 10,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
};

// Cursor SVG component
function Cursor({ clicking = false }: { clicking?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" style={{ ...CURSOR_STYLE, transform: clicking ? "scale(0.85)" : "scale(1)", transition: "transform 0.1s" }}>
            <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.94c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35z"
                fill="#111827"
                stroke="#fff"
                strokeWidth="1.5"
            />
        </svg>
    );
}

// Shift key indicator
function ShiftIndicator({ visible }: { visible: boolean }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    style={{
                        position: "absolute",
                        top: "-28px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--color-fg, #111827)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "6px",
                        letterSpacing: "0.05em"
                    }}
                >
                    ⇧ SHIFT
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================
// 1. Shift+Click Range Selection Demo
// ============================================================
export function ShiftClickDemo() {
    const words = ["I", "want", "to", "eat", "sushi"];
    const [step, setStep] = useState(0);
    const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: -20, y: 18 });
    const [clicking, setClicking] = useState(false);
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setShiftHeld(true); setCursorPos({ x: -55, y: 0 }); },  // Move to "want"
            () => { setClicking(true); setSelectedRange([1, 1]); },
            () => { setClicking(false); },
            () => { setCursorPos({ x: 45, y: 0 }); },  // Move to "eat"
            () => { setClicking(true); setSelectedRange([1, 3]); },
            () => { setClicking(false); setShiftHeld(false); },
            () => { /* Hold */ },
            () => { setSelectedRange(null); setCursorPos({ x: -55, y: 0 }); setStep(-1); }
        ];

        const timer = setTimeout(() => {
            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 600 : step === 6 ? 1200 : 500);

        return () => clearTimeout(timer);
    }, [step]);

    return (
        <div style={{ ...CARD_STYLE, position: "relative", padding: "36px 16px 16px" }}>
            <ShiftIndicator visible={shiftHeld} />

            <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap" }}>
                {words.map((word, i) => {
                    const isSelected = selectedRange && i >= selectedRange[0] && i <= selectedRange[1];
                    const isStart = selectedRange && i === selectedRange[0];
                    const isEnd = selectedRange && i === selectedRange[1];

                    return (
                        <motion.span
                            key={i}
                            style={{
                                ...TOKEN_STYLE,
                                padding: "4px 8px",
                                background: "transparent",
                                borderStyle: "solid",
                                borderColor: isSelected ? "#ea580c" : "transparent",
                                borderTopWidth: "2px",
                                borderBottomWidth: "2px",
                                borderLeftWidth: isSelected && isStart ? "2px" : isSelected ? "0" : "2px", // pad transparent border if not selected
                                borderRightWidth: isSelected && isEnd ? "2px" : isSelected ? "0" : "2px",
                                borderRadius: isSelected
                                    ? `${isStart ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isStart ? "6px" : "0"}`
                                    : "6px",
                                margin: isSelected ? "0 -1px" : "0", // Pull selected items together to merge borders
                                zIndex: isSelected ? 1 : 0
                            }}
                            animate={{ scale: isSelected ? 1.05 : 1 }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </div>

            <motion.div
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                style={{ position: "absolute", left: "50%", top: "50%", marginLeft: "-10px", pointerEvents: "none", zIndex: 100 }}
            >
                <Cursor clicking={clicking} />
            </motion.div>
        </div>
    );
}

// ============================================================
// 2. Drag & Drop Demo
// ============================================================
export function DragDropDemo() {
    const [phase, setPhase] = useState<'approach' | 'idle' | 'hover' | 'pickup' | 'dragging' | 'drop' | 'dropped'>('approach');

    useEffect(() => {
        const sequence = [
            { phase: 'approach' as const, delay: 500 },  // Cursor moves in
            { phase: 'idle' as const, delay: 400 },      // Cursor arrives at token
            { phase: 'hover' as const, delay: 300 },     // Hovering over token
            { phase: 'pickup' as const, delay: 250 },    // Mouse down, lift token
            { phase: 'dragging' as const, delay: 700 },  // Drag to drop zone
            { phase: 'drop' as const, delay: 150 },      // Release
            { phase: 'dropped' as const, delay: 2500 },  // Show memo card
        ];

        let stepIndex = 0;
        let timer: NodeJS.Timeout;

        const runStep = () => {
            setPhase(sequence[stepIndex].phase);
            timer = setTimeout(() => {
                stepIndex++;
                if (stepIndex >= sequence.length) stepIndex = 0;
                runStep();
            }, sequence[stepIndex].delay);
        };

        runStep();
        return () => clearTimeout(timer);
    }, []);

    const isHovering = phase === 'hover' || phase === 'pickup';
    const isPickedUp = phase === 'pickup';
    const isDragging = phase === 'dragging' || phase === 'drop';
    const isDropped = phase === 'dropped';
    const showFloatingToken = isPickedUp || isDragging;

    // Animation values
    const tokenY = isDragging ? -85 : isPickedUp ? -8 : 0;
    const tokenScale = isDragging ? 1.08 : isPickedUp ? 1.05 : 1;
    const cursorClicking = isPickedUp || isDragging;

    return (
        <div style={{ ...CARD_STYLE, position: "relative", minHeight: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "24px" }}>
            {/* Drop Zone / Memo Card Area */}
            <div style={{ minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                {isDropped ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{
                            width: "100%",
                            maxWidth: "320px",
                            background: "var(--color-surface, #fff)",
                            border: "1px solid var(--color-border, #e5e7eb)",
                            borderRadius: "8px",
                            padding: "var(--space-3, 12px)",
                            boxShadow: "var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))",
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--space-3, 12px)",
                            position: "relative",
                            overflow: "hidden"
                        }}
                    >
                        {/* Red left bar overlay */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", background: "#ef4444", borderRadius: "8px 0 0 8px" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-fg, #111827)" }}>sushi</span>
                            <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-subtle, #f9fafb)", borderRadius: "var(--radius-sm, 4px)", padding: "2px" }}>
                                <span style={{ padding: "2px 6px", fontSize: "0.65rem", color: "var(--color-fg-muted, #6b7280)", textTransform: "uppercase" }}>High</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.65rem", color: "var(--color-fg-muted, #6b7280)", textTransform: "uppercase" }}>Med</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.65rem", background: "#ef4444", color: "#fff", borderRadius: "2px", fontWeight: 600, textTransform: "uppercase" }}>Low</span>
                            </div>
                        </div>
                        <div style={{ fontSize: "0.95rem", color: "var(--color-fg-muted, #6b7280)" }}>Add a note...</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-2, 8px)", borderTop: "1px solid var(--color-border-subtle, #f3f4f6)" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", opacity: 0.7 }}>2026/1/15</span>
                            <div style={{ display: "flex", gap: "var(--space-2, 8px)", alignItems: "center" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-fg-muted, #6b7280)", opacity: 0.6 }}>
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <span style={{ background: "var(--color-fg, #1f2937)", color: "var(--color-bg, #fff)", borderRadius: "var(--radius-sm, 4px)", padding: "6px 16px", fontSize: "0.8rem", fontWeight: 600 }}>Register</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        animate={{
                            borderColor: isDragging ? "var(--color-accent, #3b82f6)" : "var(--color-border, #d1d5db)",
                            background: isDragging ? "rgba(59,130,246,0.1)" : "transparent",
                            scale: isDragging ? 1.02 : 1
                        }}
                        style={{ padding: "12px 24px", borderRadius: "var(--radius-md, 8px)", border: "2px dashed var(--color-border, #d1d5db)", fontSize: "0.85rem", color: "var(--color-fg-muted, #6b7280)" }}
                    >
                        Drop words here
                    </motion.div>
                )}
            </div>

            {/* Phrase Card */}
            <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "var(--radius-lg, 12px)", padding: "16px 20px", boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))", display: "flex", gap: "6px", alignItems: "center", position: "relative" }}>
                <span style={TOKEN_STYLE}>I</span>
                <span style={TOKEN_STYLE}>really</span>
                <span style={TOKEN_STYLE}>like</span>
                {/* Static sushi token */}
                <span style={{ ...TOKEN_STYLE, padding: "4px 8px", background: "var(--color-bg-sub, #f3f4f6)", borderRadius: "6px", opacity: showFloatingToken ? 0.4 : 1, transition: "opacity 0.15s" }}>sushi</span>

                {/* Cursor - animates from right side to token position */}
                {!isDropped && !showFloatingToken && (
                    <motion.div
                        initial={{ opacity: 1, x: 60, y: 30 }}
                        animate={{
                            opacity: 1,
                            x: phase === 'approach' ? 50 : -15,
                            y: phase === 'approach' ? 25 : 5
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 12
                        }}
                        style={{ position: "absolute", right: "15px", top: "50%", marginTop: "-5px", pointerEvents: "none", zIndex: 100 }}
                    >
                        <Cursor clicking={false} />
                    </motion.div>
                )}
            </div>

            {/* Floating dragged token + cursor */}
            {showFloatingToken && (
                <motion.div
                    initial={{ opacity: 0, y: 0, scale: 1 }}
                    animate={{
                        opacity: 1,
                        y: tokenY,
                        scale: tokenScale,
                        rotate: isDragging ? -2 : 0
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    style={{
                        position: "absolute",
                        bottom: "72px",
                        display: "flex",
                        alignItems: "flex-start",
                        zIndex: 50,
                        pointerEvents: "none"
                    }}
                >
                    <span style={{
                        ...TOKEN_STYLE,
                        padding: "4px 8px",
                        background: "var(--color-bg-sub, #f3f4f6)",
                        borderRadius: "6px",
                        boxShadow: isDragging ? "0 12px 24px rgba(0,0,0,0.2)" : "0 4px 8px rgba(0,0,0,0.1)"
                    }}>
                        sushi
                    </span>
                    <div style={{ marginLeft: "-8px", marginTop: "8px" }}>
                        <Cursor clicking={cursorClicking} />
                    </div>
                </motion.div>
            )}
        </div>
    );
}












// ============================================================
// 3. Tap to Explore Demo
// ============================================================
export function TapExploreDemo() {
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: -20, y: 8 });
    const [clicking, setClicking] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setCursorPos({ x: -10, y: 12 }); setHovered(true); }, // Updated position
            () => { setClicking(true); },
            () => { setClicking(false); setPanelOpen(true); },
            () => { /* Hold */ },
            () => { setPanelOpen(false); setHovered(false); setCursorPos({ x: -10, y: 50 }); setStep(-1); }
        ];

        const timer = setTimeout(() => {
            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 600 : step === 3 ? 2500 : 400);

        return () => clearTimeout(timer);
    }, [step]);

    return (
        <div style={{ ...CARD_STYLE, background: "var(--color-bg-sub, #f9fafb)", width: "100%", position: "relative", display: "flex", gap: "16px", alignItems: "center", minHeight: "340px", overflow: "hidden" }}>
            {/* Phrase Card */}
            <div style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingRight: "360px"
            }}>
                <div style={{
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    gap: "6px",
                    alignItems: "center"
                }}>
                    <span style={TOKEN_STYLE}>I often</span>
                    <motion.span
                        style={{
                            ...TOKEN_STYLE,
                            padding: "2px 6px",
                            borderRadius: "4px"
                        }}
                        animate={{
                            background: hovered || panelOpen ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            color: panelOpen ? "var(--color-accent, #3b82f6)" : TOKEN_STYLE.color
                        }}
                    >
                        eat
                    </motion.span>
                    <span style={TOKEN_STYLE}>fresh sushi</span>
                </div>
            </div>

            {/* Explorer Panel - Example Sentences */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 40, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "360px" }}
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
                            boxShadow: "-8px 0 25px rgba(0,0,0,0.1)",
                            padding: "20px"
                        }}
                    >
                        {/* Panel Header */}
                        <div style={{
                            padding: "0 0 16px 0", // var(--space-4)
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            color: "var(--color-fg, #111827)",
                            borderBottom: "1px solid var(--color-border, #e5e7eb)",
                            marginBottom: "16px", // var(--space-4)
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span>eat</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {/* Gender Toggle (Static Demo) */}
                                <div style={{
                                    display: "flex",
                                    background: "var(--color-surface-hover, #f3f4f6)",
                                    borderRadius: "4px", // var(--radius-sm)
                                    padding: "2px",
                                    gap: "2px",
                                }}>
                                    <button style={{
                                        border: "none",
                                        background: "var(--color-surface, #fff)",
                                        color: "var(--color-fg, #111827)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.75rem",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                        fontWeight: 700
                                    }}>♂</button>
                                    <button style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--color-fg-muted, #6b7280)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.75rem",
                                        fontWeight: 400
                                    }}>♀</button>
                                </div>

                                <button
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--color-fg-muted, #6b7280)",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "50%"
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                            {/* Card 1 */}
                            <div style={{
                                background: "var(--color-surface, #fff)",
                                border: "1px solid var(--color-border, #e5e7eb)",
                                borderRadius: "8px", // var(--radius-md)
                                padding: "12px", // var(--space-3)
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)" // var(--shadow-sm)
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <div style={{ flex: 1, minWidth: 0, fontSize: "1rem" }}>
                                        I <b style={{ color: "#3b82f6" }}>eat</b> rice
                                    </div>
                                    <button style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--color-fg-muted, #6b7280)",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "default"
                                    }}>
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted, #6b7280)" }}>私はご飯を食べます</div>
                            </div>

                            {/* Card 2 */}
                            <div style={{
                                background: "var(--color-surface, #fff)",
                                border: "1px solid var(--color-border, #e5e7eb)",
                                borderRadius: "8px",
                                padding: "12px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <div style={{ flex: 1, minWidth: 0, fontSize: "1rem" }}>
                                        Let&apos;s <b style={{ color: "#3b82f6" }}>eat</b> out
                                    </div>
                                    <button style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--color-fg-muted, #6b7280)",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "default"
                                    }}>
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted, #6b7280)" }}>外食しましょう</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                style={{ position: "absolute", left: "calc((100% - 360px) / 2)", top: "50%" }}
            >
                <Cursor clicking={clicking} />
            </motion.div>
        </div>
    );
}

// ============================================================
// 4. Range Explore Demo (Clicking a selection)
// ============================================================
export function RangeExploreDemo() {
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: -20, y: 50 });
    const [clicking, setClicking] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setCursorPos({ x: 15, y: 15 }); setHovered(true); }, // Move to selection
            () => { setClicking(true); },
            () => { setClicking(false); setPanelOpen(true); },
            () => { /* Hold */ },
            () => { setPanelOpen(false); setHovered(false); setCursorPos({ x: -20, y: 50 }); setStep(-1); }
        ];

        const timer = setTimeout(() => {
            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 600 : step === 3 ? 2500 : 400);

        return () => clearTimeout(timer);
    }, [step]);

    const words = ["I", "want", "to", "eat", "sushi"];
    const selection = [1, 3]; // "want to eat"

    return (
        <div style={{ ...CARD_STYLE, background: "var(--color-bg-sub, #f9fafb)", width: "100%", position: "relative", display: "flex", gap: "16px", alignItems: "center", minHeight: "340px", overflow: "hidden" }}>
            {/* Phrase Card */}
            <div style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingRight: "360px"
            }}>
                <div style={{
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    gap: "2px",
                    alignItems: "center"
                }}>
                    {words.map((word, i) => {
                        const isSelected = i >= selection[0] && i <= selection[1];
                        const isStart = i === selection[0];
                        const isEnd = i === selection[1];
                        return (
                            <motion.span
                                key={i}
                                style={{
                                    ...TOKEN_STYLE,
                                    padding: "4px 8px",
                                    background: "transparent",
                                    borderStyle: "solid",
                                    borderColor: isSelected ? "#ea580c" : "transparent",
                                    borderTopWidth: "2px",
                                    borderBottomWidth: "2px",
                                    borderLeftWidth: isSelected && isStart ? "2px" : isSelected ? "0" : "2px",
                                    borderRightWidth: isSelected && isEnd ? "2px" : isSelected ? "0" : "2px",
                                    borderRadius: isSelected
                                        ? `${isStart ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isStart ? "6px" : "0"}`
                                        : "6px",
                                    margin: isSelected ? "0 -1px" : "0",
                                    zIndex: isSelected ? 1 : 0
                                }}
                                animate={{
                                    background: (isSelected && (hovered || panelOpen)) ? "rgba(234, 88, 12, 0.1)" : "transparent"
                                }}
                            >
                                {word}
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Explorer Panel */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 40, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "360px" }}
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
                            boxShadow: "-8px 0 25px rgba(0,0,0,0.1)",
                            padding: "20px"
                        }}
                    >
                        {/* Panel Header */}
                        <div style={{
                            padding: "0 0 16px 0",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            color: "var(--color-fg, #111827)",
                            borderBottom: "1px solid var(--color-border, #e5e7eb)",
                            marginBottom: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span>want to eat</span>
                            </div>
                            <X size={20} color="var(--color-fg-muted, #6b7280)" />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
                            {/* Card 1 */}
                            <div style={{
                                background: "var(--color-bg-sub, #f9fafb)",
                                borderRadius: "8px",
                                padding: "12px",
                                border: "1px solid var(--color-border, #e5e7eb)",
                                display: "flex", flexDirection: "column", gap: "8px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "1rem", color: "var(--color-fg, #111827)", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>I <b>want to eat</b> pizza</span>
                                    <Volume2 size={16} color="var(--color-fg-muted)" />
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted, #6b7280)" }}>ピザが食べたい</div>
                            </div>
                            {/* Card 2 */}
                            <div style={{
                                background: "var(--color-bg-sub, #f9fafb)",
                                borderRadius: "8px",
                                padding: "12px",
                                border: "1px solid var(--color-border, #e5e7eb)",
                                display: "flex", flexDirection: "column", gap: "8px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "1rem", color: "var(--color-fg, #111827)", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>Do you <b>want to eat</b>?</span>
                                    <Volume2 size={16} color="var(--color-fg-muted)" />
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted, #6b7280)" }}>何か食べたい？</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                style={{ position: "absolute", left: "calc((100% - 360px) / 2)", top: "50%" }}
            >
                <Cursor clicking={clicking} />
            </motion.div>
        </div>
    );
}

// ============================================================
// 5. Shift Clear Demo
// ============================================================
export function ShiftClearDemo() {
    const words = ["I", "want", "to", "eat", "sushi"];
    const [step, setStep] = useState(0);
    const [selectedRange, setSelectedRange] = useState<[number, number] | null>([1, 3]);
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { /* Wait */ },
            () => { setShiftHeld(true); }, // Press Shift
            () => { setShiftHeld(false); setSelectedRange(null); }, // Release Shift & Clear
            () => { /* Hold */ },
            () => { setSelectedRange([1, 3]); setStep(-1); } // Reset
        ];

        const timer = setTimeout(() => {
            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 1000 : step === 1 ? 400 : step === 3 ? 1500 : 800);

        return () => clearTimeout(timer);
    }, [step]);

    return (
        <div style={{ ...CARD_STYLE, position: "relative", padding: "36px 16px 16px" }}>
            <ShiftIndicator visible={shiftHeld} />

            <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap" }}>
                {words.map((word, i) => {
                    const isSelected = selectedRange && i >= selectedRange[0] && i <= selectedRange[1];
                    const isStart = selectedRange && i === selectedRange[0];
                    const isEnd = selectedRange && i === selectedRange[1];

                    return (
                        <motion.span
                            key={i}
                            style={{
                                ...TOKEN_STYLE,
                                padding: "4px 8px",
                                background: "transparent",
                                borderStyle: "solid",
                                borderColor: isSelected ? "#ea580c" : "transparent",
                                borderTopWidth: "2px",
                                borderBottomWidth: "2px",
                                borderLeftWidth: isSelected && isStart ? "2px" : isSelected ? "0" : "2px",
                                borderRightWidth: isSelected && isEnd ? "2px" : isSelected ? "0" : "2px",
                                borderRadius: isSelected
                                    ? `${isStart ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isStart ? "6px" : "0"}`
                                    : "6px",
                                margin: isSelected ? "0 -1px" : "0",
                                zIndex: isSelected ? 1 : 0
                            }}
                            animate={{ scale: isSelected ? 1.05 : 1 }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </div>

            <div style={{
                position: "absolute",
                bottom: "12px",
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: "0.8rem",
                color: "var(--color-fg-muted)",
                opacity: step >= 2 ? 1 : 0,
                transition: "opacity 0.3s"
            }}>
                Selection Cleared!
            </div>
        </div>
    );
}

// ============================================================
// 6. Audio Play Demo
// ============================================================
export function AudioPlayDemo() {
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: -30, y: 0 });
    const [clicking, setClicking] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setCursorPos({ x: 40, y: 20 }); },  // Start from outside right
            () => { setCursorPos({ x: 0, y: 0 }); setHovered(true); },  // Move onto button
            () => { setClicking(true); setPlaying(true); },
            () => { setClicking(false); },
            () => { /* Playing animation */ },
            () => { setPlaying(false); setHovered(false); setCursorPos({ x: 40, y: 20 }); setStep(-1); }
        ];

        const timer = setTimeout(() => {
            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 600 : step === 3 ? 1200 : 400);

        return () => clearTimeout(timer);
    }, [step]);

    return (
        <div style={{ ...CARD_STYLE, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
                <span style={TOKEN_STYLE}>I eat sushi</span>
            </div>

            <motion.button
                style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    background: playing ? "var(--color-accent, #3b82f6)" : hovered ? "var(--color-bg-sub, #f3f4f6)" : "transparent",
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
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                style={{ position: "absolute", right: "45px", top: "50%", marginTop: "-5px", pointerEvents: "none", zIndex: 100 }}
            >
                <Cursor clicking={clicking} />
            </motion.div>
        </div>
    );
}
