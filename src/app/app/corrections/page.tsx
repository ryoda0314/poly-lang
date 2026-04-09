"use client";

import React, { useEffect, useState } from "react";
import StreamLayout from "@/components/stream/StreamLayout";
import StreamCanvas from "@/components/stream/StreamCanvas";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { translations } from "@/lib/translations";

import { CorrectionSidebar } from "@/components/stream/CorrectionSidebar";
import styles from "./page.module.css";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { CorrectionTypingDemo, CorrectionFeedbackDemo, CorrectionWordTrackDemo, CorrectionSidebarDemo } from "@/components/AnimatedTutorialDemos";
import { MobileCorrectionTypingDemo, MobileCorrectionFeedbackDemo, MobileCorrectionWordTrackDemo, MobileCorrectionMemoButtonDemo } from "@/components/MobileTutorialDemos";
import { BookOpen, Copy, Volume2, Bookmark, Sparkles } from "lucide-react";




export default function CorrectionPage() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { fetchMemos } = useAwarenessStore();
    const [isMobile, setIsMobile] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        // Mobile detection
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        setIsLayoutReady(true);
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (user?.id && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user?.id, activeLanguageCode, fetchMemos]);

    const t: any = translations[nativeLanguage] || translations.ja;

    // PC版チュートリアルステップ
    const PC_TUTORIAL_STEPS: TutorialStep[] = [
        {
            title: t.corrections_tutorial_intro_title,
            description: t.corrections_tutorial_intro_desc,
            icon: <CorrectionTypingDemo />,
            waitForAnimation: true
        },
        {
            title: t.corrections_tutorial_casualness_title,
            description: t.corrections_tutorial_casualness_desc,
            icon: (
                <div style={{
                    display: "flex",
                    gap: "0",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "25px",
                    padding: "8px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    justifyContent: "center",
                    width: "fit-content",
                    margin: "0 auto"
                }}>
                    <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>Casual</div>
                    <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.9rem", color: "#fff", background: "var(--color-accent, #D94528)", fontWeight: 600 }}>Normal</div>
                    <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>Formal</div>
                </div>
            ),
            waitForAnimation: false
        },
        {
            title: t.corrections_tutorial_sidebar_title,
            description: t.corrections_tutorial_sidebar_desc,
            icon: <CorrectionSidebarDemo />,
            waitForAnimation: true
        },
        {
            title: t.corrections_tutorial_feedback_title,
            description: t.corrections_tutorial_feedback_desc,
            icon: <CorrectionFeedbackDemo />,
            waitForAnimation: true
        },
        {
            title: t.corrections_tutorial_actions_title,
            description: t.corrections_tutorial_actions_desc,
            icon: (
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', textAlign: 'left', background: 'var(--color-bg-sub)', padding: '20px', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--color-fg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> {t.copy}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Volume2 size={20} /> {t.play}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={20} /> {t.save}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} /> {t.explain}</div>
                </div>
            ),
            waitForAnimation: false
        },
        {
            title: t.corrections_tutorial_track_title,
            description: t.corrections_tutorial_track_desc,
            icon: <CorrectionWordTrackDemo />,
            waitForAnimation: true
        }
    ];

    // モバイル版チュートリアルステップ
    const MOBILE_TUTORIAL_STEPS: TutorialStep[] = [
        {
            title: t.corrections_tutorial_intro_title,
            description: t.corrections_tutorial_intro_desc,
            icon: <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Sparkles size={80} color="var(--color-accent, #D94528)" /></div>,
            waitForAnimation: false
        },
        {
            title: t.corrections_tutorial_casualness_title,
            description: t.corrections_tutorial_casualness_desc,
            icon: (
                <div style={{
                    display: "flex",
                    gap: "0",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "25px",
                    padding: "8px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    justifyContent: "center",
                    width: "fit-content",
                    margin: "0 auto"
                }}>
                    <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>Casual</div>
                    <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.8rem", color: "#fff", background: "var(--color-accent, #D94528)", fontWeight: 600 }}>Normal</div>
                    <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>Formal</div>
                </div>
            ),
            waitForAnimation: false
        },
        {
            title: t.corrections_mobile_memo_title,
            description: t.corrections_mobile_memo_desc,
            icon: <MobileCorrectionMemoButtonDemo />,
            waitForAnimation: true
        },
        {
            title: t.corrections_mobile_typing_title,
            description: t.corrections_mobile_typing_desc,
            icon: <MobileCorrectionTypingDemo />,
            waitForAnimation: true
        },
        {
            title: t.corrections_tutorial_feedback_title,
            description: t.corrections_tutorial_feedback_desc,
            icon: <MobileCorrectionFeedbackDemo />,
            waitForAnimation: true
        },
        {
            title: t.corrections_tutorial_actions_title,
            description: t.corrections_tutorial_actions_desc,
            icon: (
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', textAlign: 'left', background: 'var(--color-bg-sub)', padding: '20px', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--color-fg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> {t.copy}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Volume2 size={20} /> {t.play}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={20} /> {t.save}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} /> {t.explain}</div>
                </div>
            ),
            waitForAnimation: false
        },
        {
            title: t.corrections_tutorial_track_title,
            description: t.corrections_tutorial_track_desc,
            icon: <MobileCorrectionWordTrackDemo />,
            waitForAnimation: true
        }
    ];

    const tutorialSteps = isMobile ? MOBILE_TUTORIAL_STEPS : PC_TUTORIAL_STEPS;

    return (
        <StreamLayout leftSidebar={<CorrectionSidebar />}>
            <StreamCanvas />

            {/* Page Tutorial - only render after layout detection */}
            {isLayoutReady && <PageTutorial pageId="corrections" steps={tutorialSteps} />}
        </StreamLayout>
    );
}
