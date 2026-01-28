"use client";

import React from "react";
import styles from "./shop.module.css";

export interface SinglePurchaseItem {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    price: number;
    usesPerHundred: number; // ¥100で何回使えるか
    color: string;
    subPrice?: string; // e.g. "サブスクなら 月900回"
    category: "core" | "tool" | "grammar";
}

interface SinglePurchaseCardProps {
    item: SinglePurchaseItem;
    onPurchase: (itemId: string) => void;
    isLoading?: boolean;
    t: any;
}

export default function SinglePurchaseCard({ item, onPurchase, isLoading, t }: SinglePurchaseCardProps) {
    const categoryLabel = item.category === "core"
        ? (t.categoryCore || "コア")
        : item.category === "tool"
            ? (t.categoryTool || "便利ツール")
            : (t.categoryGrammar || "補助輪");

    const categoryStyle = item.category === "core"
        ? styles.categoryCore
        : item.category === "tool"
            ? styles.categoryTool
            : styles.categoryGrammar;

    return (
        <div
            className={styles.singleCard}
            style={{ "--single-color": item.color } as React.CSSProperties}
        >
            <div className={styles.singleTop}>
                <div className={styles.singleIcon} style={{ background: `${item.color}15`, color: item.color }}>
                    {item.icon}
                </div>
                <span className={`${styles.categoryBadge} ${categoryStyle}`}>
                    {categoryLabel}
                </span>
            </div>

            <h4 className={styles.singleName}>{item.name}</h4>
            <p className={styles.singleDesc}>{item.description}</p>

            <div className={styles.singleFooter}>
                <div className={styles.singlePrice}>
                    <span className={styles.singlePriceYen}>¥100</span>
                    <span className={styles.singlePriceUnit}>{t.forUses || "で"}{item.usesPerHundred}{t.uses || "回"}</span>
                </div>
                {item.subPrice && (
                    <div className={styles.singleSubCompare}>
                        {item.subPrice}
                    </div>
                )}
            </div>

            <button
                className={styles.singleButton}
                style={{ color: item.color, borderColor: `${item.color}40` }}
                onClick={() => onPurchase(item.id)}
                disabled={isLoading}
            >
                {t.buyOnce || "購入する"}
            </button>
        </div>
    );
}
