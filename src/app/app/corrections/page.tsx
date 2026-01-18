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
import { BookOpen, Copy, Volume2, Bookmark, Sparkles, Info } from "lucide-react";

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
        description: "相手や場面に合わせて、3つのレベルから口調を選べます。\n\n・カジュアル：親しい友人向け (タメ口)\n・普通：一般的な会話 (です・ます)\n・フォーマル：ビジネス・目上の人向け (敬語)",
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
                <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>カジュアル</div>
                <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.9rem", color: "#fff", background: "var(--color-accent, #D94528)", fontWeight: 600 }}>普通</div>
                <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>フォーマル</div>
            </div>
        ),
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
        title: "便利なアクション機能",
        description: "アイコンボタンを使って、コピー・再生・保存・解説の機能が利用できます。",
        icon: (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', textAlign: 'left', background: 'var(--color-bg-sub)', padding: '20px', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--color-fg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> コピー</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Volume2 size={20} /> 再生</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={20} /> 保存</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} /> 解説</div>
            </div>
        ),
        waitForAnimation: false
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
        icon: <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Sparkles size={80} color="var(--color-accent, #D94528)" /></div>,
        waitForAnimation: false
    },
    {
        title: "カジュアル度を選択",
        description: "相手や場面に合わせて、3つのレベルから口調を選べます。\n\n・カジュアル：親しい友人向け (タメ口)\n・普通：一般的な会話 (です・ます)\n・フォーマル：ビジネス・目上の人向け (敬語)",
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
                <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>カジュアル</div>
                <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.8rem", color: "#fff", background: "var(--color-accent, #D94528)", fontWeight: 600 }}>普通</div>
                <div style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>フォーマル</div>
            </div>
        ),
        waitForAnimation: false
    },
    {
        title: "メモを確認する",
        description: "右下のメモボタンをタップすると、サイドバーが開いて気付きメモを確認できます。",
        icon: <MobileCorrectionMemoButtonDemo />,
        waitForAnimation: true
    },
    {
        title: "文章を入力",
        description: "入力欄に学習言語で文章を入力し、送信ボタンを押して添削を開始します。",
        icon: <MobileCorrectionTypingDemo />,
        waitForAnimation: true
    },
    {
        title: "添削フィードバック",
        description: "選択したカジュアル度に応じて、文法ミスや不自然な表現を指摘し、より良い言い回しを提案します。",
        icon: <MobileCorrectionFeedbackDemo />,
        waitForAnimation: true
    },
    {
        title: "便利なアクション機能",
        description: "アイコンボタンを使って、コピー・再生・保存・解説の機能が利用できます。",
        icon: (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', textAlign: 'left', background: 'var(--color-bg-sub)', padding: '20px', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--color-fg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> コピー</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Volume2 size={20} /> 再生</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={20} /> 保存</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} /> 解説</div>
            </div>
        ),
        waitForAnimation: false
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
                    title="使い方"
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        background: "transparent",
                        color: "var(--color-fg-muted, #6b7280)",
                        border: "1px solid var(--color-border, #e5e7eb)",
                        borderRadius: "50%",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    <Info size={20} />
                </button>
            </div>

            <StreamCanvas />

            {/* Page Tutorial */}
            <PageTutorial key={tutorialKey} pageId="corrections" steps={tutorialSteps} />
        </StreamLayout>
    );
}
