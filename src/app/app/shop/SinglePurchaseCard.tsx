"use client";

import React from "react";
import { Coins } from "lucide-react";
import styles from "./shop.module.css";

export interface SinglePurchaseItem {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    price: number;
    usesPerHundred: number; // 100コインで何回使えるか
    color: string;
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
                    <span className={styles.singlePriceYen}>{item.usesPerHundred}{t.uses || "回"}</span>
                    <span className={styles.singlePriceUnit}>
                        / <Coins size={10} className={styles.coinIconSmall} />100
                    </span>
                </div>
            </div>

            <button
                className={styles.singleButton}
                style={{ color: item.color, borderColor: `${item.color}40` }}
                onClick={() => onPurchase(item.id)}
                disabled={isLoading}
            >
                {t.buyWithCoins || "購入"}
            </button>
        </div>
    );
}
