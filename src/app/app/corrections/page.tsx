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
import { BookOpen } from "lucide-react";

// PC版チュートリアルステップ
const PC_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "AI添削ストリームへようこそ！",
        description: "ここでは、あなたの作文をAIがリアルタイムで添削します。学習言語でメッセージを入力してみましょう。",
        icon: <CorrectionTypingDemo />,
        waitForAnimation: true
    },
    {
        title: "カジュアル度を選択",
        description: "「カジュアル」「普通」「フォーマル」から選べます。友達との会話ならカジュアル、ビジネスならフォーマルなど、場面に合わせた添削を受けられます。",
        icon: <div style={{ fontSize: "2.5rem", textAlign: "center" }}>🎚️</div>,
        waitForAnimation: false
    },
    {
        title: "メモを確認しながら添削",
        description: "PC版では、左サイドバーに「意識メモ」が表示されます。覚えたい単語を確認しながら文章を作成できます。",
        icon: <CorrectionSidebarDemo />,
        waitForAnimation: true
    },
    {
        title: "AIからのフィードバック",
        description: "AIが文法ミスや不自然な表現を指摘し、より良い言い回しを提案します。選択したカジュアル度に応じた表現で添削されます。",
        icon: <CorrectionFeedbackDemo />,
        waitForAnimation: true
    },
    {
        title: "単語を使うと自動記録",
        description: "もし「Phrases」でメモした単語を使おうとすると、自動的にその使用が記録され、「意識」の強化につながります。さあ、始めましょう！",
        icon: <CorrectionWordTrackDemo />,
        waitForAnimation: true
    }
];

// モバイル版チュートリアルステップ
const MOBILE_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "AI添削へようこそ！",
        description: "学習言語でメッセージを入力すると、AIがリアルタイムで添削します。",
        icon: <MobileCorrectionTypingDemo />,
        waitForAnimation: true
    },
    {
        title: "カジュアル度を選択",
        description: "入力欄の上で「カジュアル/普通/フォーマル」を選べます。場面に合わせた添削を受けられます。",
        icon: <div style={{ fontSize: "2rem", textAlign: "center" }}>🎚️</div>,
        waitForAnimation: false
    },
    {
        title: "メモを確認する",
        description: "右下のメモボタンをタップすると、サイドバーが開いて気付きメモを確認できます。",
        icon: <MobileCorrectionMemoButtonDemo />,
        waitForAnimation: true
    },
    {
        title: "添削フィードバック",
        description: "選択したカジュアル度に応じて、文法ミスや不自然な表現を指摘し、より良い言い回しを提案します。",
        icon: <MobileCorrectionFeedbackDemo />,
        waitForAnimation: true
    },
    {
        title: "メモと連携した学習",
        description: "「Phrases」でメモした単語を添削で使うと、自動で記録され、記憶が定着していきます。さあ、始めましょう！",
        icon: <MobileCorrectionWordTrackDemo />,
        waitForAnimation: true
    }
];


export default function CorrectionPage() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { fetchMemos } = useAwarenessStore();
    const [tutorialKey, setTutorialKey] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Mobile detection
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (user?.id && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user?.id, activeLanguageCode, fetchMemos]);

    const handleShowTutorial = () => {
        localStorage.removeItem("poly-lang-page-tutorial-corrections-v1");
        setTutorialKey(k => k + 1);
        setShowTutorial(true);
    };

    const t = translations[nativeLanguage] || translations.ja;
    const tutorialSteps = isMobile ? MOBILE_TUTORIAL_STEPS : PC_TUTORIAL_STEPS;

    return (
        <StreamLayout leftSidebar={<CorrectionSidebar />}>
            <div className={styles.headerContainer}>
                <h2 className={styles.headerTitle}>{t.aiCorrectionStream}</h2>
                <div className={styles.headerBeta}>beta</div>
                <button
                    onClick={handleShowTutorial}
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        background: "var(--color-accent, #D94528)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    <BookOpen size={14} />
                    Tutorial
                </button>
            </div>

            <StreamCanvas />

            {/* Page Tutorial */}
            <PageTutorial key={tutorialKey} pageId="corrections" steps={tutorialSteps} />
        </StreamLayout>
    );
}
