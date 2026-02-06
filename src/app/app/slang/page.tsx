"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Sparkles, ThumbsUp, ThumbsDown, Check, BookOpen, Vote, ChevronLeft, ChevronRight, Globe, X, User, Plus, Send } from "lucide-react";
import { useSlangStore, SlangTerm, AgeGroup, Gender } from "@/store/slang-store";
import { useAppStore } from "@/store/app-context";
import styles from "./slang.module.css";
import clsx from "clsx";

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
    { value: '10s', label: '10代' },
    { value: '20s', label: '20代' },
    { value: '30s', label: '30代' },
    { value: '40s', label: '40代' },
    { value: '50s', label: '50代' },
    { value: '60plus', label: '60代以上' },
];

const GENDERS: { value: Gender; label: string }[] = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' },
    { value: 'prefer_not_to_say', label: '回答しない' },
];

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    ru: "Русский",
    vi: "Tiếng Việt",
};

// Phrase list item (clickable row)
function PhraseItem({ term, onClick }: { term: SlangTerm; onClick: () => void }) {
    const total = term.vote_count_up + term.vote_count_down;
    const score = total > 0 ? Math.round((term.vote_count_up / total) * 100) : null;

    return (
        <button className={styles.phraseItem} onClick={onClick}>
            <div className={styles.phraseMain}>
                <span className={styles.phraseTerm}>{term.term}</span>
            </div>
            <div className={styles.phraseRight}>
                {score !== null ? (
                    <span className={clsx(
                        styles.phraseScore,
                        score >= 70 ? styles.scoreHigh : score >= 40 ? styles.scoreMid : styles.scoreLow
                    )}>
                        {score}%
                    </span>
                ) : (
                    <span className={styles.phraseVotes}>
                        <ThumbsUp size={12} />
                        <span>{term.vote_count_up}</span>
                        <ThumbsDown size={12} />
                        <span>{term.vote_count_down}</span>
                    </span>
                )}
                <ChevronRight size={18} className={styles.phraseArrow} />
            </div>
        </button>
    );
}

// Detail modal/overlay
function PhraseDetail({ term, onClose }: { term: SlangTerm; onClose: () => void }) {
    const total = term.vote_count_up + term.vote_count_down;
    const score = total > 0 ? Math.round((term.vote_count_up / total) * 100) : null;

    return (
        <motion.div
            className={styles.detailOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.detailCard}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.detailClose} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.detailHeader}>
                    <h2 className={styles.detailTerm}>{term.term}</h2>
                    <span className={styles.detailType}>
                        {term.language_code.toUpperCase()}
                    </span>
                </div>

                <div className={styles.detailDefinition}>
                    {term.definition}
                </div>

                <div className={styles.detailFooter}>
                    {score !== null ? (
                        <div className={styles.detailScore}>
                            <div className={clsx(
                                styles.detailScoreCircle,
                                score >= 70 ? styles.scoreHigh : score >= 40 ? styles.scoreMid : styles.scoreLow
                            )}>
                                {score}%
                            </div>
                            <div className={styles.detailVotes}>
                                <span><ThumbsUp size={14} /> {term.vote_count_up}</span>
                                <span><ThumbsDown size={14} /> {term.vote_count_down}</span>
                            </div>
                        </div>
                    ) : (
                        <span className={styles.detailNoVotes}>まだ評価がありません</span>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// Swipe card for voting
interface SwipeVoteCardProps {
    term: SlangTerm;
    onSwipe: (vote: boolean) => void;
}

function SwipeVoteCard({ term, onSwipe }: SwipeVoteCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);

    const useOpacity = useTransform(x, [0, 100], [0, 1]);
    const dontUseOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe(true);
        } else if (info.offset.x < -threshold) {
            onSwipe(false);
        }
    };

    return (
        <motion.div
            className={styles.swipeCard}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
            {/* Use indicator */}
            <motion.div className={clsx(styles.swipeIndicator, styles.useIndicator)} style={{ opacity: useOpacity }}>
                <ThumbsUp size={32} />
                <span>使う</span>
            </motion.div>

            {/* Don't use indicator */}
            <motion.div className={clsx(styles.swipeIndicator, styles.dontUseIndicator)} style={{ opacity: dontUseOpacity }}>
                <ThumbsDown size={32} />
                <span>使わない</span>
            </motion.div>

            <div className={styles.swipeCardInner}>
                {/* Term */}
                <div className={styles.swipeTermSection}>
                    <div className={styles.swipeTermLarge}>{term.term}</div>
                    <span className={styles.swipeTermType}>{term.language_code.toUpperCase()}</span>
                </div>

                {/* Definition */}
                <div className={styles.swipeDefinition}>{term.definition}</div>
            </div>

            <div className={styles.swipeHint}>
                <div className={styles.swipeHintLeft}>
                    <ThumbsDown size={16} />
                    <span>使わない</span>
                </div>
                <div className={styles.swipeHintRight}>
                    <span>使う</span>
                    <ThumbsUp size={16} />
                </div>
            </div>
        </motion.div>
    );
}

// Demographics modal
function DemographicsModal({ onSubmit, onClose }: {
    onSubmit: (ageGroup: AgeGroup, gender: Gender) => void;
    onClose: () => void;
}) {
    const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
    const [gender, setGender] = useState<Gender | null>(null);

    const handleSubmit = () => {
        if (ageGroup && gender) {
            onSubmit(ageGroup, gender);
        }
    };

    return (
        <motion.div
            className={styles.detailOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={styles.demographicsCard}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
                <div className={styles.demographicsHeader}>
                    <User size={32} className={styles.demographicsIcon} />
                    <h2 className={styles.demographicsTitle}>統計情報</h2>
                    <p className={styles.demographicsSubtitle}>より良い分析のためにご協力ください</p>
                </div>

                <div className={styles.demographicsSection}>
                    <label className={styles.demographicsLabel}>年齢</label>
                    <div className={styles.demographicsOptions}>
                        {AGE_GROUPS.map(({ value, label }) => (
                            <button
                                key={value}
                                className={clsx(
                                    styles.demographicsOption,
                                    ageGroup === value && styles.demographicsOptionActive
                                )}
                                onClick={() => setAgeGroup(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.demographicsSection}>
                    <label className={styles.demographicsLabel}>性別</label>
                    <div className={styles.demographicsOptions}>
                        {GENDERS.map(({ value, label }) => (
                            <button
                                key={value}
                                className={clsx(
                                    styles.demographicsOption,
                                    gender === value && styles.demographicsOptionActive
                                )}
                                onClick={() => setGender(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.demographicsActions}>
                    <button
                        className={styles.demographicsSkip}
                        onClick={onClose}
                    >
                        スキップ
                    </button>
                    <button
                        className={styles.demographicsSubmit}
                        onClick={handleSubmit}
                        disabled={!ageGroup || !gender}
                    >
                        評価を始める
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Vote completion screen
function VoteComplete({ usedCount, notUsedCount, onRestart }: {
    usedCount: number;
    notUsedCount: number;
    onRestart: () => void;
}) {
    return (
        <div className={styles.completeContainer}>
            <div className={styles.completeIcon}>🎉</div>
            <h2 className={styles.completeTitle}>評価完了！</h2>
            <p className={styles.completeSubtitle}>ご協力ありがとうございます</p>

            <div className={styles.completeStats}>
                <div className={styles.completeStat}>
                    <ThumbsUp size={24} className={styles.useIcon} />
                    <span>{usedCount} 使う</span>
                </div>
                <div className={styles.completeStat}>
                    <ThumbsDown size={24} className={styles.dontUseIcon} />
                    <span>{notUsedCount} 使わない</span>
                </div>
            </div>

            <p className={styles.completeMessage}>
                あなたの評価がスラングの品質向上に貢献しました
            </p>

            <button className={styles.restartButton} onClick={onRestart}>
                一覧を見る
            </button>
        </div>
    );
}

export default function SlangPage() {
    const { terms, unvotedTerms, isLoading, isLoadingUnvoted, fetchSlang, fetchUnvotedSlangs, voteSlang, suggestSlang } = useSlangStore();
    const { activeLanguageCode, nativeLanguage, profile, user } = useAppStore();

    const [activeTab, setActiveTab] = useState<"list" | "vote" | "suggest">("list");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [usedCount, setUsedCount] = useState(0);
    const [notUsedCount, setNotUsedCount] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [selectedTerm, setSelectedTerm] = useState<SlangTerm | null>(null);
    const [showDemographics, setShowDemographics] = useState(false);
    const [demographics, setDemographics] = useState<{ ageGroup: AgeGroup; gender: Gender } | null>(null);

    // Suggest form state
    const [suggestTerm, setSuggestTerm] = useState('');
    const [suggestDefinition, setSuggestDefinition] = useState('');
    const [suggestLang, setSuggestLang] = useState<string>(nativeLanguage || '');
    const [suggestStatus, setSuggestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const userId = user?.id;

    // Fetch slangs on mount
    useEffect(() => {
        fetchSlang(activeLanguageCode, userId);
    }, [fetchSlang, activeLanguageCode, userId]);

    // Fetch unvoted slangs when vote tab is selected
    useEffect(() => {
        if (activeTab === "vote" && userId && nativeLanguage) {
            fetchUnvotedSlangs(nativeLanguage, userId);
            setCurrentIndex(0);
            setUsedCount(0);
            setNotUsedCount(0);
        }
    }, [activeTab, fetchUnvotedSlangs, nativeLanguage, userId]);

    // Filter terms for selected language
    const filteredTerms = useMemo(() => {
        if (!selectedLanguage) return [];
        return terms.filter(t => t.language_code === selectedLanguage);
    }, [terms, selectedLanguage]);

    // Available languages from terms with counts
    const availableLanguages = useMemo(() => {
        const langCounts = new Map<string, number>();
        terms.forEach(t => {
            langCounts.set(t.language_code, (langCounts.get(t.language_code) || 0) + 1);
        });
        return Array.from(langCounts.entries())
            .map(([code, count]) => ({ code, count }))
            .sort((a, b) => b.count - a.count);
    }, [terms]);

    const handleVoteTabClick = () => {
        if (!demographics) {
            setShowDemographics(true);
        } else {
            setActiveTab("vote");
        }
    };

    const handleDemographicsSubmit = (ageGroup: AgeGroup, gender: Gender) => {
        setDemographics({ ageGroup, gender });
        setShowDemographics(false);
        setActiveTab("vote");
    };

    const handleDemographicsSkip = () => {
        setShowDemographics(false);
        setActiveTab("vote");
    };

    const handleVote = (vote: boolean) => {
        const currentTerm = unvotedTerms[currentIndex];
        if (!currentTerm || !userId) return;

        voteSlang(currentTerm.id, userId, vote, demographics || undefined);

        if (vote) {
            setUsedCount(prev => prev + 1);
        } else {
            setNotUsedCount(prev => prev + 1);
        }

        setCurrentIndex(prev => prev + 1);
    };

    const handleRestart = () => {
        setActiveTab("list");
    };

    const handleSuggestSubmit = async () => {
        if (!suggestTerm.trim() || !suggestDefinition.trim() || !suggestLang.trim()) return;
        setSuggestStatus('submitting');
        const ok = await suggestSlang(suggestTerm.trim(), suggestDefinition.trim(), suggestLang.trim());
        if (ok) {
            setSuggestStatus('success');
            setSuggestTerm('');
            setSuggestDefinition('');
        } else {
            setSuggestStatus('error');
        }
    };

    const currentTerm = unvotedTerms[currentIndex];
    const isVoteComplete = activeTab === "vote" && currentIndex >= unvotedTerms.length && !isLoadingUnvoted;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <Sparkles size={28} className={styles.titleIcon} />
                    <h1 className={styles.title}>スラング</h1>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={clsx(styles.tab, activeTab === "list" && styles.tabActive)}
                        onClick={() => setActiveTab("list")}
                    >
                        <BookOpen size={18} />
                        <span>一覧</span>
                    </button>
                    <button
                        className={clsx(styles.tab, activeTab === "vote" && styles.tabActive)}
                        onClick={handleVoteTabClick}
                        disabled={!userId}
                        title={!userId ? "ログインが必要です" : undefined}
                    >
                        <Vote size={18} />
                        <span>評価</span>
                        {nativeLanguage && (
                            <span className={styles.tabBadge}>{nativeLanguage.toUpperCase()}</span>
                        )}
                    </button>
                    <button
                        className={clsx(styles.tab, activeTab === "suggest" && styles.tabActive)}
                        onClick={() => { setActiveTab("suggest"); setSuggestStatus('idle'); }}
                    >
                        <Plus size={18} />
                        <span>提案</span>
                    </button>
                </div>
            </div>

            {/* List Tab */}
            {activeTab === "list" && (
                <div className={styles.listContainer}>
                    {isLoading ? (
                        <div className={styles.loadingState}>Loading...</div>
                    ) : !selectedLanguage ? (
                        /* Language Selection Screen */
                        <div className={styles.languageSelectContainer}>
                            <div className={styles.languageSelectHeader}>
                                <Globe size={32} className={styles.globeIcon} />
                                <h2 className={styles.languageSelectTitle}>言語を選択</h2>
                                <p className={styles.languageSelectSubtitle}>どの言語のスラングを見ますか？</p>
                            </div>

                            {availableLanguages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>まだスラングが追加されていません</p>
                                </div>
                            ) : (
                                <div className={styles.languageGrid}>
                                    {availableLanguages.map(({ code, count }) => (
                                        <button
                                            key={code}
                                            className={styles.languageCard}
                                            onClick={() => setSelectedLanguage(code)}
                                        >
                                            <span className={styles.languageCode}>{code.toUpperCase()}</span>
                                            <span className={styles.languageName}>
                                                {LANGUAGE_NAMES[code] || code}
                                            </span>
                                            <span className={styles.languageCount}>{count}件</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Slang List for Selected Language */
                        <>
                            <button
                                className={styles.backButton}
                                onClick={() => setSelectedLanguage(null)}
                            >
                                <ChevronLeft size={20} />
                                <span>{LANGUAGE_NAMES[selectedLanguage] || selectedLanguage}</span>
                                <span className={styles.backCount}>{filteredTerms.length}件</span>
                            </button>

                            {filteredTerms.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>この言語のスラングはまだありません</p>
                                </div>
                            ) : (
                                <div className={styles.phraseList}>
                                    {filteredTerms.map(term => (
                                        <PhraseItem
                                            key={term.id}
                                            term={term}
                                            onClick={() => setSelectedTerm(term)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedTerm && (
                    <PhraseDetail
                        term={selectedTerm}
                        onClose={() => setSelectedTerm(null)}
                    />
                )}
            </AnimatePresence>

            {/* Demographics Modal */}
            <AnimatePresence>
                {showDemographics && (
                    <DemographicsModal
                        onSubmit={handleDemographicsSubmit}
                        onClose={handleDemographicsSkip}
                    />
                )}
            </AnimatePresence>

            {/* Suggest Tab */}
            {activeTab === "suggest" && (
                <div className={styles.suggestContainer}>
                    <div className={styles.suggestCard}>
                        <div className={styles.suggestHeader}>
                            <Send size={32} className={styles.suggestIcon} />
                            <h2 className={styles.suggestTitle}>スラングを提案</h2>
                            <p className={styles.suggestSubtitle}>あなたの知っているスラングを教えてください</p>
                        </div>

                        {suggestStatus === 'success' ? (
                            <div className={styles.suggestSuccess}>
                                <Check size={32} />
                                <p>提案を送信しました！承認後に公開されます。</p>
                                <button
                                    className={styles.restartButton}
                                    onClick={() => setSuggestStatus('idle')}
                                >
                                    もう一つ提案する
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={styles.suggestField}>
                                    <label className={styles.suggestLabel}>スラング</label>
                                    <input
                                        className={styles.suggestInput}
                                        value={suggestTerm}
                                        onChange={(e) => setSuggestTerm(e.target.value)}
                                        placeholder="例: エモい"
                                        maxLength={100}
                                    />
                                </div>

                                <div className={styles.suggestField}>
                                    <label className={styles.suggestLabel}>意味・説明</label>
                                    <textarea
                                        className={styles.suggestTextarea}
                                        value={suggestDefinition}
                                        onChange={(e) => setSuggestDefinition(e.target.value)}
                                        placeholder="このスラングの意味を説明してください..."
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>

                                <div className={styles.suggestField}>
                                    <label className={styles.suggestLabel}>言語</label>
                                    <div className={styles.suggestLangGrid}>
                                        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                                            <button
                                                key={code}
                                                className={clsx(
                                                    styles.suggestLangBtn,
                                                    suggestLang === code && styles.suggestLangBtnActive
                                                )}
                                                onClick={() => setSuggestLang(code)}
                                            >
                                                {code.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {suggestStatus === 'error' && (
                                    <p className={styles.suggestError}>送信に失敗しました。もう一度お試しください。</p>
                                )}

                                <button
                                    className={styles.suggestSubmitBtn}
                                    onClick={handleSuggestSubmit}
                                    disabled={!suggestTerm.trim() || !suggestDefinition.trim() || !suggestLang || suggestStatus === 'submitting'}
                                >
                                    <Send size={16} />
                                    {suggestStatus === 'submitting' ? '送信中...' : '提案する'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Vote Tab */}
            {activeTab === "vote" && (
                <div className={styles.voteContainer}>
                    {!userId ? (
                        <div className={styles.emptyState}>
                            <p>評価するにはログインが必要です</p>
                        </div>
                    ) : isLoadingUnvoted ? (
                        <div className={styles.loadingState}>Loading...</div>
                    ) : isVoteComplete ? (
                        <VoteComplete
                            usedCount={usedCount}
                            notUsedCount={notUsedCount}
                            onRestart={handleRestart}
                        />
                    ) : unvotedTerms.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Check size={48} className={styles.emptyIcon} />
                            <p>すべて評価済みです！</p>
                            <p className={styles.emptySubtext}>新しいスラングが追加されたらまた評価できます</p>
                        </div>
                    ) : (
                        <>
                            {/* Progress */}
                            <div className={styles.voteProgress}>
                                <span>{currentIndex + 1} / {unvotedTerms.length}</span>
                            </div>

                            {/* Card Stack */}
                            <div className={styles.cardStack}>
                                <AnimatePresence mode="wait">
                                    {currentTerm && (
                                        <SwipeVoteCard
                                            key={currentTerm.id}
                                            term={currentTerm}
                                            onSwipe={handleVote}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Stats */}
                            <div className={styles.voteStats}>
                                <span className={styles.usedStat}>
                                    <ThumbsUp size={16} /> {usedCount}
                                </span>
                                <span className={styles.notUsedStat}>
                                    <ThumbsDown size={16} /> {notUsedCount}
                                </span>
                            </div>

                            {/* Quit Button */}
                            <button className={styles.quitButton} onClick={handleRestart}>
                                <X size={16} />
                                やめる
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
