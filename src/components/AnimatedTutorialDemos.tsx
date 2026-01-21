"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

// Match actual app styles
const CARD_STYLE: React.CSSProperties = {
    background: "var(--color-surface, #fff)",
    border: "1px solid var(--color-border, #e5e7eb)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "16px",
    boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))"
};

export const DEMO_CONTENT: Record<string, any> = {
    en: {
        sushi: [{ text: "I", common: false }, { text: "eat", common: true }, { text: "sushi", common: false }],
        ramen: [{ text: "I", common: false }, { text: "eat", common: true }, { text: "ramen", common: false }],
        common_word: "eat",
        shift_words: ["I", "want", "to", "eat", "sushi"],
        shift_range: [1, 3], // "want to eat"
        shift_click_indices: { start: 1, end: 3, click1: 1, click2: 3 },

        drag_word: "eat",
        drag_rest: "I want to",
        tap_phrase: [{ text: "I often", highlight: false }, { text: "eat", highlight: true }, { text: "fresh sushi", highlight: false }],
        tap_target: "eat",
        prediction_text: "eat",
        prediction_meaning: { ja: "食べる", ko: "먹다", zh: "吃", en: "eat", fr: "manger" },
        audio_phrase: "I eat sushi",
        explorer_examples: [
            { phrase: "I eat rice", translation: { ja: "私はご飯を食べます", ko: "저는 밥을 먹어요", en: "I eat rice" } },
            { phrase: "We eat lunch", translation: { ja: "昼食を食べます", ko: "점심을 먹어요", en: "We eat lunch" } }
        ],
        range_examples: [
            { phrase: "I want to eat pizza", highlight: "want to eat", translation: { ja: "ピザが食べたい", ko: "피자를 먹고 싶어요", zh: "想吃披萨", en: "I want to eat pizza", fr: "Je veux manger de la pizza" } },
            { phrase: "Do you want to eat?", highlight: "want to eat", translation: { ja: "何か食べたい？", ko: "뭐 먹고 싶어요?", zh: "你想吃什么？", en: "Do you want to eat?", fr: "Tu veux manger quoi ?" } }
        ]
    },
    ja: {
        sushi: [{ text: "私は", common: false }, { text: "寿司を", common: false }, { text: "食べる", common: true }],
        ramen: [{ text: "私は", common: false }, { text: "ラーメンを", common: false }, { text: "食べる", common: true }],
        common_word: "食べる",
        shift_words: ["私は", "寿司を", "食べ", "たい"],
        shift_range: [2, 3], // "食べ" "たい"
        shift_click_indices: { start: 2, end: 3, click1: 2, click2: 3 },

        drag_word: "食べる",
        drag_rest: "私は",
        tap_phrase: [{ text: "よく", highlight: false }, { text: "寿司を", highlight: false }, { text: "食べます", highlight: true }],
        tap_target: "食べます",
        prediction_text: "食べる",
        prediction_meaning: { ja: "食べる", ko: "먹다", zh: "吃", en: "eat", fr: "manger" },
        audio_phrase: "私は寿司を食べる",
        explorer_examples: [
            { phrase: "私はご飯を食べます", translation: { ja: "私はご飯を食べます", ko: "저는 밥을 먹어요", en: "I eat rice" } },
            { phrase: "外食しましょう", translation: { ja: "外で食べましょう", ko: "외식해요", en: "Let's eat out" } }
        ],
        range_examples: [
            { phrase: "ピザを食べたい", highlight: "食べたい", translation: { ja: "ピザが食べたい", ko: "피자를 먹고 싶어요", zh: "想吃披萨", en: "I want to eat pizza", fr: "Je veux manger de la pizza" } },
            { phrase: "何か食べたい？", highlight: "食べたい", translation: { ja: "何か食べたい？", ko: "뭐 먹고 싶어요?", zh: "你想吃什么？", en: "Do you want to eat?", fr: "Tu veux manger quoi ?" } }
        ]
    },
    ko: {
        sushi: [{ text: "저는", common: false }, { text: "초밥을", common: false }, { text: "먹어요", common: true }],
        ramen: [{ text: "저는", common: false }, { text: "라면을", common: false }, { text: "먹어요", common: true }],
        common_word: "먹어요",
        shift_words: ["초밥을", "먹고", "싶어요"],
        shift_range: [1, 2], // "먹고" "싶어요"
        shift_click_indices: { start: 1, end: 2, click1: 1, click2: 2 },

        drag_word: "먹어요",
        drag_rest: "저는",
        tap_phrase: [{ text: "자주", highlight: false }, { text: "초밥을", highlight: false }, { text: "먹어요", highlight: true }],
        tap_target: "먹어요",
        prediction_text: "먹어요",
        prediction_meaning: { ja: "食べる", ko: "먹다", zh: "吃", en: "eat", fr: "manger" },
        audio_phrase: "저는 초밥을 먹어요",
        explorer_examples: [
            { phrase: "저는 밥을 먹어요", translation: { ja: "私はご飯を食べます", ko: "저는 밥을 먹어요", en: "I eat rice" } },
            { phrase: "우리 외식해요", translation: { ja: "外食しましょう", ko: "우리 외식해요", en: "Let's eat out" } }
        ],
        range_examples: [
            { phrase: "피자를 먹고 싶어요", highlight: "먹고 싶어요", translation: { ja: "ピザが食べたい", ko: "피자를 먹고 싶어요", zh: "想吃披萨", en: "I want to eat pizza", fr: "Je veux manger de la pizza" } },
            { phrase: "뭐 먹고 싶어요?", highlight: "먹고 싶어요", translation: { ja: "何か食べたい？", ko: "뭐 먹고 싶어요?", zh: "你想吃什么？", en: "Do you want to eat?", fr: "Tu veux manger quoi ?" } }
        ]
    },
    zh: {
        sushi: [{ text: "我", common: false }, { text: "吃", common: true }, { text: "寿司", common: false }],
        ramen: [{ text: "我", common: false }, { text: "吃", common: true }, { text: "拉面", common: false }],
        common_word: "吃",
        shift_words: ["我", "想", "吃", "寿司"],
        shift_range: [1, 2], // "想" "吃"
        shift_click_indices: { start: 1, end: 2, click1: 1, click2: 2 },
        drag_word: "吃",
        tap_phrase: [{ text: "我经常", highlight: false }, { text: "吃", highlight: true }, { text: "寿司", highlight: false }],
        tap_target: "吃",
        prediction_text: "吃",
        prediction_meaning: { ja: "食べる", ko: "먹다", zh: "吃", en: "eat", fr: "manger" },
        audio_phrase: "我吃寿司",
        explorer_examples: [
            { phrase: "我吃饭", translation: { ja: "私はご飯を食べます", ko: "저는 밥을 먹어요", en: "I eat rice" } },
            { phrase: "我们出去吃吧", translation: { ja: "外食しましょう", ko: "외식해요", en: "Let's eat out" } }
        ],
        range_examples: [
            { phrase: "我想吃披萨", highlight: "想吃", translation: { ja: "ピザが食べたい", ko: "피자를 먹고 싶어요", zh: "想吃披萨", en: "I want to eat pizza", fr: "Je veux manger de la pizza" } },
            { phrase: "你想吃什么？", highlight: "想吃", translation: { ja: "何か食べたい？", ko: "뭐 먹고 싶어요?", zh: "你想吃什么？", en: "Do you want to eat?", fr: "Tu veux manger quoi ?" } }
        ]
    },
    fr: {
        sushi: [{ text: "Je", common: false }, { text: "mange", common: true }, { text: "des sushis", common: false }],
        ramen: [{ text: "Je", common: false }, { text: "mange", common: true }, { text: "des ramen", common: false }],
        common_word: "mange",
        shift_words: ["Je", "veux", "manger", "des sushis"],
        shift_range: [1, 2], // "veux" "manger"
        shift_click_indices: { start: 1, end: 2, click1: 1, click2: 2 },
        drag_word: "mange",
        tap_phrase: [{ text: "Je", highlight: false }, { text: "mange", highlight: true }, { text: "souvent des sushis", highlight: false }],
        tap_target: "mange",
        prediction_text: "mange",
        prediction_meaning: { ja: "食べる", ko: "먹다", zh: "吃", en: "eat", fr: "manger" },
        audio_phrase: "Je mange des sushis",
        explorer_examples: [
            { phrase: "Je mange du riz", translation: { ja: "私はご飯を食べます", ko: "저는 밥을 먹어요", en: "I eat rice" } },
            { phrase: "On mange dehors", translation: { ja: "外食しましょう", ko: "외식해요", en: "Let's eat out" } }
        ],
        range_examples: [
            { phrase: "Je veux manger de la pizza", highlight: "veux manger", translation: { ja: "ピザが食べたい", ko: "피자를 먹고 싶어요", zh: "想吃披萨", en: "I want to eat pizza", fr: "Je veux manger de la pizza" } },
            { phrase: "Tu veux manger quoi ?", highlight: "veux manger", translation: { ja: "何か食べたい？", ko: "뭐 먹고 싶어요?", zh: "你想吃什么？", en: "Do you want to eat?", fr: "Tu veux manger quoi ?" } }
        ]
    }
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

// Cursor SVG component - realistic Windows/Mac style pointer
function Cursor({ clicking = false }: { clicking?: boolean }) {
    return (
        <motion.svg
            viewBox="0 0 28 28"
            style={CURSOR_STYLE}
            animate={{
                scale: clicking ? 0.75 : 1,
                y: clicking ? 2 : 0
            }}
            transition={{
                type: "spring",
                stiffness: 600,
                damping: 20
            }}
        >
            {/* Realistic pointer shape */}
            <path
                d="M8.2 2.5L8.2 22.5L12.5 17.7L16.3 25.8L19.2 24.2L15.6 16.2L22.2 16.2L8.2 2.5Z"
                fill="#fff"
                stroke="#000"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </motion.svg>
    );
}

// Shift key indicator - shows pressed/unpressed state
function ShiftIndicator({ visible }: { visible: boolean }) {
    return (
        <motion.div
            animate={{
                background: visible ? "var(--color-accent, #3b82f6)" : "var(--color-bg-sub, #e5e7eb)",
                color: visible ? "#fff" : "var(--color-fg-muted, #6b7280)",
                scale: visible ? 1 : 0.95,
                y: visible ? 0 : 2
            }}
            transition={{ duration: 0.15 }}
            style={{
                position: "absolute",
                top: "50%",
                left: "-70px",
                transform: "translateY(-50%)",
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: visible
                    ? "0 2px 8px rgba(59, 130, 246, 0.4)"
                    : "0 1px 2px rgba(0,0,0,0.1)",
                border: visible
                    ? "1px solid var(--color-accent, #3b82f6)"
                    : "1px solid var(--color-border, #d1d5db)"
            }}
        >
            <span>⇧</span>
            <span>Shift</span>
        </motion.div>
    );
}

// ============================================================
// Mobile Finger Component - shows touch gestures
// ============================================================
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
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 25
            }}
        >
            {/* Finger/Touch Icon - Simple circle with finger hint */}
            <svg viewBox="0 0 40 40" width="40" height="40">
                {/* Touch ripple when tapping */}
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
                {/* Holding pulse */}
                {holding && (
                    <motion.circle
                        cx="20" cy="20" r="16"
                        fill="rgba(59, 130, 246, 0.2)"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                )}
                {/* Finger circle */}
                <circle
                    cx="20" cy="20" r="12"
                    fill="linear-gradient(135deg, #fcd5ce 0%, #f8b4a9 100%)"
                    stroke="#e5a99a"
                    strokeWidth="2"
                />
                {/* Simple finger shape */}
                <ellipse
                    cx="20" cy="20" rx="10" ry="12"
                    fill="#fcd5ce"
                    stroke="#e5a99a"
                    strokeWidth="1.5"
                />
                {/* Nail hint */}
                <ellipse
                    cx="20" cy="14" rx="5" ry="4"
                    fill="#fff"
                    opacity="0.5"
                />
            </svg>
        </motion.div>
    );
}

// Multi-Select Toggle Button (for mobile demos)
function MultiSelectToggle({ active, size = "normal" }: { active: boolean; size?: "normal" | "small" }) {
    const { nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
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
            <span>{t.tutorial_multi_select}</span>
        </motion.div>
    );
}


// ============================================================
// 0. Compare Phrases Demo - Shows comparing phrases to find patterns
// ============================================================
// ============================================================
// 0a. Compare Phrases Demo - Shows comparing phrases to find patterns
// ============================================================
export function ComparePhrasesDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
    const [step, setStep] = useState(0);

    // Two phrases with common word highlighted + Native translation
    const phrases = [
        {
            words: content.sushi,
            translation: t.tutorial_sushi_phrase
        },
        {
            words: content.ramen,
            translation: t.tutorial_ramen_phrase
        }
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            if (step === 2 && onComplete) {
                onComplete();
                return;
            }
            setStep(s => (s + 1) % 4);
        }, step === 2 ? 2000 : step === 3 ? 500 : 1000); // Step 2 (highlight) longer, Step 3 (reset) quick
        return () => clearTimeout(timer);
    }, [step]);

    const showPhrase2 = step >= 1 && step !== 3;
    const highlightCommon = step === 2;
    const isResetting = step === 3;

    return (
        <div style={{
            ...CARD_STYLE,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "12px",
            minHeight: "150px"
        }}>
            {/* Phrase 1 */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{
                    opacity: isResetting ? 0.3 : 1, // Ghost mode: 0.3
                    x: isResetting ? 0 : 0
                }}
                transition={{ duration: 0.5 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "8px 12px",
                    background: "var(--color-bg-sub, #f9fafb)",
                    borderRadius: "8px"
                }}
            >
                <div style={{ display: "flex", gap: "6px" }}>
                    {phrases[0].words.map((word: any, i: number) => (
                        <motion.span
                            key={i}
                            animate={{
                                background: highlightCommon && word.common ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                color: highlightCommon && word.common ? "var(--color-accent, #3b82f6)" : "var(--color-fg, #111827)",
                                fontWeight: highlightCommon && word.common ? 700 : 400
                            }}
                            style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.95rem" }}
                        >
                            {word.text}
                        </motion.span>
                    ))}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #6b7280)", paddingLeft: "6px" }}>
                    {phrases[0].translation}
                </div>
            </motion.div>

            {/* Phrase 2 */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{
                    opacity: isResetting ? 0.3 : (showPhrase2 ? 1 : 0.3), // Ghost mode: 0.3
                    x: isResetting ? 0 : (showPhrase2 ? 0 : -10)
                }}
                transition={{ duration: 0.5 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "8px 12px",
                    background: "var(--color-bg-sub, #f9fafb)",
                    borderRadius: "8px"
                }}
            >
                <div style={{ display: "flex", gap: "6px" }}>
                    {phrases[1].words.map((word: any, i: number) => (
                        <motion.span
                            key={i}
                            animate={{
                                background: highlightCommon && word.common ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                color: highlightCommon && word.common ? "var(--color-accent, #3b82f6)" : "var(--color-fg, #111827)",
                                fontWeight: highlightCommon && word.common ? 700 : 400
                            }}
                            style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.95rem" }}
                        >
                            {word.text}
                        </motion.span>
                    ))}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #6b7280)", paddingLeft: "6px" }}>
                    {phrases[1].translation}
                </div>
            </motion.div>

            {/* Result message */}
            <AnimatePresence>
                {highlightCommon && !isResetting && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            textAlign: "center",
                            marginTop: "6px"
                        }}
                    >
                        <div style={{ fontSize: "0.75rem", color: "var(--color-accent, #3b82f6)", fontWeight: 600 }}>
                            {t.tutorial_common_discovery}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================
// 0b. Infer Meaning Demo - Shows inferring meaning from context
// ============================================================
export function InferMeaningDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;

    // Re-use the same phrases for continuity
    const phrases = [
        {
            words: content.sushi,
            translation: t.tutorial_sushi_phrase
        },
        {
            words: content.ramen,
            translation: t.tutorial_ramen_phrase
        }
    ];

    useEffect(() => {
        if (onComplete) {
            const timer = setTimeout(() => {
                onComplete();
            }, 3000); // 3 seconds to match animation
            return () => clearTimeout(timer);
        }
    }, [onComplete]);

    return (
        <div style={{
            ...CARD_STYLE,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "20px 16px",
            minHeight: "180px",
            position: "relative",
            alignItems: "center"
        }}>
            {/* Phrases */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                {phrases.map((phrase, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.8 }} // Faster: 0s, 0.8s
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            padding: "8px 12px",
                            background: "var(--color-bg-sub, #f9fafb)",
                            borderRadius: "8px",
                            border: "1px solid transparent",
                            position: "relative"
                        }}
                    >
                        <div style={{ display: "flex", gap: "6px" }}>
                            {phrase.words.map((word: any, i: number) => (
                                <span
                                    key={i}
                                    style={{
                                        background: word.common ? "rgba(59, 130, 246, 0.15)" : "transparent",
                                        color: word.common ? "var(--color-accent, #3b82f6)" : "var(--color-fg, #111827)",
                                        fontWeight: word.common ? 700 : 400,
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontSize: "0.95rem"
                                    }}
                                >
                                    {word.text}
                                </span>
                            ))}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #6b7280)", paddingLeft: "6px", display: "flex", gap: "2px" }}>
                            {idx === 0 ? (
                                <>{t.tutorial_sushi_phrase}</>
                            ) : (
                                <>{t.tutorial_ramen_phrase}</>
                            )}
                        </div>

                        {/* Connecting lines for effect */}
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 16 }}
                            transition={{ delay: 1.6, duration: 0.6 }} // Faster line
                            style={{
                                position: "absolute",
                                left: "50%",
                                bottom: "-20px",
                                width: "2px",
                                background: "var(--color-accent, #3b82f6)",
                                opacity: 0.3,
                                display: idx === 1 ? "none" : "block", // Only from first one? No, let's do something else
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Visual Arrow Flow */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 20 }}
                transition={{ delay: 2.0 }} // Arrow appears
                style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    marginTop: "-8px",
                    marginBottom: "-8px",
                    zIndex: 1
                }}
            >
                <div style={{ fontSize: "24px", color: "var(--color-accent, #3b82f6)", opacity: 0.5 }}>↓</div>
            </motion.div>

            {/* Inference Result */}
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 2.6 }} // Result appears
                style={{
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "12px",
                    padding: "10px 24px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    width: "100%"
                }}
            >
                <div style={{ fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>💡</span> {t.tutorial_inference_label}
                </div>
                <div style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-accent, #3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <span>{content.common_word}</span>
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>=</span>
                    <span>{t.tutorial_inference_result}</span>
                </div>
            </motion.div>
        </div>
    );
}

// ============================================================
// 1. Shift+Click Range Selection Demo
// ============================================================
export function ShiftClickDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
    const words = content.shift_words;
    const [step, setStep] = useState(0);
    const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: -20, y: 18 });
    const [clicking, setClicking] = useState(false);
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        const sequence = [
            () => { setShiftHeld(true); setCursorPos({ x: -55, y: 0 }); },  // Shift down, move to start
            () => { setClicking(true); setSelectedRange([content.shift_click_indices.click1, content.shift_click_indices.click1]); },          // Click to start selection
            () => { setClicking(false); },
            () => { setCursorPos({ x: 45, y: 0 }); },                        // Move to end (relative logic needs update if words differ length, simplified for now)
            () => { setClicking(true); setSelectedRange([content.shift_click_indices.click1, content.shift_click_indices.click2]); },          // Shift+click to extend
            () => { setClicking(false); setShiftHeld(false); },              // Release Shift (with click = keep selection)
            () => { /* Hold to show selection with Shift released */ },
            () => { setShiftHeld(true); },                                    // Press Shift again (no click)
            () => { /* Hold Shift pressed */ },
            () => { setShiftHeld(false); setSelectedRange(null); },          // Release Shift = selection clears
            () => { /* Hold cleared state */ },
            () => { setCursorPos({ x: -55, y: 0 }); if (onComplete) { onComplete(); } else { setStep(-1); } }           // Reset
        ];

        const timer = setTimeout(() => {
            if (step === 5 && onComplete) {
                sequence[step]();
                onComplete();
                return;
            }

            if (step < sequence.length) {
                sequence[step]();
                setStep(s => s + 1);
            }
        }, step === 0 ? 600 : step === 6 ? 1200 : step === 9 ? 500 : step === 10 ? 800 : 400);

        return () => clearTimeout(timer);
    }, [step]);
    // Determine which phase we're in for the description text
    const isClearingPhase = step >= 7 && step <= 11;
    const descriptionText = isClearingPhase
        ? t.tutorial_shift_release
        : t.tutorial_shift_click;

    return (
        <div style={{ ...CARD_STYLE, position: "relative", padding: "36px 16px 16px" }}>
            <ShiftIndicator visible={shiftHeld} />

            <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap" }}>
                {words.map((word: string, i: number) => {
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

            {/* Dynamic description text */}
            <motion.div
                key={isClearingPhase ? "clear" : "select"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    textAlign: "center",
                    marginTop: "12px",
                    fontSize: "0.75rem",
                    color: "var(--color-fg-muted, #6b7280)",
                    fontWeight: 500
                }}
            >
                {descriptionText}
            </motion.div>

            <motion.div
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                style={{ position: "absolute", left: "50%", top: "45%", marginLeft: "-10px", pointerEvents: "none", zIndex: 100 }}
            >
                <Cursor clicking={clicking} />
            </motion.div>
        </div>
    );
}

// ============================================================
// 2. Drag & Drop Demo
// ============================================================
export function DragDropDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
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
            const currentStep = sequence[stepIndex];
            setPhase(currentStep.phase);

            if (currentStep.phase === 'dropped' && onComplete) {
                onComplete();
                return;
            }

            timer = setTimeout(() => {
                stepIndex++;
                if (stepIndex >= sequence.length) {
                    if (onComplete) {
                        onComplete();
                        return;
                    }
                    stepIndex = 0;
                }
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
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-fg, #111827)" }}>{content.drag_word}</span>
                            <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-subtle, #f9fafb)", borderRadius: "var(--radius-sm, 4px)", padding: "2px" }}>
                                <span style={{ padding: "2px 6px", fontSize: "0.65rem", color: "var(--color-fg-muted, #6b7280)", textTransform: "uppercase" }}>{t.confidence_high || "High"}</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.65rem", color: "var(--color-fg-muted, #6b7280)", textTransform: "uppercase" }}>{t.confidence_med || "Med"}</span>
                                <span style={{ padding: "2px 6px", fontSize: "0.65rem", background: "#ef4444", color: "#fff", borderRadius: "2px", fontWeight: 600, textTransform: "uppercase" }}>{t.confidence_low || "Low"}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: "0.95rem", color: "var(--color-fg-muted, #6b7280)" }}>{t.tutorial_add_note_placeholder}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-2, 8px)", borderTop: "1px solid var(--color-border-subtle, #f3f4f6)" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", opacity: 0.7 }}>2026/1/15</span>
                            <div style={{ display: "flex", gap: "var(--space-2, 8px)", alignItems: "center" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-fg-muted, #6b7280)", opacity: 0.6 }}>
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <span style={{ background: "var(--color-fg, #1f2937)", color: "var(--color-bg, #fff)", borderRadius: "var(--radius-sm, 4px)", padding: "6px 16px", fontSize: "0.8rem", fontWeight: 600 }}>{t.tutorial_register_button}</span>
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
                        {t.tutorial_drop_zone}
                    </motion.div>
                )}
            </div>

            {/* Phrase Card */}
            <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "var(--radius-lg, 12px)", padding: "16px 20px", boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))", display: "flex", gap: "6px", alignItems: "center", position: "relative" }}>
                {content.shift_words.map((word: string, i: number) => {
                    // Reuse shift_words for simplicity or define drag_words. 
                    // Wait, DragDropDemo was "I want to eat". 'eat' was the drag word.
                    // Let's assume we use the same words as shift for context but 'drag_word' is separated.
                    // Actually, I should use `shift_words` logic here if indices match. Or just hardcode the sentence structure logic dynamically?
                    // The original code: "I", "want", "to" (static) + "eat" (hidden/dragged).
                    // EN: I want to [eat]
                    // JA: 私は 寿司を [食べる] (Actually "want to eat sushi" was Shift. "eat" is drag. Contexts vary.)
                    // Let's just use the `sushi` keys from `content`
                    // EN: I eat sushi. Drag "eat".
                    // JA: 私は 寿司を [食べる].
                    // KO: 저는 초밥을 [먹어요].
                    // Let's use `content.sushi` but replace `common` with logic for 'draggable'.
                    // Actually, `DragDropDemo` originally used "I want to eat" (Line 758).

                    // Simplified approach: Render `content.sushi` words. 
                    // If word == content.drag_word, make it the draggable one.
                    return (
                        <span key={i} style={{
                            ...TOKEN_STYLE,
                            padding: word === content.drag_word ? "4px 8px" : "2px 0",
                            background: word === content.drag_word ? "var(--color-bg-sub, #f3f4f6)" : "transparent",
                            borderRadius: word === content.drag_word ? "6px" : "0",
                            opacity: (word === content.drag_word && showFloatingToken) ? 0.4 : 1,
                            transition: "opacity 0.15s"
                        }}>
                            {word}
                        </span>
                    );
                })}

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
                        {content.drag_word}
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
// 2.5 Prediction Memo Demo
// ============================================================
export function PredictionMemoDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
    const [phase, setPhase] = useState<'idle' | 'moveInput' | 'clickInput' | 'waitInput' | 'typing' | 'typed' | 'moveLow' | 'clickLow' | 'moveMed' | 'clickMed' | 'moveRegister' | 'clickRegister' | 'submitted'>('idle');
    const [inputText, setInputText] = useState("");
    const [confidence, setConfidence] = useState<'Low' | 'Med' | 'High' | null>(null);

    // Dynamic Positioning Refs and State
    const cardRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const btnRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
    const registerRef = useRef<HTMLSpanElement>(null);
    const [checkPos, setCheckPos] = useState(0); // Trigger re-measurement

    // Default coords (fallback)
    const [targets, setTargets] = useState({
        input: { x: 40, y: 80 },
        low: { x: 490, y: 36 },
        med: { x: 455, y: 36 },
        register: { x: 455, y: 180 }
    });

    // Measure positions
    useEffect(() => {
        if (!cardRef.current) return;
        const cardRect = cardRef.current.getBoundingClientRect();

        const newTargets = { ...targets };
        let changed = false;

        // Measure Input
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            // Center of input for clicking
            const x = rect.left - cardRect.left + rect.width / 2;
            const y = rect.top - cardRect.top + rect.height / 2;
            newTargets.input = { x, y };
            changed = true;
        }

        // Measure Buttons
        ['Low', 'Med'].forEach(level => {
            const el = btnRefs.current[level];
            if (el) {
                const rect = el.getBoundingClientRect();
                const x = rect.left - cardRect.left + rect.width / 2;
                const y = rect.top - cardRect.top + rect.height / 2;
                if (level === 'Low') newTargets.low = { x, y };
                if (level === 'Med') newTargets.med = { x, y };
                changed = true;
            }
        });

        // Measure Register
        if (registerRef.current) {
            const rect = registerRef.current.getBoundingClientRect();
            const x = rect.left - cardRect.left + rect.width / 2;
            const y = rect.top - cardRect.top + rect.height / 2;
            newTargets.register = { x, y };
            changed = true;
        }

        if (changed) setTargets(newTargets);

    }, [checkPos, confidence]); // Re-measure if confidence size changes (unlikely) or checkPos triggers

    // Trigger measurement after mount/render
    useEffect(() => {
        const timer = setTimeout(() => setCheckPos(c => c + 1), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const sequence = [
            { phase: 'idle' as const, delay: 500 },
            { phase: 'moveInput' as const, delay: 600 },
            { phase: 'clickInput' as const, delay: 300 },
            { phase: 'waitInput' as const, delay: 800 }, // Pause before typing
            { phase: 'typing' as const, delay: 500 },
            { phase: 'typed' as const, delay: 800 },
            { phase: 'moveLow' as const, delay: 600 },
            { phase: 'clickLow' as const, delay: 400 },
            { phase: 'moveMed' as const, delay: 600 },
            { phase: 'clickMed' as const, delay: 400 },
            { phase: 'moveRegister' as const, delay: 600 },
            { phase: 'clickRegister' as const, delay: 400 },
            { phase: 'submitted' as const, delay: 2500 } // Clear and pause
        ];

        let stepIndex = 0;
        let timer: NodeJS.Timeout;

        const runStep = () => {
            const currentStep = sequence[stepIndex];
            setPhase(currentStep.phase);



            if (currentStep.phase === 'submitted' && onComplete) {
                onComplete();
                return;
            }

            if (currentStep.phase === 'typing') {
                // Simulate typing the meaning in native language
                const meaningObj = content.prediction_meaning;
                let text = meaningObj && typeof meaningObj === 'object'
                    ? (meaningObj[nativeLanguage] || meaningObj.en || content.prediction_text)
                    : content.prediction_text;
                let currentText = "";
                let charIndex = 0;
                const typeInterval = setInterval(() => {
                    if (charIndex < text.length) {
                        currentText += text[charIndex];
                        setInputText(currentText);
                        charIndex++;
                    } else {
                        clearInterval(typeInterval);
                    }
                }, 100);
            } else if (currentStep.phase === 'clickLow') {
                setConfidence('Low');
            } else if (currentStep.phase === 'clickMed') {
                setConfidence('Med');
            } else if (currentStep.phase === 'submitted') {
                setInputText("");
                setConfidence(null);
            } else if (currentStep.phase === 'idle') {
                // Ensure clear start
                setInputText("");
                setConfidence(null);
            }

            timer = setTimeout(() => {
                stepIndex++;
                if (stepIndex >= sequence.length) {
                    if (onComplete) {
                        onComplete();
                        return;
                    }
                    stepIndex = 0;
                }
                runStep();
            }, currentStep.delay + (currentStep.phase === 'typing' ? 500 : 0)); // Add time for typing
        };

        runStep();
        return () => clearTimeout(timer);
    }, []);

    // Cursor position logic
    let cursorX = 160;
    let cursorY = 150;
    let isClicking = false;

    // Helper for input typing position vs center
    // If clickInput targeted center, staying there is fine, but typing text appears from left.
    // Let's just stay at input target.

    switch (phase) {
        case 'idle': cursorX = targets.input.x + 100; cursorY = targets.input.y + 100; break;
        case 'moveInput': cursorX = targets.input.x; cursorY = targets.input.y; break;
        case 'clickInput': cursorX = targets.input.x; cursorY = targets.input.y; isClicking = true; break;
        case 'waitInput': cursorX = targets.input.x; cursorY = targets.input.y; break;
        case 'typing': cursorX = targets.input.x; cursorY = targets.input.y; break;
        case 'typed': cursorX = targets.input.x; cursorY = targets.input.y; break;
        case 'moveLow': cursorX = targets.low.x; cursorY = targets.low.y; break;
        case 'clickLow': cursorX = targets.low.x; cursorY = targets.low.y; isClicking = true; break;
        case 'moveMed': cursorX = targets.med.x; cursorY = targets.med.y; break;
        case 'clickMed': cursorX = targets.med.x; cursorY = targets.med.y; isClicking = true; break;
        case 'moveRegister': cursorX = targets.register.x; cursorY = targets.register.y; break;
        case 'clickRegister': cursorX = targets.register.x; cursorY = targets.register.y; isClicking = true; break;
        case 'submitted': cursorX = targets.register.x; cursorY = targets.register.y; break;
    }

    // Determine border color based on confidence
    const borderColor = confidence === 'High' ? "#10b981" : confidence === 'Med' ? "#f59e0b" : confidence === 'Low' ? "#ef4444" : "#ef4444"; // Default red

    return (
        <div style={{ ...CARD_STYLE, position: "relative", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div
                ref={cardRef}
                style={{
                    width: "100%",
                    maxWidth: "640px",
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "8px",
                    padding: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* Dynamic colored left bar overlay */}
                <motion.div
                    animate={{ background: borderColor }}
                    style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", borderRadius: "8px 0 0 8px" }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-fg, #111827)" }}>{content.drag_word}</span>
                    <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-subtle, #f9fafb)", borderRadius: "4px", padding: "2px" }}>
                        {['High', 'Med', 'Low'].map((level) => {
                            const levelKey = `confidence_${level.toLowerCase()}`;
                            // @ts-ignore
                            const label = t[levelKey] || level;
                            const isActive = confidence === level;
                            return (
                                <motion.span
                                    key={level}
                                    ref={el => { if (el) btnRefs.current[level] = el; }}
                                    animate={{
                                        backgroundColor: isActive ? (level === 'Low' ? "#ef4444" : level === 'Med' ? "#f59e0b" : "#10b981") : "transparent",
                                        color: isActive ? "#fff" : "var(--color-fg-muted, #6b7280)"
                                    }}
                                    style={{
                                        padding: "2px 6px",
                                        fontSize: "0.65rem",
                                        borderRadius: "2px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        cursor: "pointer"
                                    }}
                                >
                                    {label}
                                </motion.span>
                            );
                        })}
                    </div>
                </div>

                {/* Input Area */}
                <div
                    ref={inputRef}
                    style={{ fontSize: "0.95rem", minHeight: "1.5em", borderBottom: "1px solid var(--color-border-subtle, #f3f4f6)", paddingBottom: "4px", cursor: "text" }}
                >
                    {inputText ? (
                        <span style={{ color: "var(--color-fg, #111827)" }}>{inputText}</span>
                    ) : (
                        // Show placeholder only if NOT focused
                        !['waitInput', 'typing'].includes(phase) && (
                            <span style={{ color: "var(--color-fg-muted, #d1d5db)" }}>{t.tutorial_add_note_placeholder || "Add a note..."}</span>
                        )
                    )}
                    {/* Show caret during wait and typing */}
                    {['waitInput', 'typing'].includes(phase) && (
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            style={{ color: "var(--color-fg, #111827)", marginLeft: "1px" }}
                        >
                            |
                        </motion.span>
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", opacity: 0.7 }}>2026/1/15</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span
                            ref={registerRef}
                            style={{
                                background: "var(--color-fg, #1f2937)",
                                color: "var(--color-bg, #fff)",
                                borderRadius: "4px",
                                padding: "6px 16px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            {t.tutorial_register_button || "Register"}
                        </span>
                    </div>
                </div>

                {/* Cursor (Moved inside card) */}
                <motion.div
                    animate={{ x: cursorX, y: cursorY }}
                    transition={{ type: "spring", stiffness: 150, damping: 20 }}
                    style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 100 }}
                >
                    <Cursor clicking={isClicking} />
                </motion.div>
            </div>
        </div>
    );
}

// ============================================================
// 3. Tap to Explore Demo
// ============================================================
export function TapExploreDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
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
            () => { setPanelOpen(false); setHovered(false); setCursorPos({ x: -10, y: 50 }); if (onComplete) { onComplete(); } else { setStep(-1); } }
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
                    {content.tap_phrase.map((part: any, i: number) => (
                        <motion.span
                            key={i}
                            style={{
                                ...TOKEN_STYLE,
                                padding: "2px 6px",
                                borderRadius: "4px"
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
                        {/* Panel Header - Simple like real PC */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "16px"
                        }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-fg, #111827)" }}>{content.tap_target}</span>
                            <button
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--color-fg-muted, #6b7280)",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Area - Cards like real PC */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {content.explorer_examples && content.explorer_examples.map((ex: any, i: number) => {
                                const translation = typeof ex.translation === 'object'
                                    ? (ex.translation[nativeLanguage] || ex.translation.en || ex.translation)
                                    : ex.translation;
                                return (
                                    <div key={i} style={{
                                        background: "var(--color-surface, #fff)",
                                        border: "1px solid var(--color-border, #e5e7eb)",
                                        borderRadius: "var(--radius-md, 12px)",
                                        padding: "16px",
                                        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                            <div style={{ flex: 1, minWidth: 0, fontSize: "1.05rem", lineHeight: 1.5 }}>
                                                {ex.phrase.split(content.tap_target).map((part: string, idx: number, arr: string[]) => (
                                                    <React.Fragment key={idx}>
                                                        {part}
                                                        {idx < arr.length - 1 && <span style={{ color: "var(--color-accent, #3b82f6)" }}>{content.tap_target}</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <button style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "var(--color-fg-muted, #9ca3af)",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                cursor: "pointer",
                                                marginLeft: "8px"
                                            }}>
                                                <Volume2 size={18} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted, #6b7280)" }}>{translation}</div>
                                    </div>
                                );
                            })}
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
export function RangeExploreDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 100, y: 100 }); // Initial off-screen position
    const [clicking, setClicking] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [hovered, setHovered] = useState(false); // For selection highlight
    const [dragging, setDragging] = useState(false); // For ghost token
    const [dropped, setDropped] = useState(false); // To show result card

    useEffect(() => {
        const sequence = [
            { cmd: () => { setCursorPos({ x: -160, y: 40 }); setHovered(true); }, delay: 600 }, // Move to selection
            { cmd: () => { setClicking(true); }, delay: 300 }, // Click
            { cmd: () => { setClicking(false); setPanelOpen(true); }, delay: 1000 }, // Open Panel, Wait
            // Drag sequence while panel is open
            { cmd: () => { setCursorPos({ x: -160, y: 40 }); }, delay: 400 }, // Ensure cursor at selection for pickup
            { cmd: () => { setClicking(true); setDragging(true); }, delay: 300 }, // Pen down / Pickup
            { cmd: () => { setCursorPos({ x: -160, y: -130 }); }, delay: 800 }, // Drag to Drop Zone (Center aligned)
            { cmd: () => { setClicking(false); setDragging(false); setDropped(true); }, delay: 2000 }, // Drop & Show Result
            // Reset
            {
                cmd: () => {
                    setPanelOpen(false);
                    setHovered(false);
                    setDropped(false);
                    setCursorPos({ x: 100, y: 100 }); // Reset cursor off-screen
                    if (onComplete) {
                        onComplete();
                    } else {
                        setStep(0); // Loop
                    }
                }, delay: 100
            }
        ];

        let timer: NodeJS.Timeout;
        if (step < sequence.length) {
            sequence[step].cmd();

            if (step === 6 && onComplete) {
                onComplete();
                return;
            }

            timer = setTimeout(() => {
                setStep(s => s + 1);
            }, sequence[step].delay);
        }

        return () => clearTimeout(timer);
    }, [step]);

    const words = content.shift_words;
    const selection = content.shift_range; // "want to eat" or equivalent for language

    // Prediction Card Content (Reuse styles)
    const PredictionCard = (
        <motion.div
            initial={{ opacity: 0, scale: 0.4, y: 0, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{
                position: "absolute",
                zIndex: 50,
                width: "220px",
                top: "20px",
                left: "calc(50% - 160px)",
                transformOrigin: "top center",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                overflow: "hidden"
            }}
        >
            {/* Red left bar overlay */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", background: "#ef4444", borderRadius: "8px 0 0 8px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-fg, #111827)" }}>
                    {words.slice(selection[0], selection[1] + 1).join(" ")}
                </span>
                <div style={{ display: "flex", gap: "2px", background: "var(--color-bg-subtle, #f9fafb)", borderRadius: "4px", padding: "2px" }}>
                    <span style={{ padding: "2px 6px", fontSize: "0.65rem", color: "var(--color-fg-muted, #6b7280)", textTransform: "uppercase" }}>{t.confidence_high || "High"}</span>
                    <span style={{ padding: "2px 6px", fontSize: "0.65rem", color: "var(--color-fg-muted, #6b7280)", textTransform: "uppercase" }}>{t.confidence_med || "Med"}</span>
                    <span style={{ padding: "2px 6px", fontSize: "0.65rem", background: "#ef4444", color: "#fff", borderRadius: "2px", fontWeight: 600, textTransform: "uppercase" }}>{t.confidence_low || "Low"}</span>
                </div>
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--color-fg-muted, #6b7280)" }}>{t.tutorial_add_note_placeholder}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--color-border, #f3f4f6)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted, #6b7280)", opacity: 0.7 }}>2026/1/15</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-fg-muted, #6b7280)", opacity: 0.6 }}>
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span style={{ background: "var(--color-fg, #1f2937)", color: "var(--color-bg, #fff)", borderRadius: "4px", padding: "6px 16px", fontSize: "0.8rem", fontWeight: 600 }}>{t.tutorial_register_button}</span>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div style={{ ...CARD_STYLE, background: "var(--color-bg-sub, #f9fafb)", width: "100%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "340px", overflow: "hidden" }}>

            {/* Drop Zone */}
            <div style={{
                position: "absolute",
                top: "20px",
                left: "calc(50% - 160px)", // Visual center
                transform: "translateX(-50%)",
                border: "2px dashed var(--color-border, #e5e7eb)",
                borderRadius: "8px",
                padding: "8px 24px",
                color: "var(--color-fg-muted, #9ca3af)",
                fontSize: "0.9rem",
                background: dragging ? "rgba(59, 130, 246, 0.05)" : "transparent",
                borderColor: dragging ? "var(--color-accent, #3b82f6)" : "var(--color-border, #e5e7eb)",
                transition: "all 0.2s",
                opacity: dropped ? 0 : 1, // Hide drop zone after drop
                zIndex: 10
            }}>
                Drop words here
            </div>

            {/* Phrase Card */}
            <div style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                paddingRight: "320px",
                transform: "translateY(40px)"
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

                    {words.map((word: string, i: number) => {
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
                                    background: (isSelected && (hovered || panelOpen)) ? "rgba(234, 88, 12, 0.1)" : "transparent",
                                    opacity: (dragging && isSelected) ? 0.3 : 1
                                }}
                            >
                                {word}
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Ghost Token (Draggable) */}
            {dragging && (
                <motion.div
                    initial={{ x: -160, y: 40, scale: 1, opacity: 0 }}
                    animate={{
                        x: cursorPos.x,
                        y: cursorPos.y,
                        scale: 1.08,
                        rotate: -2,
                        opacity: 1,
                        boxShadow: "0 12px 24px rgba(0,0,0,0.2)"
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        pointerEvents: "none",
                        zIndex: 100,
                        background: "#fff",
                        border: "2px solid #ea580c",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "1.1rem",
                        fontFamily: "var(--font-display, inherit)",
                        color: "var(--color-fg, #111827)",
                        whiteSpace: "nowrap",
                        transform: "translate(-50%, -50%)" // Center the ghost token itself
                    }}
                >
                    {words.slice(selection[0], selection[1] + 1).join(" ")}
                </motion.div>
            )}

            {/* Dropped Result (Overlay) */}
            {dropped && PredictionCard}

            {/* Explorer Panel */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 40, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "320px" }}
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
                            padding: "20px",
                            zIndex: 20
                        }}
                    >
                        {/* Panel Header - Simple like real PC */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "16px"
                        }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-fg, #111827)" }}>{words.slice(selection[0], selection[1] + 1).join(" ")}</span>
                            <button
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--color-fg-muted, #6b7280)",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Area - Cards like real PC */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {(content.range_examples || []).map((ex: any, idx: number) => {
                                const translation = typeof ex.translation === 'object'
                                    ? (ex.translation[nativeLanguage] || ex.translation.en || Object.values(ex.translation)[0])
                                    : ex.translation;
                                const highlightText = ex.highlight || "";
                                const parts = ex.phrase.split(highlightText);
                                return (
                                    <div key={idx} style={{
                                        background: "var(--color-surface, #fff)",
                                        border: "1px solid var(--color-border, #e5e7eb)",
                                        borderRadius: "var(--radius-md, 12px)",
                                        padding: "16px",
                                        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                            <div style={{ flex: 1, minWidth: 0, fontSize: "1.05rem", lineHeight: 1.5 }}>
                                                {parts[0]}<span style={{ color: "var(--color-accent, #3b82f6)" }}>{highlightText}</span>{parts[1] || ""}
                                            </div>
                                            <button style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "var(--color-fg-muted, #9ca3af)",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                cursor: "pointer",
                                                marginLeft: "8px"
                                            }}>
                                                <Volume2 size={18} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted, #6b7280)" }}>{translation}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cursor */}
            <motion.div
                initial={false}
                animate={{
                    x: cursorPos.x,
                    y: cursorPos.y,
                    transition: { type: "spring", stiffness: 100, damping: 15 }
                }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    pointerEvents: "none",
                    zIndex: 200,
                    marginLeft: -12, // Center alignment offset (half width)
                    marginTop: -4   // Tip alignment
                }}
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
export function AudioPlayDemo({ onComplete }: { onComplete?: () => void }) {
    const { nativeLanguage, activeLanguageCode: learningLanguage } = useAppStore();
    const content = DEMO_CONTENT[learningLanguage as string] || DEMO_CONTENT.en;
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
            () => { setPlaying(false); setHovered(false); setCursorPos({ x: 40, y: 20 }); if (onComplete) { onComplete(); } else { setStep(-1); } }
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
    }, [step]);

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

// ============================================================
// C1. Correction Typing Demo - Matches InputNode UI
// ============================================================
export function CorrectionTypingDemo({ onComplete }: { onComplete?: () => void }) {
    const [typedText, setTypedText] = useState("");
    const fullText = "Yesterday I go park";

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
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "16px"
        }}>
            {/* Rounded Input Field (like InputNode) */}
            <div style={{
                width: "100%",
                maxWidth: "300px",
                padding: "12px 20px",
                borderRadius: "50px",
                border: "1px solid rgba(0,0,0,0.1)",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                fontSize: "0.95rem",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px"
            }}>
                <span style={{ color: typedText ? "inherit" : "var(--color-fg-muted, #999)" }}>
                    {typedText || "Yesterday I go to park..."}
                </span>
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{
                        display: "inline-block",
                        width: "2px",
                        height: "1em",
                        background: "var(--color-accent, #D94528)",
                        marginLeft: "1px"
                    }}
                />
            </div>

            {/* Connect Button */}
            <motion.div
                animate={{ opacity: typedText.length > 10 ? 1 : 0.3 }}
                style={{
                    padding: "8px 24px",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "var(--color-fg, #2D2D2D)"
                }}
            >
                Connect
            </motion.div>
        </div>
    );
}

// ============================================================
// C2. Correction Feedback Demo - Matches StreamCard UI with loading
// ============================================================
export function CorrectionFeedbackDemo({ onComplete }: { onComplete?: () => void }) {
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
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "8px" }}>
            {/* User input */}
            <div
                style={{
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #E0DDD5)",
                    borderRadius: "12px",
                    padding: "10px"
                }}
            >
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--color-fg-muted, #6B6862)", textTransform: "uppercase", marginBottom: "4px" }}>
                    YOUR ATTEMPT
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--color-fg, #2D2D2D)" }}>
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
                            background: "var(--color-surface, #fff)",
                            border: "1px solid var(--color-border, #E0DDD5)",
                            borderRadius: "12px",
                            padding: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            style={{ display: "flex", gap: "6px", alignItems: "center" }}
                        >
                            <span style={{ width: "8px", height: "8px", background: "var(--color-accent, #D94528)", borderRadius: "50%" }} />
                            <span style={{ width: "8px", height: "8px", background: "var(--color-accent, #D94528)", borderRadius: "50%" }} />
                            <span style={{ width: "8px", height: "8px", background: "var(--color-accent, #D94528)", borderRadius: "50%" }} />
                        </motion.div>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>AI が添削中...</span>
                    </motion.div>
                )}

                {showResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "var(--color-surface, #fff)",
                            border: "2px solid var(--color-accent, #D94528)",
                            borderRadius: "12px",
                            padding: "10px"
                        }}
                    >
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--color-accent, #D94528)", textTransform: "uppercase", marginBottom: "4px" }}>
                            BETTER PHRASING
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-fg, #2D2D2D)", marginBottom: "4px" }}>
                            Yesterday I <span style={{ color: "#10b981" }}>went to the</span> park
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted, #6B6862)" }}>
                            昨日、公園に行きました
                        </div>
                        {/* Diff */}
                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid var(--color-border, #E0DDD5)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, color: "var(--color-fg-muted)" }}>Diff:</span>
                            <span style={{ textDecoration: "line-through", color: "#ef4444", background: "rgba(255,0,0,0.1)", padding: "1px 3px", borderRadius: "2px" }}>go</span>
                            <span>→</span>
                            <span style={{ color: "#10b981", background: "rgba(0,255,0,0.1)", padding: "1px 3px", borderRadius: "2px" }}>went to the</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================
// C3. Correction Word Track Demo - あいまい → 添削結果 → はっきり
// ============================================================
export function CorrectionWordTrackDemo({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const delays = [1200, 1400, 1400, 1200];
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
        <div style={{ padding: "12px" }}>
            {/* Three stages in a row */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>

                {/* Stage 1: あいまい */}
                <div style={{
                    flex: 1,
                    minWidth: "90px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    padding: "8px",
                    border: "1px dashed #ccc",
                    opacity: showCorrection ? 0.5 : 1,
                    transition: "opacity 0.3s"
                }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#999", textAlign: "center", marginBottom: "4px" }}>
                        🌫️ あいまい
                    </div>
                    <div style={{
                        background: "#fff",
                        border: "1px dashed #ddd",
                        borderRadius: "4px",
                        padding: "5px 6px",
                        fontSize: "0.65rem"
                    }}>
                        <div style={{ color: "#999", display: "flex", alignItems: "center", gap: "2px" }}>
                            ramen<span style={{ fontSize: "0.5rem" }}>?</span>
                        </div>
                        <div style={{ fontSize: "0.5rem", color: "#bbb" }}>ラーメン</div>
                    </div>
                </div>

                {/* Arrow 1 */}
                <motion.div
                    animate={showCorrection && !showVerified ? { scale: [1, 1.2, 1], color: ["#ccc", "#f59e0b", "#ccc"] } : {}}
                    transition={{ duration: 0.5, repeat: showCorrection && !showVerified ? Infinity : 0 }}
                    style={{ color: showCorrection ? "#f59e0b" : "#ddd", fontSize: "1rem" }}
                >
                    →
                </motion.div>

                {/* Stage 2: 添削結果 */}
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{
                            opacity: showCorrection ? 1 : 0.3,
                            scale: showCorrection && !showVerified ? [1, 1.02, 1] : 1
                        }}
                        transition={{ duration: 0.5, repeat: showCorrection && !showVerified ? Infinity : 0 }}
                        style={{
                            flex: 1,
                            minWidth: "100px",
                            background: showCorrection ? "#fffbeb" : "#fafafa",
                            borderRadius: "8px",
                            padding: "8px",
                            border: showCorrection ? "2px solid #f59e0b" : "1px dashed #ddd",
                            boxShadow: showCorrection ? "0 2px 8px rgba(245, 158, 11, 0.2)" : "none",
                            transition: "all 0.3s"
                        }}
                    >
                        <div style={{ fontSize: "0.5rem", fontWeight: 700, color: showCorrection ? "#d97706" : "#bbb", textAlign: "center", marginBottom: "4px" }}>
                            📝 添削結果
                        </div>
                        {showCorrection && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    background: "#fff",
                                    border: "1px solid #fcd34d",
                                    borderRadius: "4px",
                                    padding: "5px 6px",
                                    fontSize: "0.65rem"
                                }}
                            >
                                <div style={{ color: "#92400e", fontWeight: 600 }}>ramen</div>
                                <div style={{ fontSize: "0.5rem", color: "#b45309" }}>使用確認 ✓</div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Arrow 2 */}
                <motion.div
                    animate={showVerified && !isComplete ? { scale: [1, 1.2, 1], color: ["#ccc", "#10b981", "#ccc"] } : {}}
                    transition={{ duration: 0.5, repeat: showVerified && !isComplete ? Infinity : 0 }}
                    style={{ color: showVerified ? "#10b981" : "#ddd", fontSize: "1rem" }}
                >
                    →
                </motion.div>

                {/* Stage 3: はっきり */}
                <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{
                        opacity: showVerified ? 1 : 0.3,
                        scale: isComplete ? 1.02 : 1
                    }}
                    style={{
                        flex: 1,
                        minWidth: "90px",
                        background: isComplete ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "#fafafa",
                        borderRadius: "8px",
                        padding: "8px",
                        border: isComplete ? "2px solid #10b981" : "1px dashed #ddd",
                        boxShadow: isComplete ? "0 3px 10px rgba(16, 185, 129, 0.25)" : "none",
                        transition: "all 0.4s"
                    }}
                >
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: isComplete ? "#059669" : "#bbb", textAlign: "center", marginBottom: "4px" }}>
                        ✨ はっきり
                    </div>
                    {isComplete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: "#fff",
                                border: "2px solid #10b981",
                                borderRadius: "4px",
                                padding: "5px 6px",
                                fontSize: "0.65rem"
                            }}
                        >
                            <div style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                                ramen<span style={{ fontSize: "0.8rem" }}>✓</span>
                            </div>
                            <div style={{ fontSize: "0.5rem", color: "#047857" }}>記憶定着</div>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Result message */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "linear-gradient(90deg, #fef3c7, #fde68a)",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            fontSize: "0.6rem",
                            color: "#92400e",
                            textAlign: "center",
                            fontWeight: 600
                        }}
                    >
                        🎯 添削で使用 → 記憶が定着！
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}





// ============================================================
// C4. Correction Loop Demo - Shows iterative learning
// ============================================================
export function CorrectionLoopDemo({ onComplete }: { onComplete?: () => void }) {
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIdx(prev => {
                const next = (prev + 1) % 4;
                if (next === 0 && onComplete) {
                    setTimeout(onComplete, 500);
                }
                return next;
            });
        }, 800);

        return () => clearInterval(timer);
    }, [onComplete]);

    const steps = [
        { icon: "✍️", label: "書く", color: "#6366f1" },
        { icon: "📝", label: "添削", color: "#f59e0b" },
        { icon: "💡", label: "気づく", color: "#10b981" },
        { icon: "🔁", label: "定着", color: "#3b82f6" }
    ];

    return (
        <div style={{ ...CARD_STYLE, position: "relative", padding: "24px" }}>
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px"
            }}>
                {steps.map((step, i) => (
                    <React.Fragment key={i}>
                        <motion.div
                            animate={{
                                scale: activeIdx === i ? 1.15 : 1,
                                opacity: activeIdx === i ? 1 : 0.5
                            }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <motion.div
                                animate={{
                                    background: activeIdx === i ? step.color : "#e5e7eb",
                                    boxShadow: activeIdx === i ? `0 4px 12px ${step.color}40` : "none"
                                }}
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.4rem"
                                }}
                            >
                                {step.icon}
                            </motion.div>
                            <span style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: activeIdx === i ? step.color : "#9ca3af"
                            }}>
                                {step.label}
                            </span>
                        </motion.div>
                        {i < steps.length - 1 && (
                            <motion.div
                                animate={{
                                    opacity: activeIdx === i ? 1 : 0.3,
                                    scale: activeIdx === i ? 1.2 : 1
                                }}
                                style={{
                                    color: "#d1d5db",
                                    fontSize: "0.8rem"
                                }}
                            >
                                →
                            </motion.div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// C5. Correction Sidebar Demo - Shows memo sidebar on PC
// ============================================================
export function CorrectionSidebarDemo({ onComplete }: { onComplete?: () => void }) {
    const [typedText, setTypedText] = useState("");
    const fullText = "I want to eat ramen";

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

    // Highlight "ramen" when it's being typed
    const highlightRamen = typedText.includes("ramen");

    return (
        <div style={{ display: "flex", gap: "8px", padding: "8px" }}>
            {/* Sidebar - always visible */}
            <div
                style={{
                    width: "130px",
                    background: "var(--color-bg-sub, #f9f8f4)",
                    border: "1px solid var(--color-border, #E0DDD5)",
                    borderRadius: "8px",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                }}
            >
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--color-fg-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                    📝 意識メモ
                </div>

                {/* Memo 1 - Highlight when matched */}
                <motion.div
                    animate={{
                        background: highlightRamen ? "#fef3c7" : "#fff",
                        borderColor: highlightRamen ? "#fcd34d" : "var(--color-border, #E0DDD5)"
                    }}
                    style={{
                        background: "#fff",
                        border: "1px solid var(--color-border, #E0DDD5)",
                        borderRadius: "6px",
                        padding: "6px 8px",
                        fontSize: "0.7rem"
                    }}
                >
                    <div style={{ fontWeight: 600, color: highlightRamen ? "#d97706" : "var(--color-fg)" }}>ramen</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--color-fg-muted)" }}>ラーメン</div>
                </motion.div>

                {/* Memo 2 */}
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid var(--color-border, #E0DDD5)",
                        borderRadius: "6px",
                        padding: "6px 8px",
                        fontSize: "0.7rem"
                    }}
                >
                    <div style={{ fontWeight: 600, color: "var(--color-fg)" }}>delicious</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--color-fg-muted)" }}>美味しい</div>
                </div>
            </div>

            {/* Main area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Input with typing animation */}
                <div style={{
                    padding: "8px 12px",
                    borderRadius: "20px",
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "rgba(255,255,255,0.9)",
                    fontSize: "0.75rem",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <span>{typedText}</span>
                    <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        style={{
                            display: "inline-block",
                            width: "2px",
                            height: "1em",
                            background: "var(--color-accent, #D94528)",
                            marginLeft: "2px"
                        }}
                    />
                </div>

                {/* Hint */}
                <div style={{
                    textAlign: "center",
                    fontSize: "0.6rem",
                    color: "var(--color-fg-muted)",
                    padding: "4px"
                }}>
                    ← メモを見ながら文章を作成
                </div>
            </div>
        </div>
    );
}
