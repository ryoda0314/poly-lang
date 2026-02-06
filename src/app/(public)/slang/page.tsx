"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { ThumbsUp, ThumbsDown, Check, BookOpen, Vote, ChevronLeft, ChevronRight, Globe, X, User } from "lucide-react";
import { useSlangStore, SlangTerm, AgeGroup, Gender } from "@/store/slang-store";
import { createClient } from "@/lib/supa-client";
import { getUILanguage, getTranslations } from "./translations";
import styles from "./slang.module.css";
import clsx from "clsx";

const AGE_GROUP_VALUES: AgeGroup[] = ['10s', '20s', '30s', '40s', '50s', '60plus'];
const GENDER_VALUES: Gender[] = ['male', 'female', 'other', 'prefer_not_to_say'];

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

// Get or create anonymous user via Supabase anonymous auth
async function getOrCreateAnonymousUser(): Promise<string | null> {
    const supabase = createClient();

    // Check if already signed in
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
        return session.user.id;
    }

    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        console.error("Failed to create anonymous user:", error);
        return null;
    }

    return data.user?.id || null;
}

// Get/set native language
function getNativeLanguage(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('slang_native_language');
}

function setNativeLanguage(code: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('slang_native_language', code);
}

// Native language selection component
function NativeLanguageSetup({
    onSelect,
    t,
}: {
    onSelect: (code: string) => void;
    t: (key: string) => string;
}) {
    const [showCustom, setShowCustom] = useState(false);
    const [customCode, setCustomCode] = useState('');

    const handleCustomSubmit = () => {
        const code = customCode.trim().toLowerCase();
        if (code.length >= 2) {
            onSelect(code);
        }
    };

    return (
        <div className={styles.setupContainer}>
            <div className={styles.setupCard}>
                <div className={styles.setupHeader}>
                    <Globe size={48} className={styles.setupIcon} />
                    <h1 className={styles.setupTitle}>{t('setup_title')}</h1>
                    <p className={styles.setupSubtitle}>{t('setup_subtitle')}</p>
                </div>

                <div className={styles.setupSection}>
                    <label className={styles.setupLabel}>{t('setup_label')}</label>
                    <p className={styles.setupDescription}>{t('setup_description')}</p>
                    <div className={styles.nativeLanguageGrid}>
                        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                            <button
                                key={code}
                                className={styles.nativeLanguageCard}
                                onClick={() => onSelect(code)}
                            >
                                <span className={styles.nativeLanguageCode}>{code.toUpperCase()}</span>
                                <span className={styles.nativeLanguageName}>{name}</span>
                            </button>
                        ))}
                        <button
                            className={clsx(styles.nativeLanguageCard, showCustom && styles.nativeLanguageCardActive)}
                            onClick={() => setShowCustom(true)}
                        >
                            <span className={styles.nativeLanguageCode}>+</span>
                            <span className={styles.nativeLanguageName}>{t('other_language')}</span>
                        </button>
                    </div>
                    {showCustom && (
                        <div className={styles.customLangRow}>
                            <input
                                className={styles.customLangInput}
                                type="text"
                                maxLength={5}
                                placeholder={t('custom_lang_placeholder')}
                                value={customCode}
                                onChange={(e) => setCustomCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                                autoFocus
                            />
                            <button
                                className={styles.customLangButton}
                                onClick={handleCustomSubmit}
                                disabled={customCode.trim().length < 2}
                            >
                                {t('custom_lang_confirm')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

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

function PhraseDetail({ term, onClose, t }: { term: SlangTerm; onClose: () => void; t: (key: string) => string }) {
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
                        <span className={styles.detailNoVotes}>{t('no_votes_yet')}</span>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

interface SwipeVoteCardProps {
    term: SlangTerm;
    onSwipe: (vote: boolean) => void;
    t: (key: string) => string;
}

function SwipeVoteCard({ term, onSwipe, t }: SwipeVoteCardProps) {
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
            <motion.div className={clsx(styles.swipeIndicator, styles.useIndicator)} style={{ opacity: useOpacity }}>
                <ThumbsUp size={32} />
                <span>{t('use')}</span>
            </motion.div>

            <motion.div className={clsx(styles.swipeIndicator, styles.dontUseIndicator)} style={{ opacity: dontUseOpacity }}>
                <ThumbsDown size={32} />
                <span>{t('dont_use')}</span>
            </motion.div>

            <div className={styles.swipeCardInner}>
                <div className={styles.swipeTermSection}>
                    <div className={styles.swipeTermLarge}>{term.term}</div>
                    <span className={styles.swipeTermType}>{term.language_code.toUpperCase()}</span>
                </div>

                <div className={styles.swipeDefinition}>{term.definition}</div>
            </div>

            <div className={styles.swipeHint}>
                <div className={styles.swipeHintLeft}>
                    <ThumbsDown size={16} />
                    <span>{t('dont_use')}</span>
                </div>
                <div className={styles.swipeHintRight}>
                    <span>{t('use')}</span>
                    <ThumbsUp size={16} />
                </div>
            </div>
        </motion.div>
    );
}

function DemographicsModal({ onSubmit, onClose, t }: {
    onSubmit: (ageGroup: AgeGroup, gender: Gender) => void;
    onClose: () => void;
    t: (key: string) => string;
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
                    <h2 className={styles.demographicsTitle}>{t('demographics_title')}</h2>
                    <p className={styles.demographicsSubtitle}>{t('demographics_subtitle')}</p>
                </div>

                <div className={styles.demographicsSection}>
                    <label className={styles.demographicsLabel}>{t('age_label')}</label>
                    <div className={styles.demographicsOptions}>
                        {AGE_GROUP_VALUES.map((value) => (
                            <button
                                key={value}
                                className={clsx(
                                    styles.demographicsOption,
                                    ageGroup === value && styles.demographicsOptionActive
                                )}
                                onClick={() => setAgeGroup(value)}
                            >
                                {t(`age_${value}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.demographicsSection}>
                    <label className={styles.demographicsLabel}>{t('gender_label')}</label>
                    <div className={styles.demographicsOptions}>
                        {GENDER_VALUES.map((value) => (
                            <button
                                key={value}
                                className={clsx(
                                    styles.demographicsOption,
                                    gender === value && styles.demographicsOptionActive
                                )}
                                onClick={() => setGender(value)}
                            >
                                {t(`gender_${value === 'prefer_not_to_say' ? 'prefer_not' : value}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.demographicsActions}>
                    <button
                        className={styles.demographicsSkip}
                        onClick={onClose}
                    >
                        {t('skip')}
                    </button>
                    <button
                        className={styles.demographicsSubmit}
                        onClick={handleSubmit}
                        disabled={!ageGroup || !gender}
                    >
                        {t('start_rating')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function VoteComplete({ usedCount, notUsedCount, onRestart, t }: {
    usedCount: number;
    notUsedCount: number;
    onRestart: () => void;
    t: (key: string) => string;
}) {
    return (
        <div className={styles.completeContainer}>
            <div className={styles.completeIcon}>🎉</div>
            <h2 className={styles.completeTitle}>{t('vote_complete_title')}</h2>
            <p className={styles.completeSubtitle}>{t('vote_complete_subtitle')}</p>

            <div className={styles.completeStats}>
                <div className={styles.completeStat}>
                    <ThumbsUp size={24} className={styles.useIcon} />
                    <span>{usedCount} {t('use')}</span>
                </div>
                <div className={styles.completeStat}>
                    <ThumbsDown size={24} className={styles.dontUseIcon} />
                    <span>{notUsedCount} {t('dont_use')}</span>
                </div>
            </div>

            <p className={styles.completeMessage}>
                {t('vote_complete_message')}
            </p>

            <button className={styles.restartButton} onClick={onRestart}>
                {t('view_list')}
            </button>
        </div>
    );
}

export default function PublicSlangPage() {
    const { terms, unvotedTerms, isLoading, isLoadingUnvoted, fetchSlang, fetchUnvotedSlangs, voteSlang } = useSlangStore();

    const [anonymousUserId, setAnonymousUserId] = useState<string>('');
    const [nativeLanguage, setNativeLanguageState] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [activeTab, setActiveTab] = useState<"list" | "vote">("list");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [usedCount, setUsedCount] = useState(0);
    const [notUsedCount, setNotUsedCount] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [selectedTerm, setSelectedTerm] = useState<SlangTerm | null>(null);
    const [showDemographics, setShowDemographics] = useState(false);
    const [demographics, setDemographics] = useState<{ ageGroup: AgeGroup; gender: Gender } | null>(null);

    // UI language based on browser setting
    const t = useMemo(() => getTranslations(getUILanguage()), []);

    // Initialize anonymous user and native language
    useEffect(() => {
        const init = async () => {
            const userId = await getOrCreateAnonymousUser();
            if (userId) {
                setAnonymousUserId(userId);
            }
            setNativeLanguageState(getNativeLanguage());
            setIsInitialized(true);
        };
        init();
    }, []);

    // Fetch slangs on mount (no auth needed for viewing)
    useEffect(() => {
        fetchSlang('', anonymousUserId || undefined);
    }, [fetchSlang, anonymousUserId]);

    // Fetch unvoted slangs when vote tab is selected (needs anonymous auth for tracking votes)
    useEffect(() => {
        if (activeTab === "vote" && anonymousUserId && nativeLanguage) {
            fetchUnvotedSlangs(nativeLanguage, anonymousUserId);
            setCurrentIndex(0);
            setUsedCount(0);
            setNotUsedCount(0);
        }
    }, [activeTab, fetchUnvotedSlangs, nativeLanguage, anonymousUserId]);

    // Retry anonymous auth if it failed initially
    const retryAnonymousAuth = async () => {
        const userId = await getOrCreateAnonymousUser();
        if (userId) {
            setAnonymousUserId(userId);
        }
    };

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

    // Handle native language selection
    const handleNativeLanguageSelect = (code: string) => {
        setNativeLanguage(code);
        setNativeLanguageState(code);
    };

    // Show setup screen if native language not set
    if (!isInitialized) {
        return <div className={styles.loadingState}>{t('loading')}</div>;
    }

    if (!nativeLanguage) {
        return <NativeLanguageSetup onSelect={handleNativeLanguageSelect} t={t} />;
    }

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
        if (!currentTerm || !anonymousUserId) return;

        voteSlang(currentTerm.id, anonymousUserId, vote, demographics || undefined);

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

    const currentTerm = unvotedTerms[currentIndex];
    const isVoteComplete = activeTab === "vote" && currentIndex >= unvotedTerms.length && !isLoadingUnvoted;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={clsx(styles.tab, activeTab === "list" && styles.tabActive)}
                        onClick={() => setActiveTab("list")}
                    >
                        <BookOpen size={18} />
                        <span>{t('tab_list')}</span>
                    </button>
                    <button
                        className={clsx(styles.tab, activeTab === "vote" && styles.tabActive)}
                        onClick={handleVoteTabClick}
                    >
                        <Vote size={18} />
                        <span>{t('tab_vote')}</span>
                        <span className={styles.tabBadge}>{nativeLanguage.toUpperCase()}</span>
                    </button>
                </div>
            </div>

            {/* List Tab */}
            {activeTab === "list" && (
                <div className={styles.listContainer}>
                    {isLoading ? (
                        <div className={styles.loadingState}>{t('loading')}</div>
                    ) : !selectedLanguage ? (
                        <div className={styles.languageSelectContainer}>
                            <div className={styles.languageSelectHeader}>
                                <Globe size={32} className={styles.globeIcon} />
                                <h2 className={styles.languageSelectTitle}>{t('lang_select_title')}</h2>
                                <p className={styles.languageSelectSubtitle}>{t('lang_select_subtitle')}</p>
                            </div>

                            {availableLanguages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>{t('no_slang_yet')}</p>
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
                                            <span className={styles.languageCount}>{count}{t('items_suffix')}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                className={styles.backButton}
                                onClick={() => setSelectedLanguage(null)}
                            >
                                <ChevronLeft size={20} />
                                <span>{LANGUAGE_NAMES[selectedLanguage] || selectedLanguage}</span>
                                <span className={styles.backCount}>{filteredTerms.length}{t('items_suffix')}</span>
                            </button>

                            {filteredTerms.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>{t('no_slang_for_lang')}</p>
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
                        t={t}
                    />
                )}
            </AnimatePresence>

            {/* Demographics Modal */}
            <AnimatePresence>
                {showDemographics && (
                    <DemographicsModal
                        onSubmit={handleDemographicsSubmit}
                        onClose={handleDemographicsSkip}
                        t={t}
                    />
                )}
            </AnimatePresence>

            {/* Vote Tab */}
            {activeTab === "vote" && (
                <div className={styles.voteContainer}>
                    {!anonymousUserId ? (
                        <div className={styles.emptyState}>
                            <p>{t('vote_unavailable')}</p>
                            <p className={styles.emptySubtext}>{t('try_again')}</p>
                            <button className={styles.restartButton} onClick={retryAnonymousAuth}>
                                {t('retry')}
                            </button>
                        </div>
                    ) : isLoadingUnvoted ? (
                        <div className={styles.loadingState}>{t('loading')}</div>
                    ) : isVoteComplete ? (
                        <VoteComplete
                            usedCount={usedCount}
                            notUsedCount={notUsedCount}
                            onRestart={handleRestart}
                            t={t}
                        />
                    ) : unvotedTerms.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Check size={48} className={styles.emptyIcon} />
                            <p>{t('all_rated')}</p>
                            <p className={styles.emptySubtext}>{t('all_rated_subtitle')}</p>
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
                                            t={t}
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
                                {t('quit')}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
