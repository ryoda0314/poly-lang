"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, Mic, Brain, Check } from 'lucide-react';
import styles from './OnboardingModal.module.css';
import { useAppStore } from '@/store/app-context';
import { translations } from '@/lib/translations';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    {
        key: 'welcome',
        icon: Sparkles,
        titleKey: 'onboarding_welcome_title',
        descKey: 'onboarding_welcome_desc',
    },
    {
        key: 'phrases',
        icon: BookOpen,
        titleKey: 'onboarding_phrases_title',
        descKey: 'onboarding_phrases_desc',
    },
    {
        key: 'pronunciation',
        icon: Mic,
        titleKey: 'onboarding_pronunciation_title',
        descKey: 'onboarding_pronunciation_desc',
    },
    {
        key: 'awareness',
        icon: Brain,
        titleKey: 'onboarding_awareness_title',
        descKey: 'onboarding_awareness_desc',
    },
    {
        key: 'ready',
        icon: Check,
        titleKey: 'onboarding_ready_title',
        descKey: 'onboarding_ready_desc',
    },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen) return null;

    const Icon = step.icon;

    return (
        <div className={styles.overlay}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
                {/* Skip Button */}
                <button className={styles.skipBtn} onClick={handleSkip}>
                    <X size={20} />
                </button>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.iconWrapper}>
                        <Icon size={48} />
                    </div>

                    <h2 className={styles.title}>
                        {(t as any)[step.titleKey] || step.titleKey}
                    </h2>

                    <p className={styles.description}>
                        {(t as any)[step.descKey] || step.descKey}
                    </p>
                </div>

                {/* Progress Dots */}
                <div className={styles.dots}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''}`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className={styles.nav}>
                    <button
                        className={styles.navBtnSecondary}
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                    >
                        <ChevronLeft size={18} />
                        {(t as any).back || '戻る'}
                    </button>

                    <button className={styles.navBtnPrimary} onClick={handleNext}>
                        {isLastStep ? ((t as any).start || '始める') : ((t as any).nextBtn || '次へ')}
                        {!isLastStep && <ChevronRight size={18} />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
