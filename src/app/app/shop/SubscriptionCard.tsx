"use client";

import React from "react";
import { Check, Crown, Zap } from "lucide-react";
import styles from "./shop.module.css";

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    priceLabel: string;
    badge?: string;
    features: { label: string; highlight?: boolean; singlePrice?: string }[];
    color: string;
    icon: React.ReactNode;
    isCurrent?: boolean;
    singleTotal?: number; // 単品で同じ量を買った場合の合計
}

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    onSubscribe: (planId: string) => void;
    onManage?: () => void;
    isLoading?: boolean;
    t: any;
}

export default function SubscriptionCard({ plan, onSubscribe, onManage, isLoading, t }: SubscriptionCardProps) {
    const savingsPercent = plan.singleTotal && plan.price > 0
        ? Math.round((1 - plan.price / plan.singleTotal) * 100)
        : null;

    return (
        <div
            className={`${styles.subCard} ${plan.isCurrent ? styles.subCardCurrent : ""}`}
            style={{ "--sub-color": plan.color } as React.CSSProperties}
        >
            {plan.badge && (
                <div className={styles.subBadge}>{plan.badge}</div>
            )}

            <div className={styles.subHeader}>
                <div className={styles.subIcon} style={{ background: `${plan.color}20`, color: plan.color }}>
                    {plan.icon}
                </div>
                <h3 className={styles.subName}>{plan.name}</h3>
            </div>

            <div className={styles.subPrice}>
                <span className={styles.subPriceAmount}>
                    {plan.price === 0 ? (t.free || "無料") : `¥${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                    <span className={styles.subPricePeriod}>{plan.priceLabel}</span>
                )}
            </div>

            {/* Savings comparison */}
            {plan.singleTotal && savingsPercent && (
                <div className={styles.subSavings}>
                    <span className={styles.subSavingsOriginal}>
                        {t.singleEquivalent || "単品"} ¥{plan.singleTotal.toLocaleString()}
                    </span>
                    <span className={styles.subSavingsPercent} style={{ background: plan.color }}>
                        {savingsPercent}%OFF
                    </span>
                </div>
            )}

            <ul className={styles.subFeatures}>
                {plan.features.map((feature, i) => (
                    <li key={i} className={feature.highlight ? styles.subFeatureHighlight : ""}>
                        <Check size={10} className={styles.subFeatureCheck} />
                        <span className={styles.subFeatureText}>
                            {feature.label}
                        </span>
                    </li>
                ))}
            </ul>

            {plan.isCurrent ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div className={`${styles.subButton} ${styles.subButtonCurrent}`} style={{ textAlign: "center" }}>
                        ✓ {t.currentPlan || "現在のプラン"}
                    </div>
                    {onManage && (
                        <button
                            className={styles.subButton}
                            style={{ background: "transparent", border: `1px solid ${plan.color}`, color: plan.color }}
                            onClick={onManage}
                            disabled={isLoading}
                        >
                            {isLoading ? "..." : (t.managePlan || "管理")}
                        </button>
                    )}
                </div>
            ) : (
                <button
                    className={styles.subButton}
                    style={{ background: plan.color }}
                    onClick={() => onSubscribe(plan.id)}
                    disabled={isLoading}
                >
                    {isLoading ? "..." : (t.subscribe || "登録する")}
                </button>
            )}
        </div>
    );
}
