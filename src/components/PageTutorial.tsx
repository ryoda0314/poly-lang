"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";

export interface TutorialStep {
    title: string;
    description: string;
    icon?: React.ReactNode;
    waitForAnimation?: boolean;
}

interface PageTutorialProps {
    pageId: string; // Unique ID for localStorage key
    steps: TutorialStep[];
    onComplete?: () => void;
}

export default function PageTutorial({ pageId, steps, onComplete }: PageTutorialProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [canAdvance, setCanAdvance] = useState(true);
    const { logEvent } = useHistoryStore();

    useEffect(() => {
        setCanAdvance(!steps[currentStep].waitForAnimation);
    }, [currentStep, steps]);

    const storageKey = `poly-lang-page-tutorial-${pageId}-v1`;

    useEffect(() => {
        const hasSeen = localStorage.getItem(storageKey);
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, [storageKey]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(storageKey, "true");
        logEvent(TRACKING_EVENTS.TUTORIAL_COMPLETE, 50, { page_id: pageId }); // Bonus XP for tutorial?
        onComplete?.();
    };

    if (!isOpen || steps.length === 0) return null;

    const step = steps[currentStep];

    return (
        <AnimatePresence>
            <div style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(3px)"
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    style={{
                        background: "var(--color-surface, #fff)",
                        width: "90%",
                        maxWidth: "760px",
                        borderRadius: "24px",
                        padding: "40px",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    {/* Progress */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "var(--color-bg-sub, #f3f4f6)", borderRadius: "24px 24px 0 0", overflow: "hidden" }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
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
                            color: "var(--color-fg-muted, #6b7280)",
                            padding: "8px"
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "12px" }}>
                        {step.icon && (
                            <motion.div
                                key={currentStep + "-icon"}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{
                                    marginBottom: "32px",
                                    width: "100%",
                                    maxWidth: "600px",
                                    maxHeight: "350px",
                                    overflow: "hidden",
                                    display: "flex",
                                    justifyContent: "center",
                                    borderRadius: "12px"
                                }}
                            >
                                {React.isValidElement(step.icon)
                                    ? React.cloneElement(step.icon as React.ReactElement, { onComplete: () => setCanAdvance(true) } as any)
                                    : step.icon}
                            </motion.div>
                        )}


                        <motion.h3
                            key={currentStep + "-title"}
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "16px", color: "var(--color-fg, #111827)" }}
                        >
                            {step.title}
                        </motion.h3>

                        <motion.p
                            key={currentStep + "-desc"}
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--color-fg-muted, #4b5563)", marginBottom: "32px", maxWidth: "580px", whiteSpace: "pre-line" }}
                        >
                            {step.description}
                        </motion.p>

                        <div style={{ display: "flex", gap: "16px" }}>
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "var(--color-bg-sub, #f3f4f6)",
                                        color: "var(--color-fg, #111827)",
                                        border: "none",
                                        padding: "12px 24px",
                                        borderRadius: "12px",
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    <ChevronLeft size={20} /> Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={!canAdvance}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: canAdvance ? "var(--color-fg, #111827)" : "var(--color-border, #e5e7eb)",
                                    color: canAdvance ? "var(--color-bg, #fff)" : "var(--color-fg-muted, #9ca3af)",
                                    border: "none",
                                    padding: "12px 32px",
                                    borderRadius: "12px",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    cursor: canAdvance ? "pointer" : "not-allowed",
                                    boxShadow: canAdvance ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                                    transition: "all 0.2s"
                                }}
                            >
                                {currentStep === steps.length - 1 ? "Got it!" : "Next"}
                                {currentStep < steps.length - 1 && <ChevronRight size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Dots */}
                    <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "8px" }}>
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    background: i === currentStep ? "var(--color-accent, #3b82f6)" : "var(--color-border, #e5e7eb)",
                                    transition: "all 0.3s"
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
