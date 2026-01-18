"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { CATEGORIES, PHRASES, GENDER_SUPPORTED_LANGUAGES, PARENT_CATEGORIES, getParentCategoryId } from "@/lib/data";
import { translations } from "@/lib/translations";
import PhraseCard from "@/components/PhraseCard";
import CategoryTabs from "@/components/CategoryTabs";
import AwarenessPanel from "@/components/AwarenessPanel";
import AwarenessMemoPanel from "@/components/AwarenessMemoPanel";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import MemoDropZone from "@/components/MemoDropZone";
import { motion } from "framer-motion";
import { useExplorer } from "@/hooks/use-explorer";
import Link from "next/link";
import { Settings, Languages } from "lucide-react";
import styles from "./phrases.module.css";
import clsx from "clsx";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { BookOpen, Smartphone, Info } from "lucide-react";
import { ShiftClickDemo, DragDropDemo, TapExploreDemo, AudioPlayDemo, RangeExploreDemo, ComparePhrasesDemo, InferMeaningDemo, PredictionMemoDemo } from "@/components/AnimatedTutorialDemos";
import { MobileSlideSelectDemo, MobileDragDropDemo, MobileTapExploreDemo, MobilePredictionMemoDemo, MobileAudioPlayDemo } from "@/components/MobileTutorialDemos";

const PHRASES_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "フレーズ一覧へようこそ！",
        description: "ここでは、ネイティブの自然な表現を音声付きで学べます。まず、気になるフレーズを見つけましょう。",
        icon: <BookOpen size={48} style={{ color: "var(--color-accent)" }} />
    },
    {
        title: "複数フレーズを比較しよう",
        description: "同じ単語を含むフレーズを見比べて、共通のパターンを見つけましょう。",
        icon: <ComparePhrasesDemo />,
        waitForAnimation: true
    },
    {
        title: "文脈から意味を推測",
        description: "共通の単語が、日本語訳のどの部分に相当するか推測してみましょう。「eat」は「食べる」という意味かな？",
        icon: <InferMeaningDemo />,
        waitForAnimation: true
    },
    {
        title: "単語をタップして探索",
        description: "フレーズ内の各単語をタップすると「Explorer」パネルが開き、その単語を使った他の例文が表示されます。さらに材料を増やして意味を推測したいときに使えます。",
        icon: <TapExploreDemo />,
        waitForAnimation: true
    },
    {
        title: "ドラッグ＆ドロップでメモ",
        description: "気になった単語は、上部の「Drop words here」エリアへドラッグして保存できます。保存した単語は全ページでハイライト表示されます。",
        icon: <DragDropDemo />,
        waitForAnimation: true
    },
    {
        title: "予想と確信度を記録",
        description: "推測した意味をメモに残し、その時点での確信度（自信）を選択しましょう。後で振り返ったときに成長を実感できます。",
        icon: <PredictionMemoDemo />,
        waitForAnimation: true
    },
    {
        title: "Shift+クリックで範囲選択",
        description: "熟語やフレーズの一部を保存したい場合は、Shiftキーを押しながら最初の単語をクリックし、そのままShiftを押したままで最後の単語をクリックすると範囲選択・保存できます。",
        icon: <ShiftClickDemo />,
        waitForAnimation: true
    },
    {
        title: "選択範囲を探索・保存",
        description: "複数単語を選択してクリックで探索できるほか、そのままドラッグ＆ドロップすることで、フレーズ単位で「気づきメモ」を残すこともできます。",
        icon: <RangeExploreDemo />,
        waitForAnimation: true
    },
    {
        title: "音声を聞いてみよう",
        description: "各カードの再生ボタンで、高品質な音声合成によるネイティブ発音を確認できます。何度も聞いてリズムを身につけましょう！",
        icon: <AudioPlayDemo />,
        waitForAnimation: true
    }
];

const MOBILE_PHRASES_TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "スマホ版フレーズ学習",
        description: "スマートフォン向けの操作方法をご紹介します。タッチ操作で直感的に学習できます。",
        icon: <Smartphone size={48} style={{ color: "var(--color-accent)" }} />
    },
    {
        title: "複数フレーズを比較しよう",
        description: "同じ単語を含むフレーズを見比べて、共通のパターンを見つけましょう。",
        icon: <ComparePhrasesDemo />,
        waitForAnimation: true
    },
    {
        title: "文脈から意味を推測",
        description: "共通の単語が、日本語訳のどの部分に相当するか推測してみましょう。",
        icon: <InferMeaningDemo />,
        waitForAnimation: true
    },
    {
        title: "タップで辞書を表示",
        description: "単語をタップするとExplorerパネルが開き、その単語を使った他の例文が表示されます。",
        icon: <MobileTapExploreDemo />,
        waitForAnimation: true
    },
    {
        title: "長押しでドラッグ＆ドロップ",
        description: "単語を長押しするとドラッグモードになります。そのまま上部のDropゾーンへ移動して指を離すとメモに登録できます。",
        icon: <MobileDragDropDemo />,
        waitForAnimation: true
    },
    {
        title: "予想と確信度を記録",
        description: "推測した意味をメモに残し、確信度を選択しましょう。後で振り返ったときに成長を実感できます。",
        icon: <MobilePredictionMemoDemo />,
        waitForAnimation: true
    },
    {
        title: "スライドで範囲選択",
        description: "複数選択モードをONにして、指でスライドすると連続した単語を選択できます。",
        icon: <MobileSlideSelectDemo />,
        waitForAnimation: true
    },
    {
        title: "音声を聞いてみよう",
        description: "再生ボタンでネイティブ発音を確認できます。何度も聞いてリズムを身につけましょう！",
        icon: <MobileAudioPlayDemo />,
        waitForAnimation: true
    }
];

export default function PhrasesPage() {
    const { activeLanguageCode, user, nativeLanguage, showPinyin, togglePinyin, speakingGender, setSpeakingGender } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode, clearSelection } = useAwarenessStore();
    const { drawerState, closeExplorer } = useExplorer();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [tutorialKey, setTutorialKey] = useState(0);
    const [mobileTutorialKey, setMobileTutorialKey] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleShowTutorial = () => {
        if (isMobile) {
            localStorage.removeItem("poly-lang-page-tutorial-phrases-mobile-v1");
            setMobileTutorialKey(k => k + 1);
        } else {
            localStorage.removeItem("poly-lang-page-tutorial-phrases-v1");
            setTutorialKey(k => k + 1);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMemos(user.id, activeLanguageCode);
        }
        return () => {
            clearSelection();
        };
    }, [user, activeLanguageCode, fetchMemos, clearSelection]);

    // Localize categories (use PARENT_CATEGORIES for broader grouping)
    const t = translations[nativeLanguage] || translations.ja;
    const localizedCategories = PARENT_CATEGORIES.map(cat => ({
        ...cat,
        name: (t as any)[cat.id] || cat.name
    }));

    const phrases = PHRASES.filter(p => p.translations?.[activeLanguageCode]);

    const filteredPhrases = selectedCategory === "all"
        ? phrases
        : phrases.filter(p => getParentCategoryId(p.categoryId) === selectedCategory);

    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;

    return (
        <div className={clsx(styles.container, isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed)}>
            {/* Left Area */}
            <div className={styles.leftArea}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h1 className={styles.title}>{t.phrases}</h1>
                                {/* Tutorial Button */}
                                <button
                                    onClick={handleShowTutorial}
                                    title="使い方"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "30px", // Slightly smaller to fit header
                                        height: "30px",
                                        background: "transparent",
                                        color: "var(--color-fg-muted, #6b7280)",
                                        border: "1px solid var(--color-border, #e5e7eb)",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <Info size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right side settings - Anchored to right */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <CategoryTabs
                            categories={localizedCategories}
                            selectedCategoryId={selectedCategory}
                            onSelect={setSelectedCategory}
                            allLabel={t.all}
                        />

                        {/* Pinyin Toggle Button - Only show for Chinese */}
                        {activeLanguageCode === "zh" && (
                            <button
                                onClick={togglePinyin}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 12px",
                                    borderRadius: "var(--radius-md)",
                                    border: showPinyin ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                                    background: showPinyin ? "var(--color-accent-subtle)" : "var(--color-surface)",
                                    color: showPinyin ? "var(--color-accent)" : "var(--color-fg-muted)",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    transition: "all 0.2s"
                                }}
                                title={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
                            >
                                <Languages size={18} />
                                <span>拼音</span>
                            </button>
                        )}

                        {/* Gender Toggle */}
                        {GENDER_SUPPORTED_LANGUAGES.includes(activeLanguageCode) && (
                            <div style={{
                                display: "flex",
                                background: "var(--color-surface-hover)",
                                borderRadius: "var(--radius-sm)",
                                padding: "2px",
                                gap: "2px"
                            }}>
                                <button
                                    onClick={() => setSpeakingGender("male")}
                                    style={{
                                        border: "none",
                                        background: speakingGender === "male" ? "var(--color-surface)" : "transparent",
                                        color: speakingGender === "male" ? "var(--color-fg)" : "var(--color-fg-muted)",
                                        padding: "4px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        boxShadow: speakingGender === "male" ? "var(--shadow-sm)" : "none",
                                        fontWeight: speakingGender === "male" ? 700 : 400,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Man
                                </button>
                                <button
                                    onClick={() => setSpeakingGender("female")}
                                    style={{
                                        border: "none",
                                        background: speakingGender === "female" ? "var(--color-surface)" : "transparent",
                                        color: speakingGender === "female" ? "var(--color-fg)" : "var(--color-fg-muted)",
                                        padding: "4px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        boxShadow: speakingGender === "female" ? "var(--shadow-sm)" : "none",
                                        fontWeight: speakingGender === "female" ? 700 : 400,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Woman
                                </button>
                            </div>
                        )}

                        <div className={styles.desktopOnly}>
                            <MemoDropZone />
                        </div>
                    </div>
                </div>

                <div className={styles.mobileOnly} style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "16px", position: "relative", zIndex: 20 }}>
                    <div style={{ width: "100%", maxWidth: "340px" }}>
                        <MemoDropZone expandedLayout={true} />
                    </div>
                </div>

                <motion.div
                    layout
                    className={clsx(styles.grid, isPanelOpen ? styles.gridOpen : styles.gridClosed)}
                >
                    {filteredPhrases.length > 0 ? (
                        filteredPhrases.map((phrase) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={`${phrase.id}-${selectedCategory}`}
                            >
                                <PhraseCard phrase={phrase} />
                            </motion.div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            No phrases found for this category.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Right Panel: Explorer Side Panel Only (Memo Overlay Removed) */}
            {isPanelOpen && (
                <>
                    {/* Overlay for mobile */}
                    <div className={styles.overlay} onClick={() => closeExplorer()} />

                    <div className={styles.rightPanel}>
                        <ExplorerSidePanel />
                    </div>
                </>
            )}

            {/* Page Tutorial - PC */}
            <PageTutorial key={tutorialKey} pageId="phrases" steps={PHRASES_TUTORIAL_STEPS} />
            {/* Page Tutorial - Mobile */}
            <PageTutorial key={`mobile-${mobileTutorialKey}`} pageId="phrases-mobile" steps={MOBILE_PHRASES_TUTORIAL_STEPS} />
        </div>
    );
}
