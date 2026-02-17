"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./RankingWidget.module.css";
import type { RankingResponse } from "@/app/api/ranking/route";

interface RankingWidgetProps {
    langCode?: string;
}

export default function RankingWidget({ langCode }: RankingWidgetProps) {
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as any;
    const [data, setData] = useState<RankingResponse | null>(null);

    useEffect(() => {
        const params = new URLSearchParams({ type: "xp", limit: "5" });
        if (langCode) params.set("lang", langCode);

        fetch(`/api/ranking?${params}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((result) => {
                if (result) setData(result);
            })
            .catch(() => {});
    }, [langCode]);

    if (!data || data.entries.length === 0) return null;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Trophy size={16} className={styles.headerIcon} />
                    <span className={styles.headerTitle}>
                        {t.ranking || "ランキング"}
                    </span>
                </div>
                <Link href="/app/ranking" className={styles.viewAll}>
                    {t.rankingViewAll || "すべて見る"}
                    <ChevronRight size={14} />
                </Link>
            </div>

            <div className={styles.list}>
                {data.entries.map((entry) => (
                    <div
                        key={entry.user_id}
                        className={`${styles.row} ${entry.is_current_user ? styles.rowMe : ""}`}
                    >
                        <span className={styles.rank}>
                            {entry.rank === 1
                                ? "\u{1F947}"
                                : entry.rank === 2
                                    ? "\u{1F948}"
                                    : entry.rank === 3
                                        ? "\u{1F949}"
                                        : `${entry.rank}.`}
                        </span>
                        <div className={styles.avatar}>
                            {entry.avatar_url ? (
                                <img
                                    src={entry.avatar_url}
                                    alt=""
                                    className={styles.avatarImg}
                                />
                            ) : (
                                <span className={styles.avatarInit}>
                                    {(entry.username || "U")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span className={styles.name}>{entry.username}</span>
                        <span className={styles.xp}>
                            {entry.score.toLocaleString()} XP
                        </span>
                    </div>
                ))}
            </div>

            {data.my_rank && data.my_rank > 5 && (
                <div className={styles.myRank}>
                    <span className={styles.myRankLabel}>
                        {t.rankingYourRank || "あなたの順位"}:
                    </span>
                    <span className={styles.myRankNum}>#{data.my_rank}</span>
                </div>
            )}
        </div>
    );
}
