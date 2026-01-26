"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./shop.module.css";
import { Coins, Check, FolderHeart, X, Volume2, Compass, ImagePlus, PenTool, Gauge, Mic } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { purchaseShopItem } from "./actions";
import ShopProductModal from "./ShopProductModal";

interface ShopItem {
    id: string;
    translationKeyTitle: string;
    translationKeyDesc: string;
    translationKeyLongDesc?: string;
    icon: React.ReactNode;
    cost: number;
    color: string;
    previewImage?: string;
    isConsumable?: boolean;
}

const CREDIT_PACKS: ShopItem[] = [
    {
        id: "audio_credits_50",
        translationKeyTitle: "shop_audioCredits_title",
        translationKeyDesc: "shop_audioCredits_desc",
        translationKeyLongDesc: "shop_audioCredits_longDesc",
        icon: <Volume2 size={22} />,
        cost: 100,
        color: "#3b82f6",
        isConsumable: true,
    },
    {
        id: "explorer_credits_20",
        translationKeyTitle: "shop_explorerCredits_title",
        translationKeyDesc: "shop_explorerCredits_desc",
        translationKeyLongDesc: "shop_explorerCredits_longDesc",
        icon: <Compass size={22} />,
        cost: 150,
        color: "#10b981",
        isConsumable: true,
    },
    {
        id: "extraction_credits_10",
        translationKeyTitle: "shop_extractionCredits_title",
        translationKeyDesc: "shop_extractionCredits_desc",
        translationKeyLongDesc: "shop_extractionCredits_longDesc",
        icon: <ImagePlus size={22} />,
        cost: 200,
        color: "#f97316",
        isConsumable: true,
    },
    {
        id: "correction_credits_5",
        translationKeyTitle: "shop_correctionCredits_title",
        translationKeyDesc: "shop_correctionCredits_desc",
        translationKeyLongDesc: "shop_correctionCredits_longDesc",
        icon: <PenTool size={22} />,
        cost: 100,
        color: "#8b5cf6",
        isConsumable: true,
    },
];

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
        id: "speed_control",
        translationKeyTitle: "shop_speedControl_title",
        translationKeyDesc: "shop_speedControl_desc",
        translationKeyLongDesc: "shop_speedControl_longDesc",
        icon: <Gauge size={22} />,
        cost: 300,
        color: "#06b6d4",
    },
    {
        id: "voice_select",
        translationKeyTitle: "shop_voiceSelect_title",
        translationKeyDesc: "shop_voiceSelect_desc",
        translationKeyLongDesc: "shop_voiceSelect_longDesc",
        icon: <Mic size={22} />,
        cost: 400,
        color: "#a855f7",
    },
];

function ItemCard({ item, isPurchased, onClick, t }: {
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

export default function ShopPage() {
    const { nativeLanguage, profile, refreshProfile } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const balance = profile?.coins || 0;
    const purchasedItems = (profile?.settings as any)?.inventory || [];

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

    const handlePurchase = async (item: ShopItem) => {
        const canPurchase = item.isConsumable || !purchasedItems.includes(item.id);
        if (balance >= item.cost && canPurchase) {
            setIsPurchasing(true);
            try {
                const result = await purchaseShopItem(item.id, item.cost);
                if (result.success) {
                    await refreshProfile();
                    const currentPurchased = JSON.parse(localStorage.getItem("poly_shop_purchased") || "[]");
                    if (!currentPurchased.includes(item.id)) {
                        localStorage.setItem("poly_shop_purchased", JSON.stringify([...currentPurchased, item.id]));
                    }
                } else {
                    alert(result.error);
                }
            } catch (e) {
                console.error(e);
                alert("Purchase failed");
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
                    <p className={styles.subtitle}>{t.shopDesc}</p>
                </div>
                <div className={styles.balanceCard}>
                    <Coins className={styles.coinIcon} size={26} />
                    <div>
                        <div className={styles.balanceAmount}>{balance}</div>
                        <div className={styles.balanceLabel}>{t.coins}</div>
                    </div>
                </div>
            </div>

            {/* Credit Packs Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {(t as any).shopCreditPacks || "クレジットパック"}
                    </h2>
                    <p className={styles.sectionDesc}>
                        {(t as any).shopCreditPacksDesc || "各機能のクレジットを追加購入"}
                    </p>
                </div>
                <div className={styles.grid}>
                    {CREDIT_PACKS.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            isPurchased={false}
                            onClick={() => setSelectedItem(item)}
                            t={t}
                        />
                    ))}
                </div>
            </div>

            {/* Premium Features Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {(t as any).shopFeatures || "プレミアム機能"}
                    </h2>
                    <p className={styles.sectionDesc}>
                        {(t as any).shopFeaturesDesc || "一度購入すればずっと使える機能"}
                    </p>
                </div>
                <div className={styles.grid}>
                    {FEATURES.map((item) => {
                        const isPurchased = purchasedItems.includes(item.id);
                        return (
                            <ItemCard
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

            {/* Product Detail Modal */}
            <ShopProductModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onPurchase={handlePurchase}
                isPurchasing={isPurchasing}
                balance={balance}
                isPurchased={selectedItem ? purchasedItems.includes(selectedItem.id) : false}
                t={t}
            />
        </div>
    );
}
