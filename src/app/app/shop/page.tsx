"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./shop.module.css";
import {
    Coins, Check, FolderHeart, Volume2, Compass, ImagePlus,
    PenTool, Gauge, Mic, Crown, Zap, BookOpen, X, Layers
} from "lucide-react";
import clsx from "clsx";
import { purchaseShopItem } from "./actions";
import ShopProductModal, { ShopItem } from "./ShopProductModal";
import SubscriptionCard, { SubscriptionPlan } from "./SubscriptionCard";
import SinglePurchaseCard, { SinglePurchaseItem } from "./SinglePurchaseCard";

// ── Subscription Plans ──
function getSubscriptionPlans(t: any): SubscriptionPlan[] {
    // 単品換算: Audio¥2, Explorer¥2, Correction¥3, Extract¥10, Explanation¥5
    // Standard: A/E 30回/日×30=900×¥2=¥1,800 + Corr 300×¥3=¥900 + Ext 10×¥10=¥100 + Exp 30×¥5=¥150 = ¥2,950
    // Pro:      A/E 100回/日×30=3000×¥2=¥6,000 + Corr 900×¥3=¥2,700 + Ext 30×¥10=¥300 + Exp 100×¥5=¥500 = ¥9,500
    return [
        {
            id: "standard",
            name: t.planStandard || "スタンダード",
            price: 480,
            priceLabel: t.perMonth || "/月",
            badge: t.popular || "人気",
            icon: <Zap size={22} />,
            color: "#6366f1",
            singleTotal: 2950,
            features: [
                { label: t.planStdAudio || "Audio / Explorer: 30回/日", highlight: true, singlePrice: "¥1,800" },
                { label: t.planStdCorrection || "添削: 10回/日", highlight: true, singlePrice: "¥900" },
                { label: t.planStdExtract || "画像抽出: 月10回", singlePrice: "¥100" },
                { label: t.planStdExplanation || "文法解説: 月30回", singlePrice: "¥150" },
            ],
        },
        {
            id: "pro",
            name: t.planPro || "プロ",
            price: 980,
            priceLabel: t.perMonth || "/月",
            icon: <Crown size={22} />,
            color: "#f59e0b",
            singleTotal: 9500,
            features: [
                { label: t.planProAudio || "Audio / Explorer: 100回/日", highlight: true, singlePrice: "¥6,000" },
                { label: t.planProCorrection || "添削: 30回/日", highlight: true, singlePrice: "¥2,700" },
                { label: t.planProExtract || "画像抽出: 月30回", singlePrice: "¥300" },
                { label: t.planProExplanation || "文法解説: 月100回", singlePrice: "¥500" },
            ],
        },
    ];
}

// ── Single Purchase Items ──
function getSinglePurchaseItems(t: any): SinglePurchaseItem[] {
    return [
        {
            id: "single_audio",
            name: t.singleAudio || "音声再生",
            description: t.singleAudioDesc || "フレーズを音声で聴く",
            icon: <Volume2 size={20} />,
            price: 2,
            usesPerHundred: 50,
            color: "#3b82f6",
            category: "core",
        },
        {
            id: "single_explorer",
            name: t.singleExplorer || "単語解析",
            description: t.singleExplorerDesc || "単語の意味・用法を調べる",
            icon: <Compass size={20} />,
            price: 2,
            usesPerHundred: 50,
            color: "#10b981",
            category: "core",
        },
        {
            id: "single_correction",
            name: t.singleCorrection || "添削",
            description: t.singleCorrectionDesc || "文章をAIが添削",
            icon: <PenTool size={20} />,
            price: 3,
            usesPerHundred: 35,
            color: "#8b5cf6",
            category: "core",
        },
        {
            id: "single_extract",
            name: t.singleExtract || "画像抽出",
            description: t.singleExtractDesc || "画像からフレーズを抽出",
            icon: <ImagePlus size={20} />,
            price: 10,
            usesPerHundred: 10,
            color: "#f97316",
            category: "tool",
        },
        {
            id: "single_explanation",
            name: t.singleExplanation || "文法解説",
            description: t.singleExplanationDesc || "なぜそうなるか文法で解説",
            icon: <BookOpen size={20} />,
            price: 5,
            usesPerHundred: 20,
            color: "#ef4444",
            category: "grammar",
        },
    ];
}

// ── Coin Shop Items (existing premium features) ──
const FEATURES: ShopItem[] = [
    {
        id: "phrase_collections",
        translationKeyTitle: "shop_phraseCollections_title",
        translationKeyDesc: "shop_phraseCollections_desc",
        translationKeyLongDesc: "shop_phraseCollections_longDesc",
        icon: <FolderHeart size={22} />,
        cost: 500,
        color: "#ec4899",
    },
    {
        id: "audio_premium",
        translationKeyTitle: "shop_audioPremium_title",
        translationKeyDesc: "shop_audioPremium_desc",
        translationKeyLongDesc: "shop_audioPremium_longDesc",
        icon: <Mic size={22} />,
        cost: 300,
        color: "#06b6d4",
    },
    {
        id: "study_set_creator",
        translationKeyTitle: "shop_studySetCreator_title",
        translationKeyDesc: "shop_studySetCreator_desc",
        translationKeyLongDesc: "shop_studySetCreator_longDesc",
        icon: <Layers size={22} />,
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
                    <Coins size={14} className={styles.coinIcon} />
                    <span>{item.cost}</span>
                </div>
                {isPurchased && (
                    <div className={styles.purchasedBadge}>
                        <Check size={12} />
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
        { label: "Audio / Explorer", value: "7", unit: t.perDay || "回/日", icon: <Volume2 size={18} />, color: "#3b82f6" },
        { label: t.correction || "添削", value: "3", unit: t.perDay || "回/日", icon: <PenTool size={18} />, color: "#8b5cf6" },
        { label: t.singleExplanation || "文法解説", value: "1", unit: t.perDay || "回/日", icon: <BookOpen size={18} />, color: "#ef4444" },
    ];

    return (
        <div className={styles.freePlanCard}>
            <div className={styles.freePlanHeader}>
                <div className={styles.freePlanIcon}>
                    <Zap size={20} />
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

export default function ShopPage() {
    const { nativeLanguage, profile, refreshProfile } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const balance = profile?.coins || 0;
    const currentPlan = (profile as any)?.plan || "free";
    const purchasedItems = (profile?.settings as any)?.inventory || [];

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

    const subscriptionPlans = getSubscriptionPlans(t);
    const singlePurchaseItems = getSinglePurchaseItems(t);

    // Mark current plan
    const plansWithCurrent = subscriptionPlans.map(p => ({
        ...p,
        isCurrent: p.id === currentPlan,
    }));

    const handleSubscribe = (planId: string) => {
        // TODO: Stripe Checkout integration
        alert(t.stripeComingSoon);
    };

    const handleSinglePurchase = (itemId: string) => {
        // TODO: Stripe one-time payment integration
        alert(t.stripeComingSoon);
    };

    const handleCoinPurchase = async (item: ShopItem) => {
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
                <div className={styles.balanceCard}>
                    <Coins size={24} className={styles.coinIcon} />
                    <div>
                        <div className={styles.balanceAmount}>{balance.toLocaleString()}</div>
                        <div className={styles.balanceLabel}>{t.coins || "コイン"}</div>
                    </div>
                </div>
            </div>


            {/* ── Subscription Plans ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {t.subscriptionPlans || "サブスクリプション"}
                    </h2>
                    <p className={styles.sectionDesc}>
                        {t.subscriptionDesc || "月額プランで毎日お得に使い放題"}
                    </p>
                </div>
                <div className={styles.subGrid}>
                    {plansWithCurrent.map((plan) => (
                        <SubscriptionCard
                            key={plan.id}
                            plan={plan}
                            onSubscribe={handleSubscribe}
                            t={t}
                        />
                    ))}
                </div>
            </div>

            {/* ── Single Purchase ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {t.singlePurchase || "単品購入"}
                    </h2>
                    <p className={styles.sectionDesc}>
                        {t.singlePurchaseDesc || "必要な時に1回ずつ購入。サブスクならもっとお得！"}
                    </p>
                </div>
                <div className={styles.singleGrid}>
                    {singlePurchaseItems.map((item) => (
                        <SinglePurchaseCard
                            key={item.id}
                            item={item}
                            onPurchase={handleSinglePurchase}
                            t={t}
                        />
                    ))}
                </div>
            </div>

            {/* ── Coin Shop (Premium Features) ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {t.shopFeatures || "プレミアム機能"}
                    </h2>
                    <p className={styles.sectionDesc}>
                        {t.coinShopDesc || "学習で貯めたコインで機能をアンロック"}
                    </p>
                </div>
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

            {/* Product Detail Modal (for coin shop) */}
            <ShopProductModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onPurchase={handleCoinPurchase}
                isPurchasing={isPurchasing}
                balance={balance}
                isPurchased={selectedItem ? purchasedItems.includes(selectedItem.id) : false}
                t={t}
            />
        </div>
    );
}
