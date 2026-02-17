"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import Link from "next/link";
import { ChevronRight, Check, BookOpen, ChevronDown, Settings, ShoppingBag, Volume2, Compass, PenTool, ImagePlus, Zap, Crown, X, Flame } from "lucide-react";
import { DashboardResponse } from "@/lib/gamification";
import { LANGUAGES } from "@/lib/data";
import styles from "./page.module.css";
import { translations } from "@/lib/translations";
import StreakCard from "@/components/dashboard/StreakCard";
import AnnouncementBell from "@/components/dashboard/AnnouncementBell";
import GiftButton from "@/components/dashboard/GiftButton";
import LevelCardC from "@/components/dashboard/LevelCardC";
import RankingWidget from "@/components/dashboard/RankingWidget";
import {
    NAV_ITEM_REGISTRY,
    CATEGORY_ORDER,
    CATEGORY_PARENT,
    filterByLanguage,
    type NavCategory,
} from "@/lib/nav-items";
import type { NavItemKey } from "@/store/settings-store";

// Feature descriptions keyed by NavItemKey, per native language
const FEATURE_DESC: Record<string, Record<string, string>> = {
    ja: {
        phrases: "文脈の中でフレーズを学ぶ。音声・IPA・トークン解析付き",
        "long-text": "テキストを丸ごと解析",
        "sentence-analysis": "英文の構造を分解して読み解く",
        "script-learning": "文字・発音記号のトレーニング",
        "kanji-hanja": "日本の漢字と韓国の漢字を対照",
        expressions: "表現を多言語で比較",
        "grammar-diagnostic": "文法の弱点を特定する",
        "vocab-generator": "AIで語彙リストを自動生成",
        corrections: "書いた文章をAIが校正。自然な表現を提案",
        chat: "AIと自由に会話練習",
        etymology: "単語のルーツを辿る",
        "phrasal-verbs": "英語の句動詞を体系的に学ぶ",
        "basic-phrases": "旅行・日常向けの基本フレーズ集",
        "vocabulary-sets": "自分だけの単語コレクション",
        awareness: "間隔反復で記憶を定着させる",
        "swipe-deck": "フラッシュカードで復習",
        "my-vocabulary": "保存した語彙を管理",
        "learning-review": "学習の振り返り",
        slang: "口語表現・スラングのデータベース",
    },
    en: {
        phrases: "Learn phrases in context with audio, IPA, and token analysis",
        "long-text": "Analyze full texts",
        "sentence-analysis": "Break down English sentence structure",
        "script-learning": "Script and phonetic training",
        "kanji-hanja": "Compare Japanese and Korean characters",
        expressions: "Compare expressions across languages",
        "grammar-diagnostic": "Identify grammar weak points",
        "vocab-generator": "Auto-generate vocabulary lists with AI",
        corrections: "AI proofreading with natural expression suggestions",
        chat: "Free conversation practice with AI",
        etymology: "Trace word origins",
        "phrasal-verbs": "Systematically learn English phrasal verbs",
        "basic-phrases": "Essential phrases for travel and daily life",
        "vocabulary-sets": "Your own word collections",
        awareness: "Lock in memory with spaced repetition",
        "swipe-deck": "Review with flashcards",
        "my-vocabulary": "Manage saved vocabulary",
        "learning-review": "Review your learning",
        slang: "Slang and colloquial expression database",
    },
    ko: {
        phrases: "문맥 속에서 구문을 학습. 음성·IPA·토큰 분석 포함",
        "long-text": "전체 텍스트 분석",
        "sentence-analysis": "영문 구조를 분해",
        "script-learning": "문자·발음 기호 훈련",
        "kanji-hanja": "일본 한자와 한국 한자 비교",
        expressions: "여러 언어로 표현 비교",
        "grammar-diagnostic": "문법 약점 파악",
        "vocab-generator": "AI로 어휘 목록 자동 생성",
        corrections: "AI가 교정하고 자연스러운 표현을 제안",
        chat: "AI와 자유 대화 연습",
        etymology: "단어의 어원 추적",
        "phrasal-verbs": "영어 구동사를 체계적으로 학습",
        "basic-phrases": "여행·일상 기본 구문집",
        "vocabulary-sets": "나만의 단어 컬렉션",
        awareness: "간격 반복으로 기억 정착",
        "swipe-deck": "플래시카드로 복습",
        "my-vocabulary": "저장한 어휘 관리",
        "learning-review": "학습 되돌아보기",
        slang: "구어·슬랭 데이터베이스",
    },
};

const CATEGORY_LABELS: Record<NavCategory, Record<string, string>> = {
    input: { ja: "学ぶ", en: "Learn", ko: "배우기", zh: "学习", fr: "Apprendre", es: "Aprender", de: "Lernen", ru: "Учить", vi: "Học", fi: "Oppia" },
    output: { ja: "使う", en: "Use", ko: "사용하기", zh: "使用", fr: "Utiliser", es: "Usar", de: "Anwenden", ru: "Применять", vi: "Sử dụng", fi: "Käyttää" },
    review: { ja: "覚える", en: "Remember", ko: "기억하기", zh: "记忆", fr: "Mémoriser", es: "Recordar", de: "Erinnern", ru: "Запоминать", vi: "Ghi nhớ", fi: "Muistaa" },
    dictionary: { ja: "辞書", en: "Dictionary", ko: "사전", zh: "词典", fr: "Dictionnaire", es: "Diccionario", de: "Wörterbuch", ru: "Словарь", vi: "Từ điển", fi: "Sanakirja" },
};

const CATEGORY_COLORS: Record<NavCategory, { bg: string; fg: string }> = {
    input: { bg: "rgba(59,130,246,0.1)", fg: "#3b82f6" },
    output: { bg: "rgba(16,185,129,0.1)", fg: "#10b981" },
    review: { bg: "rgba(217,108,69,0.1)", fg: "#D96C45" },
    dictionary: { bg: "rgba(139,92,246,0.1)", fg: "#8b5cf6" },
};


export default function DashboardPage() {
    const { activeLanguage, activeLanguageCode, profile, user, setActiveLanguage, nativeLanguage } = useAppStore();
    const { memos, fetchMemos } = useAwarenessStore();
    const { logEvent } = useHistoryStore();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Badge count for awareness
    const awarenessBadgeCount = useMemo(() => {
        const memoList = Object.values(memos).flat();
        const now = new Date();
        const unverified = memoList.filter(m => m.status === 'unverified').length;
        const dueReviews = memoList.filter(m =>
            m.status === 'verified' && m.next_review_at && new Date(m.next_review_at) <= now
        ).length;
        return unverified + dueReviews;
    }, [memos]);

    // Fetch Dashboard & Awareness Data in parallel
    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }
        const userId = user.id;

        async function fetchAllData() {
            try {
                const today = new Date().toISOString().split('T')[0];
                await Promise.all([
                    fetch('/api/checkin', { method: 'POST' })
                        .then(res => {
                            if (res.ok) {
                                logEvent(TRACKING_EVENTS.DAILY_CHECKIN, 0, {
                                    date: today,
                                });
                            }
                        })
                        .catch(() => {}),
                    fetch(`/api/dashboard?lang=${nativeLanguage}&learning_lang=${activeLanguageCode}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(dashboardData => { if (dashboardData) setData(dashboardData); }),
                    fetchMemos(userId, activeLanguageCode),
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllData();
    }, [user?.id, activeLanguageCode, nativeLanguage, fetchMemos]);

    if (!activeLanguage) return null;

    const displayName = data?.profile.displayName || profile?.username || user?.email?.split("@")[0] || "Learner";

    if (isLoading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonPulse} style={{ width: '200px', height: '32px', borderRadius: '8px' }} />
                <div className={styles.skeletonPulse} style={{ width: '150px', height: '20px', borderRadius: '6px', marginTop: '8px' }} />
            </div>
            <div className={styles.skeletonGrid}>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonPulse} style={{ width: '100%', height: '24px', borderRadius: '4px' }} />
                    <div className={styles.skeletonPulse} style={{ width: '60%', height: '16px', borderRadius: '4px', marginTop: '12px' }} />
                    <div className={styles.skeletonPulse} style={{ width: '80%', height: '12px', borderRadius: '4px', marginTop: '8px' }} />
                </div>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonPulse} style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
                </div>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonPulse} style={{ width: '100%', height: '24px', borderRadius: '4px' }} />
                    <div className={styles.skeletonPulse} style={{ width: '70%', height: '16px', borderRadius: '4px', marginTop: '12px' }} />
                </div>
            </div>
        </div>
    );
    if (!data) return null;

    const { level, streak } = data;
    const t = translations[nativeLanguage];
    const desc = FEATURE_DESC[nativeLanguage] || FEATURE_DESC.en;

    // Build toolbox: all nav keys grouped by category, filtered by language
    const allKeys = Object.keys(NAV_ITEM_REGISTRY) as NavItemKey[];
    const visibleKeys = filterByLanguage(allKeys, activeLanguageCode, nativeLanguage);

    return (
        <div className={styles.container}>
            {/* Header Row */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}><span className={styles.titleNoWrap}>{t.welcomeBack}</span><br />{displayName}.</h1>
                    <div className={styles.subtitleWrapper}>
                        <div className={styles.langSelector}>
                            <button
                                className={styles.langButton}
                                onClick={() => setIsLangOpen(!isLangOpen)}
                            >
                                <span className={styles.langName}>{(t as any)[`language_${activeLanguageCode}`] || activeLanguage.name}</span>
                                <ChevronDown size={16} className={`${styles.chevron} ${isLangOpen ? styles.rotate : ''}`} />
                            </button>

                            {isLangOpen && (
                                <div className={styles.langDropdown}>
                                    {LANGUAGES.filter(lang => lang.code !== nativeLanguage).map((lang) => (
                                        <button
                                            key={lang.code}
                                            className={`${styles.langOption} ${activeLanguageCode === lang.code ? styles.activeLang : ''}`}
                                            onClick={() => {
                                                setActiveLanguage(lang.code);
                                                setIsLangOpen(false);
                                            }}
                                        >
                                            <span>{(t as any)[`language_${lang.code}`] || lang.name}</span>
                                            {activeLanguageCode === lang.code && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span>{t.waitingForYou}</span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <GiftButton />
                    <AnnouncementBell />
                    <button
                        className={styles.avatarBtn}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <svg className={styles.avatarRing} viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                            <circle
                                cx="24" cy="24" r="22"
                                fill="none"
                                stroke="#D96C45"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${2 * Math.PI * 22 * (1 - level.progressPercent / 100)}`}
                                transform="rotate(-90 24 24)"
                            />
                        </svg>
                        {data.profile.avatarUrl ? (
                            <img
                                src={data.profile.avatarUrl}
                                alt={displayName}
                                className={styles.avatarImage}
                            />
                        ) : (
                            <span className={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</span>
                        )}
                        {streak.current > 0 && (
                            <span className={styles.avatarStreakBadge}>
                                <Flame size={10} />
                                {streak.current}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Profile Panel (toggled by avatar) */}
            {isProfileOpen && (
                <>
                    <div className={styles.profileOverlay} onClick={() => setIsProfileOpen(false)} />
                    <div className={styles.profilePanel}>
                        <div className={styles.profilePanelHeader}>
                            <span className={styles.profilePanelName}>{displayName}</span>
                            <button className={styles.profilePanelClose} onClick={() => setIsProfileOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <LevelCardC
                            level={level.current.level}
                            title={level.current.title}
                            currentXp={level.currentXp}
                            nextLevelXp={level.nextLevelXp}
                            progressPercent={level.progressPercent}
                            totalWords={data.stats.totalWords}
                            streak={streak.current}
                            labels={{
                                streak: t.streak,
                                words: t.words,
                            }}
                        />

                        <StreakCard streak={streak} loginDays={data.loginDays || []} compact />

                        <div className={styles.profileCredits}>
                            <div className={styles.accountHeader}>
                                <div className={styles.accountPlanBadge} data-plan={data.usage?.plan || "free"}>
                                    {(data.usage?.plan === "pro") ? <Crown size={14} /> : <Zap size={14} />}
                                    <span>
                                        {(data.usage?.plan === "pro")
                                            ? (t as any).planPro || "プロ"
                                            : (data.usage?.plan === "standard")
                                                ? (t as any).planStandard || "スタンダード"
                                                : (t as any).freePlan || "無料プラン"}
                                    </span>
                                </div>
                                <Link href="/app/account" className={styles.accountUpgrade} onClick={() => setIsProfileOpen(false)}>
                                    {(t as any).viewDetails || "詳細を見る"}
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className={styles.creditsGrid}>
                                <div className={styles.creditItem}>
                                    <div className={styles.creditIcon} style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)" }}>
                                        <Volume2 size={16} />
                                    </div>
                                    <div className={styles.creditInfo}>
                                        <span className={styles.creditLabel}>{(t as any).singleAudio || "音声"}</span>
                                        <span className={styles.creditValue}>
                                            {data.usage?.remaining.audio ?? 0}
                                            <span className={styles.creditLimit}>/{data.usage?.limits.audio ?? 5}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.creditItem}>
                                    <div className={styles.creditIcon} style={{ color: "#10b981", background: "rgba(16,185,129,0.1)" }}>
                                        <Compass size={16} />
                                    </div>
                                    <div className={styles.creditInfo}>
                                        <span className={styles.creditLabel}>{(t as any).singleExplorer || "単語解析"}</span>
                                        <span className={styles.creditValue}>
                                            {data.usage?.remaining.explorer ?? 0}
                                            <span className={styles.creditLimit}>/{data.usage?.limits.explorer ?? 5}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.creditItem}>
                                    <div className={styles.creditIcon} style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.1)" }}>
                                        <PenTool size={16} />
                                    </div>
                                    <div className={styles.creditInfo}>
                                        <span className={styles.creditLabel}>{(t as any).singleCorrection || "添削"}</span>
                                        <span className={styles.creditValue}>
                                            {data.usage?.remaining.correction ?? 0}
                                            <span className={styles.creditLimit}>/{data.usage?.limits.correction ?? 3}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.creditItem}>
                                    <div className={styles.creditIcon} style={{ color: "#f97316", background: "rgba(249,115,22,0.1)" }}>
                                        <ImagePlus size={16} />
                                    </div>
                                    <div className={styles.creditInfo}>
                                        <span className={styles.creditLabel}>{(t as any).singleExtract || "画像抽出"}</span>
                                        <span className={styles.creditValue}>
                                            {data.usage?.remaining.extraction ?? 0}
                                            <span className={styles.creditLimit}>/{data.usage?.limits.extraction ?? 1}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.creditItem}>
                                    <div className={styles.creditIcon} style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
                                        <BookOpen size={16} />
                                    </div>
                                    <div className={styles.creditInfo}>
                                        <span className={styles.creditLabel}>{(t as any).singleExplanation || "文法解説"}</span>
                                        <span className={styles.creditValue}>
                                            {data.usage?.remaining.explanation ?? 0}
                                            <span className={styles.creditLimit}>/{data.usage?.limits.explanation ?? 1}</span>
                                        </span>
                                    </div>
                                </div>
                                <Link href="/app/shop" className={styles.creditItemBuy} onClick={() => setIsProfileOpen(false)}>
                                    <ShoppingBag size={18} />
                                    <span>{(t as any).upgradePlan || "アップグレード"}</span>
                                </Link>
                            </div>
                        </div>

                        <Link href="/app/settings" className={styles.profileSettingsLink} onClick={() => setIsProfileOpen(false)}>
                            <Settings size={18} />
                            <span>{(t as any).settings || "設定"}</span>
                            <ChevronRight size={16} className={styles.featureListChevron} />
                        </Link>
                    </div>
                </>
            )}

            {/* === Main Content === */}
            <div className={styles.mainLayout}>
                <div className={styles.mainColumn}>

                    {/* Streak + Ranking (top) */}
                    <section className={styles.section}>
                        <span className={styles.sectionLabel}>{(t as any).todayActivity || "ACTIVITY"}</span>
                        <StreakCard streak={streak} loginDays={data.loginDays || []} compact />
                        <RankingWidget langCode={activeLanguageCode} />
                    </section>

                    {/* Toolbox */}
                    {CATEGORY_ORDER.map((category) => {
                        const parentKey = CATEGORY_PARENT[category];
                        const categoryKeys = visibleKeys.filter(k => NAV_ITEM_REGISTRY[k].category === category);
                        if (categoryKeys.length === 0) return null;

                        const childKeys = categoryKeys.filter(k => k !== parentKey);
                        const parentDef = parentKey ? NAV_ITEM_REGISTRY[parentKey] : null;
                        const colors = CATEGORY_COLORS[category];
                        const categoryLabel = CATEGORY_LABELS[category]?.[nativeLanguage]
                            || (t as any)[`category${category.charAt(0).toUpperCase() + category.slice(1)}`]
                            || category.toUpperCase();

                        return (
                            <section key={category} className={styles.section}>
                                <span className={styles.sectionLabel} style={{ color: colors.fg }}>
                                    {categoryLabel}
                                </span>

                                {parentDef && parentKey ? (
                                    <div className={styles.heroCard} style={{ borderLeftColor: colors.fg }}>
                                        <Link href={parentDef.href} className={styles.heroMain}>
                                            <span
                                                className={styles.heroIconBox}
                                                style={{ background: colors.bg, color: colors.fg }}
                                            >
                                                <parentDef.icon size={22} />
                                            </span>
                                            <div className={styles.heroText}>
                                                <span className={styles.heroName}>
                                                    {parentDef.getLabel(t)}
                                                    {parentKey === 'awareness' && awarenessBadgeCount > 0 && (
                                                        <span className={styles.navBadge}>{awarenessBadgeCount}</span>
                                                    )}
                                                </span>
                                                {desc[parentKey] && (
                                                    <span className={styles.heroDesc}>{desc[parentKey]}</span>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className={styles.heroChevron} />
                                        </Link>
                                        {childKeys.length > 0 && (
                                            <div className={styles.chipRow}>
                                                {childKeys.map((key) => {
                                                    const def = NAV_ITEM_REGISTRY[key];
                                                    return (
                                                        <Link key={key} href={def.href} className={styles.chip}>
                                                            <def.icon size={14} style={{ color: colors.fg }} />
                                                            <span>{def.getLabel(t)}</span>
                                                            {key === 'awareness' && awarenessBadgeCount > 0 && (
                                                                <span className={styles.navBadge}>{awarenessBadgeCount}</span>
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* No parent (e.g. dictionary) — chip grid only */
                                    <div className={styles.chipGrid}>
                                        {categoryKeys.map((key) => {
                                            const def = NAV_ITEM_REGISTRY[key];
                                            return (
                                                <Link key={key} href={def.href} className={styles.chipLarge}>
                                                    <def.icon size={16} style={{ color: colors.fg }} />
                                                    <div className={styles.chipLargeText}>
                                                        <span className={styles.chipLargeName}>{def.getLabel(t)}</span>
                                                        {desc[key] && (
                                                            <span className={styles.chipLargeDesc}>{desc[key]}</span>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}
