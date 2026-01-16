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
import { CorrectionTypingDemo, CorrectionFeedbackDemo, CorrectionWordTrackDemo, CorrectionLoopDemo, CorrectionSidebarDemo } from "@/components/AnimatedTutorialDemos";
import { BookOpen } from "lucide-react";

const CORRECTIONS_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "AI添削ストリームへようこそ！",
        description: "ここでは、あなたの作文をAIがリアルタイムで添削します。学習言語でメッセージを入力してみましょう。",
        icon: <CorrectionTypingDemo />,
        waitForAnimation: true
    },
    {
        title: "メモを確認しながら添削",
        description: "PC版では、左サイドバーに「意識メモ」が表示されます。覚えたい単語を確認しながら文章を作成できます。",
        icon: <CorrectionSidebarDemo />,
        waitForAnimation: true
    },
    {
        title: "AIからのフィードバック",
        description: "AIが文法ミスや不自然な表現を指摘し、より良い言い回しを提案します。「CASUAL」「FORMAL」などのタグで、場面に合った表現も学べます。",
        icon: <CorrectionFeedbackDemo />,
        waitForAnimation: true
    },
    {
        title: "単語を使うと自動記録",
        description: "もし「Phrases」でメモした単語を使おうとすると、自動的にその使用が記録され、「意識」の強化につながります。",
        icon: <CorrectionWordTrackDemo />,
        waitForAnimation: true
    },
    {
        title: "繰り返し学習",
        description: "AIと何度もやり取りし、フィードバックを受けながら自然な表現が身についていきます。さあ、始めましょう！",
        icon: <CorrectionLoopDemo />,
        waitForAnimation: true
    }
];

export default function CorrectionPage() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { fetchMemos } = useAwarenessStore();
    const [tutorialKey, setTutorialKey] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

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
            <PageTutorial key={tutorialKey} pageId="corrections" steps={CORRECTIONS_TUTORIAL_STEPS} />
        </StreamLayout>
    );
}
