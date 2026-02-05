"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { useAppStore } from "@/store/app-context";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { PHRASES, Phrase } from "@/lib/data";
import { adaptToPhrase } from "@/lib/phrase-adapter";
import { translations } from "@/lib/translations";
import TokenizedSentence from "@/components/TokenizedSentence";
import { Volume2, X, Heart, RotateCcw, Settings2, ChevronLeft, Play, BookOpen, Layers, Plus, ArrowRight, MoreVertical, Pencil, Trash2, TrendingUp, Target, Flame, Clock, BarChart3 } from "lucide-react";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { tryPlayPreGenerated } from "@/lib/tts-storage";
import { useSettingsStore } from "@/store/settings-store";
import { CreatePhraseSetModal } from "@/components/CreatePhraseSetModal";
import { AddSwipeCardModal } from "@/components/AddSwipeCardModal";
import { EditCardModal } from "@/components/EditCardModal";
import { DeckStatsModal } from "@/components/DeckStatsModal";
import {
    recordReview,
    startStudySession,
    endStudySession,
    getPhraseSetProgress,
    getUserLearningStats,
    getItemReviews,
    type PhraseSetProgress,
    type UserLearningStats,
    type ItemReview,
} from "@/actions/learning-stats";
import styles from "./swipe-deck.module.css";
import clsx from "clsx";

// Card display modes
type CardFrontMode = "target" | "native" | "pinyin" | "audio_only";
type CardBackMode = "translation" | "target" | "hidden";

interface DeckSettings {
    frontMode: CardFrontMode;
    backMode: CardBackMode;
    showPinyin: boolean;
    autoPlayAudio: boolean;
    shuffleCards: boolean;
}

interface SwipeCardProps {
    phrase: Phrase;
    settings: DeckSettings;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
    onAudioPlay?: () => void;
}

function SwipeCard({ phrase, settings, onSwipe, isTop, onAudioPlay }: SwipeCardProps) {
    const { activeLanguageCode, nativeLanguage } = useAppStore();
    const { playbackSpeed, ttsVoice, ttsLearnerMode } = useSettingsStore();
    const [isFlipped, setIsFlipped] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleCardTap = (e: React.MouseEvent | React.TouchEvent) => {
        // Don't flip if clicking on a button
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        // Only flip if not dragging (small movement threshold)
        if (Math.abs(x.get()) < 10) {
            setIsFlipped(!isFlipped);
        }
    };

    const targetText = phrase.translations?.[activeLanguageCode] || "";
    const rawTokens = phrase.tokensMap?.[activeLanguageCode] || [];
    // Ensure tokens is a flat string array (not string[][])
    const tokens = Array.isArray(rawTokens) && rawTokens.length > 0 && Array.isArray(rawTokens[0])
        ? (rawTokens as string[][]).flat()
        : (rawTokens as string[]);
    const nativeText = phrase.translations?.[nativeLanguage] || phrase.translation || "";

    // Extract custom reading from tokens (stored as __reading__:value)
    const customReading = useMemo(() => {
        if (!phrase.tokens) return null;
        const readingToken = phrase.tokens.find((t: string) => t.startsWith("__reading__:"));
        return readingToken ? readingToken.replace("__reading__:", "") : null;
    }, [phrase.tokens]);

    // Get pinyin/reading text - prefer custom reading, fall back to token-based
    const readingText = useMemo(() => {
        if (customReading) return customReading;
        if (activeLanguageCode === "zh") {
            return tokens.map((t: any) => t.pinyin || t.reading || "").filter(Boolean).join(" ");
        }
        return null;
    }, [customReading, tokens, activeLanguageCode]);

    const playAudio = useCallback(async () => {
        if (audioLoading) return;
        setAudioLoading(true);
        onAudioPlay?.();

        try {
            const played = await tryPlayPreGenerated(phrase.id, activeLanguageCode, playbackSpeed);
            if (!played) {
                const result = await generateSpeech(targetText, activeLanguageCode, ttsVoice, ttsLearnerMode);
                if (result && 'data' in result) {
                    await playBase64Audio(result.data);
                }
            }
        } catch (error) {
            console.error("Audio playback failed:", error);
        } finally {
            setAudioLoading(false);
        }
    }, [audioLoading, phrase.id, activeLanguageCode, playbackSpeed, targetText, ttsVoice, ttsLearnerMode, onAudioPlay]);

    useEffect(() => {
        if (isTop && settings.autoPlayAudio) {
            const timer = setTimeout(playAudio, 300);
            return () => clearTimeout(timer);
        }
    }, [isTop, settings.autoPlayAudio]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            setExitDirection("right");
            onSwipe("right");
        } else if (info.offset.x < -threshold) {
            setExitDirection("left");
            onSwipe("left");
        }
    };

    const renderFrontContent = () => {
        switch (settings.frontMode) {
            case "native":
                return <div className={styles.mainText}>{nativeText}</div>;
            case "pinyin":
                return readingText ? (
                    <div className={styles.mainText}>{readingText}</div>
                ) : (
                    <div className={styles.mainText}>{targetText}</div>
                );
            case "audio_only":
                return (
                    <div className={styles.audioOnlyContent}>
                        <button
                            className={styles.bigAudioButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                playAudio();
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            disabled={audioLoading}
                        >
                            <Volume2 size={48} className={audioLoading ? styles.audioLoading : ""} />
                        </button>
                        <p className={styles.audioHint}>タップして聴く</p>
                    </div>
                );
            case "target":
            default:
                return (
                    <div className={styles.mainText}>
                        <TokenizedSentence text={targetText} tokens={tokens} phraseId={phrase.id} />
                        {settings.showPinyin && readingText && (
                            <div className={styles.pinyinSubtext}>{readingText}</div>
                        )}
                    </div>
                );
        }
    };

    const renderBackContent = () => {
        if (settings.backMode === "hidden") return null;
        const backText = settings.backMode === "translation" ? nativeText : targetText;

        return (
            <div className={styles.backContentText}>
                {settings.backMode === "target" ? (
                    <TokenizedSentence text={backText} tokens={tokens} phraseId={phrase.id} />
                ) : (
                    backText
                )}
            </div>
        );
    };

    if (!isTop) {
        return (
            <motion.div className={styles.card} style={{ scale: 0.95, y: 10, zIndex: 0 }}>
                <div className={styles.cardInner}>
                    <div className={styles.cardFace}>
                        {renderFrontContent()}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.card}
            style={{ x, rotate, opacity, zIndex: 1 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={
                exitDirection
                    ? { x: exitDirection === "right" ? 500 : -500, opacity: 0, rotate: exitDirection === "right" ? 30 : -30 }
                    : { scale: 1, y: 0, opacity: 1 }
            }
            exit={{ x: exitDirection === "right" ? 500 : -500, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            onClick={handleCardTap}
        >
            <motion.div className={clsx(styles.indicator, styles.likeIndicator)} style={{ opacity: likeOpacity }}>
                <Heart size={32} />
                <span>覚えた</span>
            </motion.div>
            <motion.div className={clsx(styles.indicator, styles.nopeIndicator)} style={{ opacity: nopeOpacity }}>
                <X size={32} />
                <span>もう一度</span>
            </motion.div>

            <div className={clsx(styles.cardInner, isFlipped && styles.cardFlipped)}>
                {/* Front face */}
                <div className={styles.cardFace}>
                    {renderFrontContent()}

                    {settings.frontMode !== "audio_only" && (
                        <button
                            className={styles.audioButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                playAudio();
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            disabled={audioLoading}
                        >
                            <Volume2 size={24} className={audioLoading ? styles.audioLoading : ""} />
                        </button>
                    )}

                    {settings.backMode !== "hidden" && (
                        <div className={styles.flipHint}>
                            <span>タップで裏返す</span>
                        </div>
                    )}
                </div>

                {/* Back face */}
                <div className={styles.cardFaceBack}>
                    {renderBackContent()}

                    <button
                        className={styles.audioButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            playAudio();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={audioLoading}
                    >
                        <Volume2 size={24} className={audioLoading ? styles.audioLoading : ""} />
                    </button>

                    <div className={styles.flipHint}>
                        <span>タップで戻す</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Settings Panel Component
function SettingsPanel({
    settings,
    onSettingsChange,
    onClose,
    activeLanguageCode,
}: {
    settings: DeckSettings;
    onSettingsChange: (settings: DeckSettings) => void;
    onClose: () => void;
    activeLanguageCode: string;
}) {
    // Reading label by language
    const readingLabels: Record<string, string> = {
        zh: "ピンイン",
        ja: "読み仮名",
        ko: "発音",
        en: "発音記号",
        fr: "発音記号",
        es: "発音記号",
        de: "発音記号",
        ru: "発音",
        vi: "声調",
    };
    const readingLabel = readingLabels[activeLanguageCode] || "読み";

    return (
        <motion.div
            className={styles.settingsPanel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            <div className={styles.settingsHeader}>
                <h3>カード設定</h3>
                <button onClick={onClose} className={styles.closeButton}>
                    <X size={20} />
                </button>
            </div>

            <div className={styles.settingsContent}>
                <div className={styles.settingGroup}>
                    <label>カードの表面</label>
                    <div className={styles.optionButtons}>
                        <button
                            className={clsx(styles.optionBtn, settings.frontMode === "target" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, frontMode: "target" })}
                        >
                            学習言語
                        </button>
                        <button
                            className={clsx(styles.optionBtn, settings.frontMode === "native" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, frontMode: "native" })}
                        >
                            母語
                        </button>
                        <button
                            className={clsx(styles.optionBtn, settings.frontMode === "pinyin" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, frontMode: "pinyin" })}
                        >
                            {readingLabel}
                        </button>
                        <button
                            className={clsx(styles.optionBtn, settings.frontMode === "audio_only" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, frontMode: "audio_only" })}
                        >
                            音声のみ
                        </button>
                    </div>
                </div>

                <div className={styles.settingGroup}>
                    <label>カードの裏面</label>
                    <div className={styles.optionButtons}>
                        <button
                            className={clsx(styles.optionBtn, settings.backMode === "translation" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, backMode: "translation" })}
                        >
                            翻訳
                        </button>
                        <button
                            className={clsx(styles.optionBtn, settings.backMode === "target" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, backMode: "target" })}
                        >
                            学習言語
                        </button>
                        <button
                            className={clsx(styles.optionBtn, settings.backMode === "hidden" && styles.optionActive)}
                            onClick={() => onSettingsChange({ ...settings, backMode: "hidden" })}
                        >
                            なし
                        </button>
                    </div>
                </div>

                <div className={styles.settingGroup}>
                    <label>オプション</label>
                    <div className={styles.toggleOptions}>
                        {settings.frontMode === "target" && (
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={settings.showPinyin}
                                    onChange={(e) => onSettingsChange({ ...settings, showPinyin: e.target.checked })}
                                />
                                <span>{readingLabel}を表示</span>
                            </label>
                        )}
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={settings.autoPlayAudio}
                                onChange={(e) => onSettingsChange({ ...settings, autoPlayAudio: e.target.checked })}
                            />
                            <span>自動再生</span>
                        </label>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={settings.shuffleCards}
                                onChange={(e) => onSettingsChange({ ...settings, shuffleCards: e.target.checked })}
                            />
                            <span>シャッフル</span>
                        </label>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Deck Menu Component
function DeckMenu({
    onAddCards,
    onShowStats,
    onDelete,
    onClose,
}: {
    onAddCards: () => void;
    onShowStats: () => void;
    onDelete: () => void;
    onClose: () => void;
}) {
    return (
        <>
            <div className={styles.menuOverlay} onClick={onClose} />
            <motion.div
                className={styles.deckMenu}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <button className={styles.menuItem} onClick={onShowStats}>
                    <BarChart3 size={18} />
                    <span>学習管理</span>
                </button>
                <button className={styles.menuItem} onClick={onAddCards}>
                    <Plus size={18} />
                    <span>カードを追加</span>
                </button>
                <button className={clsx(styles.menuItem, styles.menuItemDanger)} onClick={onDelete}>
                    <Trash2 size={18} />
                    <span>デッキを削除</span>
                </button>
            </motion.div>
        </>
    );
}

// ============================================
// DECK SELECTION SCREEN
// ============================================
function DeckSelectionScreen({
    phraseSets,
    builtinCount,
    onSelectDeck,
    onCreateDeck,
    onManageDeck,
    onShowStats,
    deckProgress,
    userStats,
}: {
    phraseSets: any[];
    builtinCount: number;
    onSelectDeck: (deckId: string) => void;
    onCreateDeck: () => void;
    onManageDeck: (deckId: string, action: "addCards" | "delete") => void;
    onShowStats: (deckId: string) => void;
    deckProgress: Record<string, PhraseSetProgress>;
    userStats: UserLearningStats | null;
}) {
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    // Calculate progress percentage
    const getProgressPercent = (progress: PhraseSetProgress | undefined, total: number) => {
        if (!progress || total === 0) return 0;
        return Math.round((progress.mastered_count / total) * 100);
    };

    return (
        <div className={styles.selectionContainer}>
            <div className={styles.selectionHeader}>
                <Layers size={32} className={styles.selectionIcon} />
                <h1>スワイプ学習</h1>
                <p>学習するデッキを選択してください</p>
            </div>

            {/* User Stats Summary */}
            {userStats && (userStats.current_streak > 0 || userStats.mastered_items > 0) && (
                <div className={styles.userStatsBar}>
                    <div className={styles.statBadge}>
                        <Flame size={16} />
                        <span>{userStats.current_streak}日連続</span>
                    </div>
                    <div className={styles.statBadge}>
                        <Target size={16} />
                        <span>{userStats.mastered_items}語習得</span>
                    </div>
                    <div className={styles.statBadge}>
                        <TrendingUp size={16} />
                        <span>{userStats.total_reviews}回</span>
                    </div>
                </div>
            )}

            <div className={styles.deckGrid}>
                {/* Built-in deck */}
                <motion.div className={styles.deckCard} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button className={styles.deckCardMain} onClick={() => onSelectDeck("builtin")}>
                        <div className={styles.deckCardColor} style={{ background: "#D94528" }} />
                        <div className={styles.deckCardContent}>
                            <h3>基本フレーズ</h3>
                            <p className={styles.deckCardCount}>{builtinCount} カード</p>
                        </div>
                        <ArrowRight size={20} className={styles.deckCardArrow} />
                    </button>
                </motion.div>

                {/* Custom decks */}
                {phraseSets.map((set) => {
                    const progress = deckProgress[set.id];
                    const progressPercent = getProgressPercent(progress, set.phrase_count || 0);

                    return (
                        <motion.div
                            key={set.id}
                            className={styles.deckCard}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <button className={styles.deckCardMain} onClick={() => onSelectDeck(set.id)}>
                                <div className={styles.deckCardColorWrapper}>
                                    <div className={styles.deckCardColor} style={{ background: set.color || "#888" }} />
                                    {progressPercent > 0 && (
                                        <svg className={styles.progressRing} viewBox="0 0 48 48">
                                            <circle
                                                cx="24"
                                                cy="24"
                                                r="22"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.3)"
                                                strokeWidth="4"
                                            />
                                            <circle
                                                cx="24"
                                                cy="24"
                                                r="22"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="4"
                                                strokeDasharray={`${progressPercent * 1.38} 138`}
                                                strokeLinecap="round"
                                                transform="rotate(-90 24 24)"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div className={styles.deckCardContent}>
                                    <h3>{set.name}</h3>
                                    <p className={styles.deckCardCount}>
                                        {set.phrase_count || 0} カード
                                        {progress && progress.mastered_count > 0 && (
                                            <span className={styles.masteredBadge}>
                                                ✓{progress.mastered_count}
                                            </span>
                                        )}
                                    </p>
                                    {progress && progress.due_count > 0 && (
                                        <p className={styles.dueCount}>
                                            <Clock size={12} />
                                            {progress.due_count}件の復習待ち
                                        </p>
                                    )}
                                    {set.description && !progress?.due_count && (
                                        <p className={styles.deckCardDesc}>{set.description}</p>
                                    )}
                                </div>
                                <ArrowRight size={20} className={styles.deckCardArrow} />
                            </button>
                            <button
                                className={styles.deckMenuBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(menuOpenId === set.id ? null : set.id);
                                }}
                            >
                                <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                                {menuOpenId === set.id && (
                                    <DeckMenu
                                        onShowStats={() => {
                                            setMenuOpenId(null);
                                            onShowStats(set.id);
                                        }}
                                        onAddCards={() => {
                                            setMenuOpenId(null);
                                            onManageDeck(set.id, "addCards");
                                        }}
                                        onDelete={() => {
                                            setMenuOpenId(null);
                                            onManageDeck(set.id, "delete");
                                        }}
                                        onClose={() => setMenuOpenId(null)}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}

                {/* Create new deck button */}
                <motion.button
                    className={clsx(styles.deckCard, styles.deckCardNew)}
                    onClick={onCreateDeck}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus size={24} />
                    <span>新しいデッキを作成</span>
                </motion.button>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function SwipeDeckPage() {
    const { activeLanguageCode, nativeLanguage, user } = useAppStore();
    const {
        phraseSets,
        currentSetPhrases,
        isLoadingPhrases,
        fetchPhraseSets,
        setCurrentSet,
        createPhraseSet,
        deletePhraseSet,
        addPhrases,
        updatePhrase,
    } = usePhraseSetStore();

    // Learning state
    const [isLearning, setIsLearning] = useState(false);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [knownPhrases, setKnownPhrases] = useState<Phrase[]>([]);
    const [reviewPhrases, setReviewPhrases] = useState<Phrase[]>([]);
    const [history, setHistory] = useState<{ phrase: Phrase; action: "known" | "review" }[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddPhrasesModal, setShowAddPhrasesModal] = useState(false);
    const [managingDeckId, setManagingDeckId] = useState<string | null>(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [statsDeckId, setStatsDeckId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Learning statistics state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [deckProgress, setDeckProgress] = useState<Record<string, PhraseSetProgress>>({});
    const [userStats, setUserStats] = useState<UserLearningStats | null>(null);
    const [itemReviews, setItemReviews] = useState<Record<string, ItemReview>>({});
    const sessionStats = useRef({ newItemsLearned: 0, itemsMastered: 0 });

    const [settings, setSettings] = useState<DeckSettings>({
        frontMode: "target",
        backMode: "translation",
        showPinyin: false,
        autoPlayAudio: false,
        shuffleCards: false,
    });

    // Fetch phrase sets on mount
    useEffect(() => {
        if (user) {
            fetchPhraseSets(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchPhraseSets]);

    // Fetch user learning stats
    useEffect(() => {
        const fetchStats = async () => {
            const stats = await getUserLearningStats(activeLanguageCode);
            if (stats) setUserStats(stats);
        };
        fetchStats();
    }, [activeLanguageCode]);

    // Fetch deck progress for all phrase sets
    useEffect(() => {
        const fetchProgress = async () => {
            const progressMap: Record<string, PhraseSetProgress> = {};
            for (const set of phraseSets) {
                const progress = await getPhraseSetProgress(set.id);
                if (progress) {
                    progressMap[set.id] = progress;
                }
            }
            setDeckProgress(progressMap);
        };
        if (phraseSets.length > 0) {
            fetchProgress();
        }
    }, [phraseSets]);

    // Handle deck selection and load phrases
    useEffect(() => {
        if (selectedDeckId && selectedDeckId !== "builtin") {
            setCurrentSet(selectedDeckId);
        }
    }, [selectedDeckId, setCurrentSet]);

    // Count builtin phrases
    const builtinCount = useMemo(() => {
        return PHRASES.filter((p) => p.translations?.[activeLanguageCode]).length;
    }, [activeLanguageCode]);

    // Get phrases based on selected deck
    const basePhrases = useMemo(() => {
        if (!selectedDeckId) return [];
        if (selectedDeckId === "builtin") {
            return PHRASES.filter((p) => p.translations?.[activeLanguageCode]);
        }
        return currentSetPhrases.map((item) => adaptToPhrase(item, activeLanguageCode));
    }, [selectedDeckId, activeLanguageCode, currentSetPhrases]);

    // Apply shuffle if enabled
    const phrases = useMemo(() => {
        if (settings.shuffleCards) {
            return shuffleArray(basePhrases);
        }
        return basePhrases;
    }, [basePhrases, settings.shuffleCards]);

    const currentPhrase = phrases[currentIndex];
    const nextPhrase = phrases[currentIndex + 1];

    const handleSelectDeck = async (deckId: string) => {
        setSelectedDeckId(deckId);
        setIsLearning(true);
        setCurrentIndex(0);
        setKnownPhrases([]);
        setReviewPhrases([]);
        setHistory([]);
        sessionStats.current = { newItemsLearned: 0, itemsMastered: 0 };

        // Start study session (for custom decks only)
        if (deckId !== "builtin") {
            const result = await startStudySession(deckId, activeLanguageCode);
            if (result.success && result.sessionId) {
                setSessionId(result.sessionId);
            }

            // Load existing item reviews
            const reviews = await getItemReviews(deckId);
            const reviewMap: Record<string, ItemReview> = {};
            reviews.forEach(r => {
                reviewMap[r.phrase_set_item_id] = r;
            });
            setItemReviews(reviewMap);
        }
    };

    const handleBackToSelection = async () => {
        // End study session if active
        if (sessionId && selectedDeckId !== "builtin") {
            await endStudySession(sessionId, {
                itemsReviewed: knownPhrases.length + reviewPhrases.length,
                itemsCorrect: knownPhrases.length,
                itemsIncorrect: reviewPhrases.length,
                newItemsLearned: sessionStats.current.newItemsLearned,
                itemsMastered: sessionStats.current.itemsMastered,
            });

            // Refresh user stats
            const stats = await getUserLearningStats(activeLanguageCode);
            if (stats) setUserStats(stats);

            // Refresh deck progress
            if (selectedDeckId) {
                const progress = await getPhraseSetProgress(selectedDeckId);
                if (progress) {
                    setDeckProgress(prev => ({ ...prev, [selectedDeckId]: progress }));
                }
            }
        }

        setIsLearning(false);
        setSelectedDeckId(null);
        setCurrentIndex(0);
        setKnownPhrases([]);
        setReviewPhrases([]);
        setHistory([]);
        setSessionId(null);
        setItemReviews({});
    };

    const handleCreateDeck = async (name: string, description: string, color: string) => {
        if (!user) return;
        const newSet = await createPhraseSet(user.id, activeLanguageCode, name, { description, color });
        if (newSet) {
            setManagingDeckId(newSet.id);
            setCurrentSet(newSet.id);
            setShowAddPhrasesModal(true);
        }
    };

    const handleManageDeck = (deckId: string, action: "addCards" | "delete") => {
        if (action === "delete") {
            if (confirm("このデッキを削除しますか？")) {
                deletePhraseSet(deckId);
            }
        } else if (action === "addCards") {
            setManagingDeckId(deckId);
            setCurrentSet(deckId);
            setShowAddPhrasesModal(true);
        }
    };

    const handleAddPhrases = async (newPhrases: { target_text: string; translation: string; tokens?: string[] }[]) => {
        if (!managingDeckId) return;
        await addPhrases(managingDeckId, newPhrases);
    };

    const handleEditCard = async (updates: { target_text: string; translation: string; tokens?: string[] }) => {
        if (!currentPhrase?.phraseSetItemId) return;
        await updatePhrase(currentPhrase.phraseSetItemId, updates);
    };

    // Get current card data for editing
    const getCurrentCardEditData = () => {
        if (!currentPhrase) return { targetText: "", translation: "", reading: "" };

        const targetText = currentPhrase.translations?.[activeLanguageCode] || "";
        const nativeText = currentPhrase.translations?.[nativeLanguage] || currentPhrase.translation || "";

        // Extract reading from tokens
        let reading = "";
        if (currentPhrase.tokens) {
            const readingToken = currentPhrase.tokens.find((t: string) => t.startsWith("__reading__:"));
            reading = readingToken ? readingToken.replace("__reading__:", "") : "";
        }

        return {
            targetText,
            translation: nativeText,
            reading,
        };
    };

    const handleSwipe = async (direction: "left" | "right") => {
        if (!currentPhrase) return;

        if (direction === "right") {
            setKnownPhrases((prev) => [...prev, currentPhrase]);
            setHistory((prev) => [...prev, { phrase: currentPhrase, action: "known" }]);
        } else {
            setReviewPhrases((prev) => [...prev, currentPhrase]);
            setHistory((prev) => [...prev, { phrase: currentPhrase, action: "review" }]);
        }

        // Record review for custom deck items (quality: 2 = good, 0 = again)
        if (selectedDeckId !== "builtin" && currentPhrase.phraseSetItemId) {
            const quality = direction === "right" ? 2 : 0;
            const wasNew = !itemReviews[currentPhrase.phraseSetItemId];

            const result = await recordReview(currentPhrase.phraseSetItemId, quality);

            if (result.success && result.review) {
                // Track new items
                if (wasNew) {
                    sessionStats.current.newItemsLearned++;
                }

                // Track mastered items
                if (result.review.status === 'mastered' && itemReviews[currentPhrase.phraseSetItemId]?.status !== 'mastered') {
                    sessionStats.current.itemsMastered++;
                }

                // Update local review state
                setItemReviews(prev => ({
                    ...prev,
                    [currentPhrase.phraseSetItemId!]: result.review!
                }));
            }
        }

        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 200);
    };

    const handleUndo = () => {
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];
        setHistory((prev) => prev.slice(0, -1));

        if (lastAction.action === "known") {
            setKnownPhrases((prev) => prev.slice(0, -1));
        } else {
            setReviewPhrases((prev) => prev.slice(0, -1));
        }

        setCurrentIndex((prev) => prev - 1);
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setKnownPhrases([]);
        setReviewPhrases([]);
        setHistory([]);
    };

    // Modal translations
    const createSetTranslations = {
        create_phrase_set: "新しいデッキを作成",
        set_name: "デッキ名",
        set_name_placeholder: "例：英単語、HSK4級...",
        description: "説明",
        description_placeholder: "デッキの説明（任意）",
        color: "カラー",
        cancel: "キャンセル",
        create: "作成"
    };

    // ============================================
    // RENDER: Deck Selection Screen
    // ============================================
    if (!isLearning) {
        return (
            <>
                <DeckSelectionScreen
                    phraseSets={phraseSets}
                    builtinCount={builtinCount}
                    onSelectDeck={handleSelectDeck}
                    onCreateDeck={() => setShowCreateModal(true)}
                    onManageDeck={handleManageDeck}
                    onShowStats={(deckId) => {
                        setStatsDeckId(deckId);
                        setShowStatsModal(true);
                    }}
                    deckProgress={deckProgress}
                    userStats={userStats}
                />

                <CreatePhraseSetModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateDeck}
                    translations={createSetTranslations}
                />

                <AddSwipeCardModal
                    isOpen={showAddPhrasesModal}
                    onClose={() => {
                        setShowAddPhrasesModal(false);
                        setManagingDeckId(null);
                        // Refresh phrase sets to get updated counts
                        if (user) {
                            fetchPhraseSets(user.id, activeLanguageCode);
                        }
                    }}
                    onAdd={handleAddPhrases}
                    targetLang={activeLanguageCode}
                    nativeLang={nativeLanguage}
                />

                {statsDeckId && (
                    <DeckStatsModal
                        isOpen={showStatsModal}
                        onClose={() => {
                            setShowStatsModal(false);
                            setStatsDeckId(null);
                        }}
                        deckId={statsDeckId}
                        deckName={phraseSets.find(s => s.id === statsDeckId)?.name || ""}
                        deckColor={phraseSets.find(s => s.id === statsDeckId)?.color || "#888"}
                        totalCards={phraseSets.find(s => s.id === statsDeckId)?.phrase_count || 0}
                        onStartReview={(mode) => {
                            setShowStatsModal(false);
                            handleSelectDeck(statsDeckId);
                        }}
                    />
                )}
            </>
        );
    }

    // ============================================
    // RENDER: Completed State
    // ============================================
    if (currentIndex >= phrases.length && phrases.length > 0) {
        return (
            <div className={styles.container}>
                <div className={styles.completedState}>
                    <h2>セッション完了!</h2>
                    <p>{phrases.length}個のカードを学習しました</p>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <Heart size={24} className={styles.knownIcon} />
                            <span>{knownPhrases.length} 覚えた</span>
                        </div>
                        <div className={styles.statItem}>
                            <RotateCcw size={24} className={styles.reviewIcon} />
                            <span>{reviewPhrases.length} 要復習</span>
                        </div>
                    </div>

                    <div className={styles.completedActions}>
                        {reviewPhrases.length > 0 && (
                            <button
                                className={styles.reviewButton}
                                onClick={() => {
                                    setCurrentIndex(0);
                                    setKnownPhrases([]);
                                    setHistory([]);
                                }}
                            >
                                <RotateCcw size={20} />
                                要復習のみ ({reviewPhrases.length})
                            </button>
                        )}
                        <button className={styles.restartButton} onClick={handleRestart}>
                            <Play size={20} />
                            最初から
                        </button>
                        <button className={styles.backButton} onClick={handleBackToSelection}>
                            <ChevronLeft size={20} />
                            デッキ選択に戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // RENDER: Empty State (no cards in deck)
    // ============================================
    if (phrases.length === 0 && !isLoadingPhrases) {
        return (
            <div className={styles.container}>
                <div className={styles.learningHeader}>
                    <button className={styles.backBtn} onClick={handleBackToSelection}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className={styles.title}>スワイプ学習</h1>
                    <div style={{ width: 40 }} />
                </div>
                <div className={styles.emptyState}>
                    <BookOpen size={48} />
                    <h3>カードがありません</h3>
                    <p>このデッキにカードを追加してください</p>
                    {selectedDeckId && selectedDeckId !== "builtin" && (
                        <button
                            className={styles.addCardsBtn}
                            onClick={() => {
                                setManagingDeckId(selectedDeckId);
                                setShowAddPhrasesModal(true);
                            }}
                        >
                            <Plus size={20} />
                            カードを追加
                        </button>
                    )}
                    <button className={styles.backButton} onClick={handleBackToSelection}>
                        <ChevronLeft size={20} />
                        デッキ選択に戻る
                    </button>
                </div>

                <AddSwipeCardModal
                    isOpen={showAddPhrasesModal}
                    onClose={() => {
                        setShowAddPhrasesModal(false);
                        setManagingDeckId(null);
                        if (user) {
                            fetchPhraseSets(user.id, activeLanguageCode);
                        }
                    }}
                    onAdd={handleAddPhrases}
                    targetLang={activeLanguageCode}
                    nativeLang={nativeLanguage}
                />
            </div>
        );
    }

    // ============================================
    // RENDER: Learning Mode
    // ============================================
    const selectedDeck = selectedDeckId === "builtin"
        ? { name: "基本フレーズ", color: "#D94528" }
        : phraseSets.find((s) => s.id === selectedDeckId);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.learningHeader}>
                <button className={styles.backBtn} onClick={handleBackToSelection}>
                    <ChevronLeft size={24} />
                </button>
                <div className={styles.headerCenter}>
                    <div className={styles.deckBadge}>
                        <div className={styles.deckColorDot} style={{ background: selectedDeck?.color || "#D94528" }} />
                        <span>{selectedDeck?.name}</span>
                    </div>
                    <div className={styles.progress}>
                        {currentIndex + 1} / {phrases.length}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {selectedDeckId !== "builtin" && currentPhrase?.phraseSetItemId && (
                        <button className={styles.settingsButton} onClick={() => setShowEditModal(true)}>
                            <Pencil size={18} />
                        </button>
                    )}
                    <button className={styles.settingsButton} onClick={() => setShowSettings(!showSettings)}>
                        <Settings2 size={20} />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <SettingsPanel
                        settings={settings}
                        onSettingsChange={setSettings}
                        onClose={() => setShowSettings(false)}
                        activeLanguageCode={activeLanguageCode}
                    />
                )}
            </AnimatePresence>

            {/* Card Stack */}
            <div className={styles.cardStack}>
                {isLoadingPhrases ? (
                    <div className={styles.loadingState}>読み込み中...</div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {currentPhrase && (
                            <SwipeCard
                                key={`current-${currentPhrase.id}`}
                                phrase={currentPhrase}
                                settings={settings}
                                onSwipe={handleSwipe}
                                isTop={true}
                            />
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Stats bar */}
            <div className={styles.statsBar}>
                <span className={styles.knownCount}>
                    <Heart size={16} /> {knownPhrases.length}
                </span>
                <span className={styles.reviewCount}>
                    <RotateCcw size={16} /> {reviewPhrases.length}
                </span>
            </div>

            {/* Edit Card Modal */}
            <EditCardModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleEditCard}
                initialData={getCurrentCardEditData()}
                targetLang={activeLanguageCode}
                nativeLang={nativeLanguage}
            />
        </div>
    );
}
