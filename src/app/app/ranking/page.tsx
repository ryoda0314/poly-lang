"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import { Trophy, Flame, Zap, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES } from "@/lib/data";
import styles from "./page.module.css";
import type { RankingType, RankingResponse } from "@/app/api/ranking/route";

const TABS: {
    type: RankingType;
    icon: typeof Zap;
    getLabel: (t: any) => string;
    formatScore: (score: number, t: any) => string;
}[] = [
    {
        type: "xp",
        icon: Zap,
        getLabel: (t) => t.rankingXpTotal || "XP総合",
        formatScore: (s) => `${s.toLocaleString()} XP`,
    },
    {
        type: "weekly",
        icon: Trophy,
        getLabel: (t) => t.rankingWeeklyXp || "週間XP",
        formatScore: (s) => `${s.toLocaleString()} XP`,
    },
    {
        type: "streak",
        icon: Flame,
        getLabel: (t) => t.rankingStreak || "ストリーク",
        formatScore: (s, t) => `${s} ${t.rankingDays || "日"}`,
    },
];

export default function RankingPage() {
    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const t = translations[nativeLanguage] as any;

    const [activeTab, setActiveTab] = useState<RankingType>("xp");
    const [data, setData] = useState<RankingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [langFilter, setLangFilter] = useState<string | null>(activeLanguageCode);
    const [isLangOpen, setIsLangOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const params = new URLSearchParams({ type: activeTab, limit: "50" });
        if (langFilter && activeTab !== "streak") params.set("lang", langFilter);

        fetch(`/api/ranking?${params}`)
            .then((res) => res.json())
            .then((result) => setData(result))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [activeTab, langFilter]);

    const currentTab = TABS.find((tab) => tab.type === activeTab)!;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t.ranking || "ランキング"}</h1>
                <div className={styles.langFilter}>
                    <button
                        className={styles.langBtn}
                        onClick={() => setIsLangOpen(!isLangOpen)}
                    >
                        {langFilter ? (
                            <span>{LANGUAGES.find((l) => l.code === langFilter)?.nativeName || langFilter}</span>
                        ) : (
                            <>
                                <Globe size={14} />
                                <span>{t.rankingAll || "総合"}</span>
                            </>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    {isLangOpen && (
                        <div className={styles.langDropdown}>
                            <button
                                className={`${styles.langOption} ${langFilter === null ? styles.langOptionActive : ""}`}
                                onClick={() => { setLangFilter(null); setIsLangOpen(false); }}
                            >
                                {t.rankingAll || "総合"}
                            </button>
                            {LANGUAGES.filter((l) => l.code !== nativeLanguage).map((lang) => (
                                <button
                                    key={lang.code}
                                    className={`${styles.langOption} ${langFilter === lang.code ? styles.langOptionActive : ""}`}
                                    onClick={() => {
                                        setLangFilter(lang.code);
                                        setIsLangOpen(false);
                                    }}
                                >
                                    {lang.nativeName}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                {TABS.map((tab) => (
                    <button
                        key={tab.type}
                        className={`${styles.tab} ${activeTab === tab.type ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab(tab.type)}
                    >
                        <tab.icon size={16} />
                        <span>{tab.getLabel(t)}</span>
                    </button>
                ))}
            </div>

            {/* My rank banner */}
            {data && data.my_rank !== null && (
                <div className={styles.myRankBanner}>
                    <span className={styles.myRankLabel}>
                        {t.rankingYourRank || "あなたの順位"}
                    </span>
                    <span className={styles.myRankNumber}>#{data.my_rank}</span>
                    <span className={styles.myRankScore}>
                        {currentTab.formatScore(data.my_score || 0, t)}
                    </span>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className={styles.list}>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow}>
                            <div className={styles.pulse} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                            <div className={styles.pulse} style={{ width: 36, height: 36, borderRadius: "50%" }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                <div className={styles.pulse} style={{ width: "50%", height: 14, borderRadius: 4 }} />
                                <div className={styles.pulse} style={{ width: "30%", height: 10, borderRadius: 4 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : data && data.entries.length > 0 ? (
                <div className={styles.list}>
                    {data.entries.map((entry) => (
                        <div
                            key={entry.user_id}
                            className={`${styles.row} ${entry.is_current_user ? styles.rowMe : ""} ${entry.rank <= 3 ? styles[`medal${entry.rank}` as keyof typeof styles] : ""}`}
                        >
                            <span className={styles.rankNum}>
                                {entry.rank === 1
                                    ? "\u{1F947}"
                                    : entry.rank === 2
                                        ? "\u{1F948}"
                                        : entry.rank === 3
                                            ? "\u{1F949}"
                                            : entry.rank}
                            </span>
                            <div className={styles.avatar}>
                                {entry.avatar_url ? (
                                    <img
                                        src={entry.avatar_url}
                                        alt=""
                                        className={styles.avatarImg}
                                    />
                                ) : (
                                    <span className={styles.avatarInitial}>
                                        {(entry.username || "U")[0]?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.username}>{entry.username}</span>
                                <span className={styles.userLevel}>Lv.{entry.level}</span>
                            </div>
                            <span className={styles.score}>
                                {currentTab.formatScore(entry.score, t)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    <Trophy size={48} />
                    <p>{t.rankingNoData || "ランキングデータがありません"}</p>
                </div>
            )}
        </div>
    );
}
