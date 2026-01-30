"use client";

import React, { useEffect, useState } from "react";
import { Check, X, Coins, Info } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import styles from "./shop-modal.module.css";
import { createPortal } from "react-dom";
import PhraseCard from "@/components/PhraseCard";
import { Phrase } from "@/lib/data";

// Demo phrase for audio premium trial
const DEMO_PHRASE: Phrase = {
    id: "demo_audio_premium",
    categoryId: "demo",
    translation: "新しい言語を学ぶことは、素晴らしい機会への扉を開く。",
    translations: {
        en: "Learning a new language opens doors to amazing opportunities.",
        ja: "新しい言語を学ぶことは、素晴らしい機会への扉を開く。",
        ko: "새로운 언어를 배우는 것은 놀라운 기회의 문을 열어줍니다.",
        zh: "学习一门新语言会为你打开通往精彩机遇的大门。",
        fr: "Apprendre une nouvelle langue ouvre des portes vers des opportunités incroyables.",
        es: "Aprender un nuevo idioma abre puertas a oportunidades increíbles.",
        de: "Eine neue Sprache zu lernen öffnet Türen zu erstaunlichen Möglichkeiten.",
        ru: "Изучение нового языка открывает двери к удивительным возможностям.",
        vi: "Học một ngôn ngữ mới sẽ mở ra cánh cửa đến những cơ hội tuyệt vời.",
    },
    tokensMap: {
        en: ["Learning", " ", "a", " ", "new", " ", "language", " ", "opens", " ", "doors", " ", "to", " ", "amazing", " ", "opportunities", "."],
    },
    tokensSlashMap: {},
};

export interface ShopItem {
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

interface ShopProductModalProps {
    item: ShopItem | null;
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (item: ShopItem) => Promise<void>;
    isPurchasing: boolean;
    balance: number;
    isPurchased: boolean;
    t: any;
}

export default function ShopProductModal({
    item,
    isOpen,
    onClose,
    onPurchase,
    isPurchasing,
    balance,
    isPurchased: initialIsPurchased,
    t
}: ShopProductModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!mounted || !item || !isOpen) return null;

    const isAffordable = balance >= item.cost;
    const canPurchase = item.isConsumable || !initialIsPurchased;

    // Determine button state
    const isSuccess = !item.isConsumable && initialIsPurchased;
    const isDisabled = (!isSuccess && !isAffordable) || isPurchasing;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                style={{ "--item-color": item.color } as React.CSSProperties}
            >
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Hero Section - Show demo for audio_premium, otherwise normal hero */}
                {item.id === "audio_premium" ? (
                    <div className={styles.demoSection}>
                        <div className={styles.demoCard}>
                            <PhraseCard phrase={DEMO_PHRASE} demoMode />
                        </div>
                        <div className={styles.demoHint}>
                            <Info size={14} />
                            <span>{(t as any).demoHint || "長押しで音声・速度を選べます"}</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className={styles.hero}
                        style={{
                            "--bg-start": item.color,
                            "--bg-end": `${item.color}cc`
                        } as React.CSSProperties}
                    >
                        {item.previewImage ? (
                            <Image
                                src={item.previewImage}
                                alt={(t as any)[item.translationKeyTitle] || item.id}
                                width={420}
                                height={220}
                                className={styles.previewImage}
                            />
                        ) : (
                            <div className={styles.heroIconWrapper}>
                                <div className={styles.heroIcon}>
                                    {React.cloneElement(item.icon as any, { size: 64 })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section */}
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>
                            {(t as any)[item.translationKeyTitle] || item.translationKeyTitle}
                        </h2>
                        <div className={styles.priceTag}>
                            <Coins size={16} className={styles.coinIcon} strokeWidth={2.5} />
                            <span>{item.cost.toLocaleString()}</span>
                        </div>
                    </div>

                    <p className={styles.description}>
                        {(t as any)[item.translationKeyLongDesc || item.translationKeyDesc] || item.translationKeyDesc}
                    </p>

                    <div className={styles.actionArea}>
                        <button
                            onClick={() => onPurchase(item)}
                            disabled={isDisabled || isSuccess}
                            className={clsx(
                                styles.purchaseButton,
                                isSuccess ? styles.purchasedButton :
                                    isAffordable ? styles.activeButton : styles.disabledButton
                            )}
                        >
                            {isPurchasing ? (
                                <div className={styles.spinner} />
                            ) : isSuccess ? (
                                <>
                                    <Check size={20} strokeWidth={3} />
                                    {t.purchased}
                                </>
                            ) : !isAffordable ? (
                                <>{(t as any).insufficientCoins || "コインが足りません"}</>
                            ) : (
                                <>{(t as any).purchaseNow || "購入する"}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
