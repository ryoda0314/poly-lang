"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./shop.module.css";
import { Coins, Zap, Shield, Palette, Check } from "lucide-react";
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
    icon: React.ReactNode;
    cost: number;
    color: string;
}

const SHOP_ITEMS: ShopItem[] = [];

import { purchaseShopItem } from "./actions";

export default function ShopPage() {
    const { userProgress, nativeLanguage, profile, refreshProfile } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    // Use DB coins or 0
    const balance = profile?.coins || 0;

    // Use DB inventory or empty
    const purchasedItems = (profile?.settings as any)?.inventory || [];

    const [isPurchasing, setIsPurchasing] = useState(false);

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
                        <div key={item.id} className={styles.itemCard}>
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

                            <button
                                onClick={() => handlePurchase(item)}
                                disabled={isPurchased || !canAfford}
                                className={clsx(
                                    styles.buyButton,
                                    isPurchased
                                        ? styles.buyButtonPurchased
                                        : canAfford
                                            ? styles.buyButtonActive
                                            : styles.buyButtonDisabled
                                )}
                            >
                                {isPurchased ? (
                                    <>
                                        <Check size={18} />
                                        {t.purchased}
                                    </>
                                ) : (
                                    <>
                                        <Coins size={18} />
                                        {item.cost}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
