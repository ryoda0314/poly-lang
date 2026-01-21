"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Search, MousePointerClick, MessageSquarePlus, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";



export default function AppTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.ja;

    const TUTORIAL_STEPS = [
        {
            id: "intro",
            title: t.app_tutorial_intro_title,
            description: t.app_tutorial_intro_desc,
            icon: <div className="text-4xl">👋</div>
        },
        {
            id: "input",
            title: t.app_tutorial_input_title,
            description: t.app_tutorial_input_desc,
            icon: <BookOpen size={48} className="text-blue-500" />
        },
        {
            id: "explorer",
            title: t.app_tutorial_explore_title,
            description: t.app_tutorial_explore_desc,
            icon: <Search size={48} className="text-purple-500" />
        },
        {
            id: "awareness",
            title: t.app_tutorial_awareness_title,
            description: t.app_tutorial_awareness_desc,
            icon: <MousePointerClick size={48} className="text-orange-500" />
        },
        {
            id: "output",
            title: t.app_tutorial_output_title,
            description: t.app_tutorial_output_desc,
            icon: <MessageSquarePlus size={48} className="text-green-500" />
        }
    ];

    useEffect(() => {
        // Simple check to see if we should show tutorial
        // In a real app, this might check a user preference or database flag
        const hasSeenTutorial = localStorage.getItem("poly-lang-tutorial-seen-v1");
        if (!hasSeenTutorial) {
            setIsOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("poly-lang-tutorial-seen-v1", "true");
    };

    if (!isOpen) return null;

    const step = TUTORIAL_STEPS[currentStep];

    return (
        <AnimatePresence>
            <div style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)"
            }}>
                <motion.div
                    key={nativeLanguage} // Remount on language change
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        background: "var(--color-surface, #fff)",
                        width: "90%",
                        maxWidth: "500px",
                        borderRadius: "24px",
                        padding: "32px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    {/* Progress Bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--color-bg-sub, #f3f4f6)" }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                            style={{ height: "100%", background: "var(--color-accent, #3b82f6)" }}
                        />
                    </div>

                    <button
                        onClick={handleClose}
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-fg-muted, #6b7280)"
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "16px" }}>
                        <motion.div
                            key={step.id + "-icon"}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            style={{ marginBottom: "24px", height: "80px", display: "flex", alignItems: "center" }}
                        >
                            {step.icon}
                        </motion.div>

                        <motion.h2
                            key={step.id + "-title"}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "16px", color: "var(--color-fg, #111827)" }}
                        >
                            {step.title}
                        </motion.h2>

                        <motion.p
                            key={step.id + "-desc"}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--color-fg-muted, #4b5563)", marginBottom: "32px" }}
                        >
                            {step.description}
                        </motion.p>

                        <button
                            onClick={handleNext}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "var(--color-fg, #111827)",
                                color: "var(--color-bg, #fff)",
                                border: "none",
                                padding: "12px 32px",
                                borderRadius: "12px",
                                fontSize: "1rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {currentStep === TUTORIAL_STEPS.length - 1 ? (t.startLearning || "Start Learning") : (t.nextBtn || "Next")}
                            {currentStep < TUTORIAL_STEPS.length - 1 && <ChevronRight size={18} />}
                        </button>
                    </div>

                    <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "8px" }}>
                        {TUTORIAL_STEPS.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: i === currentStep ? "var(--color-accent, #3b82f6)" : "var(--color-border, #e5e7eb)",
                                    transition: "background 0.3s"
                                }}
                            />
                        ))}
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}

