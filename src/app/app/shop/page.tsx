"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./shop.module.css";
import {
    Coins, Check, FolderHeart, Volume2, Compass, ImagePlus,
    PenTool, Gauge, Mic, Crown, Zap, BookOpen, X, Layers, MessageCircle,
    GitBranch, AlignLeft, Languages, Hash, MessageSquare, Quote, List, Braces, Puzzle, Pencil,
    GraduationCap, Headphones
} from "lucide-react";
import clsx from "clsx";
import { purchaseShopItem } from "./actions";
import ShopProductModal, { ShopItem } from "./ShopProductModal";
import SubscriptionCard, { SubscriptionPlan } from "./SubscriptionCard";
import SinglePurchaseCard, { SinglePurchaseItem } from "./SinglePurchaseCard";

// ── Subscription Plans ──
function getSubscriptionPlans(t: any): SubscriptionPlan[] {
    return [
        // 会話強化プラン ¥980/月
        // singleTotal = 日額×30日×単品単価: speaking(1000)+pronunciation(600)+chat(600)+audio(450)+correction(300)+expression(600)
        {
            id: "conversation",
            name: t.planConversation || "会話強化",
            price: 980,
            priceLabel: t.perMonth || "/月",
            icon: <MessageCircle size={16} />,
            color: "#8b5cf6",
            singleTotal: 3550,
            features: [
                { label: t.planConvSpeaking || "会話 10回", highlight: true },
                { label: t.planConvPronunciation || "発音 20回 / 音声 15回", highlight: true },
                { label: t.planConvChat || "チャット 10回" },
                { label: t.planConvOther || "添削 5回 / 表現 10回" },
            ],
        },
        // アウトプット強化プラン ¥980/月
        // singleTotal = correction(600)+chat(600)+speaking(800)+expression(600)+pronunciation(450)
        {
            id: "output",
            name: t.planOutput || "アウトプット強化",
            price: 980,
            priceLabel: t.perMonth || "/月",
            icon: <PenTool size={16} />,
            color: "#3b82f6",
            singleTotal: 3050,
            features: [
                { label: t.planOutCorrection || "添削 10回 / チャット 10回", highlight: true },
                { label: t.planOutSpeaking || "会話 8回 / 発音 15回", highlight: true },
                { label: t.planOutExpression || "表現 10回" },
            ],
        },
        // インプット強化プラン ¥1,480/月
        // singleTotal = audio(900)+explorer(900)+extraction(600)+explanation(3000)+vocab(450)+expression(600)+grammar(600)
        {
            id: "input",
            name: t.planInput || "インプット強化",
            price: 1480,
            priceLabel: t.perMonth || "/月",
            icon: <Headphones size={16} />,
            color: "#10b981",
            singleTotal: 7050,
            features: [
                { label: t.planInAudio || "音声 30回 / 解析 30回", highlight: true },
                { label: t.planInExplanation || "解説 20回 / 表現 10回", highlight: true },
                { label: t.planInGrammar || "文法 10回 / 語彙 15回" },
                { label: t.planInExtract || "画像抽出 3回" },
            ],
        },
        // 受験対策プラン ¥1,480/月
        // singleTotal = explanation(750)+vocab(450)+sentence(3000)+etymology(750)+correction(300)+audio(300)
        {
            id: "exam",
            name: t.planExam || "受験対策",
            price: 1480,
            priceLabel: t.perMonth || "/月",
            badge: t.student || "学生向け",
            icon: <GraduationCap size={16} />,
            color: "#f59e0b",
            singleTotal: 5550,
            features: [
                { label: t.planExamSentence || "文分析 5回 / 解説 5回", highlight: true },
                { label: t.planExamVocab || "語彙 15回 / 語源 3回", highlight: true },
                { label: t.planExamCorrection || "添削 5回" },
                { label: t.planExamAudio || "音声 10回" },
            ],
        },
        // Proプラン ¥2,980/月 — 全機能
        // singleTotal = audio(900)+pronunciation(750)+explorer(900)+explanation(1500)+expression(900)+ipa(900)
        //   +vocab(450)+grammar(900)+extension(450)+correction(600)+chat(900)+sentence(3000)
        //   +speaking(1200)+extraction(600)+etymology(1250)
        {
            id: "pro",
            name: t.planPro || "Pro",
            price: 2980,
            priceLabel: t.perMonth || "/月",
            badge: t.allFeatures || "全機能",
            icon: <Crown size={16} />,
            color: "#e11d48",
            singleTotal: 15200,
            features: [
                { label: t.planProCore || "音声/解析/発音 25〜30回", highlight: true },
                { label: t.planProAi || "チャット15/添削10/文分析5回", highlight: true },
                { label: t.planProSpeaking || "会話12回 / 画像抽出3回" },
                { label: t.planProOther || "語源5/表現15/語彙他15回" },
            ],
        },
    ];
}

// ── Single Purchase Items (grouped by learning purpose) ──
interface SinglePurchaseGroup {
    id: string;
    label: string;
    color: string;
    items: SinglePurchaseItem[];
}

function getSinglePurchaseGroups(t: any): SinglePurchaseGroup[] {
    return [
        {
            id: "input",
            label: t.singleGroupInput || "学ぶ（インプット）",
            color: "#3b82f6",
            items: [
                { id: "single_audio", name: t.singleAudio || "音声再生", description: t.singleAudioDesc || "フレーズを音声で聴く", icon: <Volume2 size={14} />, price: 1, usesPerHundred: 100, color: "#3b82f6", category: "core" },
                { id: "single_explorer", name: t.singleExplorer || "単語解析", description: t.singleExplorerDesc || "意味・用法を調査", icon: <Compass size={14} />, price: 1, usesPerHundred: 100, color: "#10b981", category: "core" },
                { id: "single_explanation", name: t.singleExplanation || "文法解説", description: t.singleExplanationDesc || "文法で詳しく解説", icon: <BookOpen size={14} />, price: 5, usesPerHundred: 20, color: "#ef4444", category: "grammar" },
                { id: "single_expression", name: t.singleExpression || "表現翻訳", description: t.singleExpressionDesc || "例文・翻訳を生成", icon: <Quote size={14} />, price: 2, usesPerHundred: 50, color: "#f472b6", category: "core" },
                { id: "single_grammar", name: t.singleGrammar || "文法パターン", description: t.singleGrammarDesc || "文法パターン分析", icon: <Braces size={14} />, price: 2, usesPerHundred: 50, color: "#a3e635", category: "grammar" },
                { id: "single_vocab", name: t.singleVocab || "語彙生成", description: t.singleVocabDesc || "語彙リストを生成", icon: <List size={14} />, price: 1, usesPerHundred: 100, color: "#84cc16", category: "tool" },
                { id: "single_sentence", name: t.singleSentence || "文分析", description: t.singleSentenceDesc || "文構造を分析", icon: <AlignLeft size={14} />, price: 20, usesPerHundred: 5, color: "#059669", category: "grammar" },
                { id: "single_extract", name: t.singleExtract || "画像抽出", description: t.singleExtractDesc || "画像からフレーズ抽出", icon: <ImagePlus size={14} />, price: 7, usesPerHundred: 15, color: "#f97316", category: "tool" },
            ],
        },
        {
            id: "output",
            label: t.singleGroupOutput || "使う（アウトプット）",
            color: "#10b981",
            items: [
                { id: "single_correction", name: t.singleCorrection || "添削", description: t.singleCorrectionDesc || "文章をAI添削", icon: <PenTool size={14} />, price: 2, usesPerHundred: 50, color: "#8b5cf6", category: "core" },
                { id: "single_chat", name: t.singleChat || "AIチャット", description: t.singleChatDesc || "AIと会話練習", icon: <MessageSquare size={14} />, price: 2, usesPerHundred: 50, color: "#2563eb", category: "core" },
                { id: "single_pronunciation", name: t.singlePronunciation || "発音評価", description: t.singlePronunciationDesc || "発音をAI採点", icon: <Mic size={14} />, price: 1, usesPerHundred: 100, color: "#06b6d4", category: "core" },
                { id: "single_speaking", name: t.singleSpeaking || "会話練習", description: t.singleSpeakingDesc || "自由発話スピーキング", icon: <MessageCircle size={14} />, price: 3, usesPerHundred: 30, color: "#a855f7", category: "core" },
            ],
        },
        {
            id: "reference",
            label: t.singleGroupRef || "辞書・ツール",
            color: "#8b5cf6",
            items: [
                { id: "single_etymology", name: t.singleEtymology || "語源", description: t.singleEtymologyDesc || "語源・由来を解説", icon: <GitBranch size={14} />, price: 8, usesPerHundred: 12, color: "#b45309", category: "tool" },
                { id: "single_ipa", name: t.singleIpa || "IPA記号", description: t.singleIpaDesc || "発音記号を表示", icon: <Languages size={14} />, price: 1, usesPerHundred: 100, color: "#0ea5e9", category: "tool" },
                { id: "single_kanji_hanja", name: t.singleKanjiHanja || "漢字・韓字", description: t.singleKanjiHanjaDesc || "読み・意味を調査", icon: <Hash size={14} />, price: 1, usesPerHundred: 100, color: "#dc2626", category: "tool" },
                { id: "single_script", name: t.singleScript || "文字練習", description: t.singleScriptDesc || "書き方を練習", icon: <Pencil size={14} />, price: 1, usesPerHundred: 100, color: "#78716c", category: "tool" },
                { id: "single_extension", name: t.singleExtension || "拡張機能", description: t.singleExtensionDesc || "ブラウザ拡張連携", icon: <Puzzle size={14} />, price: 1, usesPerHundred: 100, color: "#7c3aed", category: "tool" },
            ],
        },
    ];
}

// ── Coin Packs (Stripe one-time payment → coins) ──
const COIN_PACKS = [
    { id: 'coin_500', coins: 500, priceYen: 500, bonus: 0 },
    { id: 'coin_1100', coins: 1100, priceYen: 1000, bonus: 10 },
    { id: 'coin_3600', coins: 3600, priceYen: 3000, bonus: 20 },
    { id: 'coin_6500', coins: 6500, priceYen: 5000, bonus: 30 },
];

// ── Coin Shop Items (existing premium features) ──
const FEATURES: ShopItem[] = [
    {
        id: "phrase_collections",
        translationKeyTitle: "shop_phraseCollections_title",
        translationKeyDesc: "shop_phraseCollections_desc",
        translationKeyLongDesc: "shop_phraseCollections_longDesc",
        icon: <FolderHeart size={16} />,
        cost: 500,
        color: "#ec4899",
    },
    {
        id: "audio_premium",
        translationKeyTitle: "shop_audioPremium_title",
        translationKeyDesc: "shop_audioPremium_desc",
        translationKeyLongDesc: "shop_audioPremium_longDesc",
        icon: <Mic size={16} />,
        cost: 300,
        color: "#06b6d4",
    },
    {
        id: "study_set_creator",
        translationKeyTitle: "shop_studySetCreator_title",
        translationKeyDesc: "shop_studySetCreator_desc",
        translationKeyLongDesc: "shop_studySetCreator_longDesc",
        icon: <Layers size={16} />,
        cost: 300,
        color: "#14b8a6",
    },
];

function CoinItemCard({ item, isPurchased, onClick, t }: {
    item: ShopItem;
    isPurchased: boolean;
    onClick: () => void;
    t: any;
}) {
    return (
        <div
            className={clsx(styles.itemCard, isPurchased && styles.itemCardPurchased)}
            onClick={onClick}
            style={{ "--accent-color": item.color } as React.CSSProperties}
        >
            <div className={styles.cardTop}>
                <div
                    className={styles.iconContainer}
                    style={{ color: item.color, background: `${item.color}18` }}
                >
                    {item.icon}
                </div>
                <h3 className={styles.itemName}>
                    {(t as any)[item.translationKeyTitle] || item.translationKeyTitle}
                </h3>
            </div>
            <p className={styles.itemDesc}>
                {(t as any)[item.translationKeyDesc] || item.translationKeyDesc}
            </p>
            <div className={styles.cardFooter}>
                <div className={styles.cardPrice}>
                    <Coins size={12} className={styles.coinIcon} />
                    <span>{item.cost}</span>
                </div>
                {isPurchased && (
                    <div className={styles.purchasedBadge}>
                        <Check size={10} />
                        {t.purchased}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Free Plan Limits Display ──
function FreePlanCard({ t }: { t: any }) {
    const limits = [
        { label: "音声 / 解析", value: "5", unit: t.perDay || "回/日", icon: <Volume2 size={14} />, color: "#3b82f6" },
        { label: "添削", value: "2", unit: t.perDay || "回/日", icon: <PenTool size={14} />, color: "#8b5cf6" },
        { label: "解説", value: "1", unit: t.perDay || "回/日", icon: <BookOpen size={14} />, color: "#ef4444" },
    ];

    return (
        <div className={styles.freePlanCard}>
            <div className={styles.freePlanHeader}>
                <div className={styles.freePlanIcon}>
                    <Zap size={14} />
                </div>
                <div className={styles.freePlanTitleGroup}>
                    <span className={styles.freePlanLabel}>{t.currentPlan || "現在のプラン"}</span>
                    <span className={styles.freePlanName}>{t.freePlan || "無料プラン"}</span>
                </div>
            </div>
            <div className={styles.freePlanLimits}>
                {limits.map((limit, i) => (
                    <div key={i} className={styles.freePlanLimitItem}>
                        <div className={styles.freePlanLimitIcon} style={{ color: limit.color, background: `${limit.color}15` }}>
                            {limit.icon}
                        </div>
                        <div className={styles.freePlanLimitContent}>
                            <div className={styles.freePlanLimitLabel}>{limit.label}</div>
                            <div className={styles.freePlanLimitValue}>
                                <span className={styles.freePlanLimitNumber}>{limit.value}</span>
                                <span className={styles.freePlanLimitUnit}>{limit.unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CoinPackCard({ pack, onPurchase, isLoading, t }: {
    pack: typeof COIN_PACKS[number];
    onPurchase: (packId: string) => void;
    isLoading: boolean;
    t: any;
}) {
    return (
        <div className={styles.coinPackCard}>
            <div className={styles.coinPackCoins}>
                <Coins size={18} />
                <span className={styles.coinPackAmount}>{pack.coins.toLocaleString()}</span>
            </div>
            {pack.bonus > 0 && (
                <span className={styles.coinPackBonus}>+{pack.bonus}%</span>
            )}
            <div className={styles.coinPackPrice}>
                ¥{pack.priceYen.toLocaleString()}
            </div>
            <button
                className={styles.coinPackButton}
                onClick={() => onPurchase(pack.id)}
                disabled={isLoading}
            >
                {t.purchase || "購入する"}
            </button>
        </div>
    );
}

export default function ShopPage() {
    const { nativeLanguage, profile, refreshProfile } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const balance = profile?.coins || 0;
    const currentPlan = profile?.subscription_plan || "free";
    const purchasedItems = (profile?.settings as any)?.inventory || [];

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [activeTab, setActiveTab] = useState<"subscription" | "single" | "premium">("subscription");
    const [showCoinModal, setShowCoinModal] = useState(false);
    const [confirmItem, setConfirmItem] = useState<SinglePurchaseItem | null>(null);
    const [purchaseResult, setPurchaseResult] = useState<{ name: string; creditsAdded: number } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    }, []);

    const subscriptionPlans = getSubscriptionPlans(t);
    const singlePurchaseGroups = getSinglePurchaseGroups(t);

    // Mark current plan
    const plansWithCurrent = subscriptionPlans.map(p => ({
        ...p,
        isCurrent: p.id === currentPlan,
    }));

    const handleSubscribe = async (planId: string) => {
        setIsRedirecting(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'subscription', planId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error ?? 'エラーが発生しました');
                setIsRedirecting(false);
            }
        } catch {
            alert('エラーが発生しました');
            setIsRedirecting(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsRedirecting(true);
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error ?? 'エラーが発生しました');
                setIsRedirecting(false);
            }
        } catch {
            alert('エラーが発生しました');
            setIsRedirecting(false);
        }
    };

    const handleCoinPackPurchase = async (packId: string) => {
        setIsRedirecting(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'coin_pack', packId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error ?? 'エラーが発生しました');
                setIsRedirecting(false);
            }
        } catch {
            alert('エラーが発生しました');
            setIsRedirecting(false);
        }
    };

    const handleCreditPurchase = (itemId: string) => {
        const allItems = singlePurchaseGroups.flatMap(g => g.items);
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;
        if (balance < 100) {
            alert(t.insufficientCoins || "コインが足りません");
            return;
        }
        setConfirmItem(item);
    };

    const confirmCreditPurchase = async () => {
        if (!confirmItem) return;
        const cost = 100;
        setIsPurchasing(true);
        try {
            const result = await purchaseShopItem(confirmItem.id, cost);
            if (result.success) {
                setPurchaseResult({ name: confirmItem.name, creditsAdded: result.creditsAdded || confirmItem.usesPerHundred });
                setConfirmItem(null);
                await refreshProfile();
                if (toastTimer.current) clearTimeout(toastTimer.current);
                toastTimer.current = setTimeout(() => setPurchaseResult(null), 2500);
            } else {
                alert(result.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleFeaturePurchase = async (item: ShopItem) => {
        const canPurchase = item.isConsumable || !purchasedItems.includes(item.id);
        if (balance >= item.cost && canPurchase) {
            setIsPurchasing(true);
            try {
                const result = await purchaseShopItem(item.id, item.cost);
                if (result.success) {
                    await refreshProfile();
                } else {
                    alert(result.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsPurchasing(false);
            }
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>{t.shopTitle}</h1>
                    <p className={styles.subtitle}>{t.shopPricingDesc || "プランを選んでもっと学ぼう"}</p>
                </div>
                <button className={styles.balanceCard} onClick={() => setShowCoinModal(true)}>
                    <Coins size={18} className={styles.coinIcon} />
                    <div>
                        <div className={styles.balanceAmount}>{balance.toLocaleString()}</div>
                        <div className={styles.balanceLabel}>{t.coins || "コイン"}</div>
                    </div>
                </button>
            </div>


            {/* ── Tabs ── */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "subscription" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("subscription")}
                >
                    {t.subscriptionPlans || "サブスク"}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "single" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("single")}
                >
                    {t.singlePurchase || "単品購入"}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "premium" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("premium")}
                >
                    {t.shopFeatures || "プレミアム"}
                </button>
            </div>

            {/* ── Subscription Plans ── */}
            {activeTab === "subscription" && (
                <div className={styles.section}>
                    <p className={styles.sectionDesc}>
                        {t.subscriptionDesc || "月額プランで毎日お得に使い放題"}
                    </p>
                    <div className={styles.subGrid}>
                        {plansWithCurrent.map((plan) => (
                            <SubscriptionCard
                                key={plan.id}
                                plan={plan}
                                onSubscribe={handleSubscribe}
                                onManage={handleManageSubscription}
                                isLoading={isRedirecting}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Single Purchase (コイン消費) ── */}
            {activeTab === "single" && (
                <div className={styles.section}>
                    <p className={styles.sectionDesc}>
                        {(t as any).singlePurchaseDesc || "コインで回数を追加購入"}
                    </p>
                    {singlePurchaseGroups.map((group) => (
                        <div key={group.id} className={styles.singleGroup}>
                            <div className={styles.singleGroupHeader}>
                                <span className={styles.singleGroupDot} style={{ background: group.color }} />
                                <span className={styles.singleGroupLabel}>{group.label}</span>
                            </div>
                            <div className={styles.singleGrid}>
                                {group.items.map((item: SinglePurchaseItem) => (
                                    <SinglePurchaseCard
                                        key={item.id}
                                        item={item}
                                        onPurchase={handleCreditPurchase}
                                        isLoading={isPurchasing}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Coin Shop (Premium Features) ── */}
            {activeTab === "premium" && (
                <div className={styles.section}>
                    <p className={styles.sectionDesc}>
                        {t.coinShopDesc || "コインで機能をアンロック"}
                    </p>
                    <div className={styles.grid}>
                        {FEATURES.map((item) => {
                            const isPurchased = purchasedItems.includes(item.id);
                            return (
                                <CoinItemCard
                                    key={item.id}
                                    item={item}
                                    isPurchased={isPurchased}
                                    onClick={() => setSelectedItem(item)}
                                    t={t}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Coin Pack Modal ── */}
            {showCoinModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCoinModal(false)}>
                    <div className={styles.coinModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.coinModalHeader}>
                            <h3>{(t as any).coinPurchase || "コイン購入"}</h3>
                            <button className={styles.coinModalClose} onClick={() => setShowCoinModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.coinPackGrid}>
                            {COIN_PACKS.map((pack) => (
                                <CoinPackCard
                                    key={pack.id}
                                    pack={pack}
                                    onPurchase={handleCoinPackPurchase}
                                    isLoading={isRedirecting}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Credit Purchase Confirm Modal ── */}
            {confirmItem && (
                <div className={styles.modalOverlay} onClick={() => setConfirmItem(null)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon} style={{ background: `${confirmItem.color}15`, color: confirmItem.color }}>
                            {confirmItem.icon}
                        </div>
                        <h3 className={styles.confirmTitle}>{confirmItem.name}</h3>
                        <p className={styles.confirmDesc}>
                            {confirmItem.usesPerHundred}{t.uses || "回"}{(t as any).confirmCreditsFor || "分を"}
                            <span className={styles.confirmCost}>
                                <Coins size={12} className={styles.coinIcon} /> 100
                            </span>
                            {(t as any).confirmPurchaseWith || "で購入しますか？"}
                        </p>
                        <div className={styles.confirmBalance}>
                            {(t as any).currentBalance || "残高"}: <Coins size={11} className={styles.coinIcon} /> {balance.toLocaleString()}
                            <span className={styles.confirmAfter}>
                                → {(balance - 100).toLocaleString()}
                            </span>
                        </div>
                        <div className={styles.confirmButtons}>
                            <button
                                className={styles.confirmCancel}
                                onClick={() => setConfirmItem(null)}
                                disabled={isPurchasing}
                            >
                                {t.cancel || "キャンセル"}
                            </button>
                            <button
                                className={styles.confirmBuy}
                                style={{ background: confirmItem.color }}
                                onClick={confirmCreditPurchase}
                                disabled={isPurchasing}
                            >
                                {isPurchasing ? ((t as any).purchasing || "購入中...") : ((t as any).confirmPurchase || "購入する")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Purchase Success Toast ── */}
            {purchaseResult && (
                <div className={styles.successToast}>
                    <Check size={16} className={styles.successIcon} />
                    <span>
                        {purchaseResult.name} +{purchaseResult.creditsAdded}{t.uses || "回"}
                    </span>
                </div>
            )}

            {/* Product Detail Modal (for coin shop) */}
            <ShopProductModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onPurchase={handleFeaturePurchase}
                isPurchasing={isPurchasing}
                balance={balance}
                isPurchased={selectedItem ? purchasedItems.includes(selectedItem.id) : false}
                t={t}
            />
        </div>
    );
}
