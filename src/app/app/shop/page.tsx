"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./shop.module.css";
import { Coins, Zap, Shield, Palette, Check, FolderHeart, X, Eye } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

/* 
 * MVP Limitation:
 * Since we don't have a 'coins' field in the DB yet, we simulates a balance 
 * based on user XP (e.g. XP / 10) or a local mock value.
 * Transformations are not persisted to server in this version.
 */

interface ShopItem {
    id: string;
    translationKeyTitle: string;
    translationKeyDesc: string;
    translationKeyLongDesc?: string;
    icon: React.ReactNode;
    cost: number;
    color: string;
    previewImage?: string;
}

const SHOP_ITEMS: ShopItem[] = [
    {
        id: "phrase_collections",
        translationKeyTitle: "shop_phraseCollections_title",
        translationKeyDesc: "shop_phraseCollections_desc",
        translationKeyLongDesc: "shop_phraseCollections_longDesc",
        icon: <FolderHeart size={32} />,
        cost: 500,
        color: "#ec4899",
        // previewImage: "/images/shop/phrase-collections-preview.png", // Uncomment when image is added
    },
];

import { purchaseShopItem } from "./actions";

export default function ShopPage() {
    const { userProgress, nativeLanguage, profile, refreshProfile } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    // Use DB coins or 0
    const balance = profile?.coins || 0;

    // Use DB inventory or empty
    const purchasedItems = (profile?.settings as any)?.inventory || [];

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

    const handlePurchase = async (item: ShopItem) => {
        if (balance >= item.cost && !purchasedItems.includes(item.id)) {
            setIsPurchasing(true);
            try {
                const result = await purchaseShopItem(item.id, item.cost);
                if (result.success) {
                    // Update local context
                    await refreshProfile();

                    // Fallback for localStorage to keep other components (PhraseCard) working 
                    // until they are also updated to read from profile
                    // Actually, PhraseCard checks localStorage. 
                    // We should keep localStorage in sync OR update PhraseCard.
                    // Let's sync localStorage for compatibility for now.
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
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>{t.shopTitle}</h1>
                    <p className={styles.subtitle}>{t.shopDesc}</p>
                </div>

                <div className={styles.balanceCard}>
                    <Coins className={styles.coinIcon} size={28} />
                    <div>
                        <div className={styles.balanceAmount}>{balance}</div>
                        <div className={styles.balanceLabel}>{t.coins}</div>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {SHOP_ITEMS.map((item) => {
                    const isPurchased = purchasedItems.includes(item.id);
                    const canAfford = balance >= item.cost;

                    return (
                        <div
                            key={item.id}
                            className={styles.itemCard}
                            onClick={() => setSelectedItem(item)}
                            style={{ cursor: "pointer" }}
                        >
                            <div
                                className={styles.iconContainer}
                                style={{ color: item.color, background: `${item.color}20` }}
                            >
                                {item.icon}
                            </div>

                            <h3 className={styles.itemName}>
                                {(t as any)[item.translationKeyTitle] || item.translationKeyTitle}
                            </h3>
                            <p className={styles.itemDesc}>
                                {(t as any)[item.translationKeyDesc] || item.translationKeyDesc}
                            </p>

                            <div className={styles.cardFooter}>
                                <div className={styles.cardPrice}>
                                    <Coins size={16} className={styles.coinIcon} />
                                    <span>{item.cost}</span>
                                </div>
                                {isPurchased && (
                                    <div className={styles.purchasedBadge}>
                                        <Check size={14} />
                                        {t.purchased}
                                    </div>
                                )}
                            </div>
                            <div className={styles.viewDetailsButton}>
                                <Eye size={18} />
                                <span>{(t as any).viewDetails || "詳細を見る"}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Product Detail Modal */}
            {selectedItem && (
                <>
                    <div
                        className={styles.modalBackdrop}
                        onClick={() => setSelectedItem(null)}
                    />
                    <div className={styles.modal}>
                        <button
                            className={styles.modalClose}
                            onClick={() => setSelectedItem(null)}
                        >
                            <X size={24} />
                        </button>

                        <div className={styles.modalContent}>
                            {/* Preview Image */}
                            <div
                                className={styles.modalPreview}
                                style={{ background: `${selectedItem.color}15` }}
                            >
                                {selectedItem.previewImage ? (
                                    <Image
                                        src={selectedItem.previewImage}
                                        alt={(t as any)[selectedItem.translationKeyTitle] || selectedItem.id}
                                        width={400}
                                        height={240}
                                        className={styles.previewImage}
                                    />
                                ) : (
                                    <div
                                        className={styles.modalIconLarge}
                                        style={{ color: selectedItem.color }}
                                    >
                                        {selectedItem.icon}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className={styles.modalDetails}>
                                <h2 className={styles.modalTitle}>
                                    {(t as any)[selectedItem.translationKeyTitle] || selectedItem.translationKeyTitle}
                                </h2>
                                <p className={styles.modalDesc}>
                                    {(t as any)[selectedItem.translationKeyLongDesc || selectedItem.translationKeyDesc] || selectedItem.translationKeyDesc}
                                </p>

                                <div className={styles.modalPrice}>
                                    <Coins size={24} className={styles.coinIcon} />
                                    <span>{selectedItem.cost}</span>
                                </div>

                                <button
                                    onClick={() => {
                                        handlePurchase(selectedItem);
                                        setSelectedItem(null);
                                    }}
                                    disabled={purchasedItems.includes(selectedItem.id) || balance < selectedItem.cost || isPurchasing}
                                    className={clsx(
                                        styles.modalBuyButton,
                                        purchasedItems.includes(selectedItem.id)
                                            ? styles.buyButtonPurchased
                                            : balance >= selectedItem.cost
                                                ? styles.buyButtonActive
                                                : styles.buyButtonDisabled
                                    )}
                                >
                                    {purchasedItems.includes(selectedItem.id) ? (
                                        <>
                                            <Check size={20} />
                                            {t.purchased}
                                        </>
                                    ) : balance < selectedItem.cost ? (
                                        <>{(t as any).insufficientCoins || "コインが足りません"}</>
                                    ) : (
                                        <>{(t as any).purchaseNow || "購入する"}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
