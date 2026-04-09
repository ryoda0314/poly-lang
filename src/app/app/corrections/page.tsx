"use client";

import React, { useEffect } from "react";
import StreamLayout from "@/components/stream/StreamLayout";
import StreamCanvas from "@/components/stream/StreamCanvas";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { translations } from "@/lib/translations";

import { CorrectionSidebar } from "@/components/stream/CorrectionSidebar";
import styles from "./page.module.css";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { MessageSquare, CheckCircle, Sparkles, RotateCcw } from "lucide-react";

const CORRECTIONS_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "AI添削ストリームへようこそ！",
        description: "ここでは、あなたの作文をAIがリアルタイムで添削します。学習言語でメッセージを入力してみましょう。",
        icon: <MessageSquare size={48} style={{ color: "var(--color-accent)" }} />
    },
    {
        title: "AIからのフィードバック",
        description: "AIが文法ミスや不自然な表現を指摘し、より良い言い回しを提案します。「CASUAL」「FORMAL」などのタグで、場面に合った表現も学べます。",
        icon: <Sparkles size={48} style={{ color: "#f59e0b" }} />
    },
    {
        title: "単語を使うと自動記録",
        description: "もし「Phrases」でメモした単語を使おうとすると、自動的にその使用が記録され、「意識」の強化につながります。",
        icon: <CheckCircle size={48} style={{ color: "#10b981" }} />
    },
    {
        title: "繰り返し学習",
        description: "AIと何度もやり取りし、フィードバックを受けながら自然な表現が身についていきます。さあ、始めましょう！",
        icon: <RotateCcw size={48} style={{ color: "#3b82f6" }} />
    }
];

export default function CorrectionPage() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { fetchMemos } = useAwarenessStore();

    useEffect(() => {
        if (user?.id && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user?.id, activeLanguageCode, fetchMemos]);

    const t = translations[nativeLanguage] || translations.ja;

    return (
        <StreamLayout leftSidebar={<CorrectionSidebar />}>
            <div className={styles.headerContainer}>
                <h2 className={styles.headerTitle}>{t.aiCorrectionStream}</h2>
                <div className={styles.headerBeta}>beta</div>
            </div>

            <StreamCanvas />

            {/* Page Tutorial */}
            <PageTutorial pageId="corrections" steps={CORRECTIONS_TUTORIAL_STEPS} />
        </StreamLayout>
    );
}
