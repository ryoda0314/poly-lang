"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Folder, Volume2, Eye, EyeOff, Copy, Check, Trash2, Filter, ChevronDown, Plus, List, LayoutGrid, Lock, ShoppingBag, Type } from "lucide-react";
import Link from "next/link";
import { useCollectionsStore } from "@/store/collections-store";
import { useAppStore } from "@/store/app-context";
import { translations, NativeLanguage } from "@/lib/translations";
import TokenizedSentence from "@/components/TokenizedSentence";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio } from "@/lib/audio";
import { useExplorer } from "@/hooks/use-explorer";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import { useAwarenessStore } from "@/store/awareness-store";
import { useSettingsStore } from "@/store/settings-store";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import MemoDropZone from "@/components/MemoDropZone";
import clsx from "clsx";
import styles from "./page.module.css";
import { SpeedControlModal } from "@/components/SpeedControlModal";
import { VoiceSettingsModal } from "@/components/VoiceSettingsModal";
import { useLongPress } from "@/hooks/use-long-press";
import { queueIPAFetch, getCachedIPA } from "@/lib/ipa";
import { openIPA, onIPAChange, getIPAId } from "@/lib/ipa-accordion";
import StressColoredIPA from "@/components/StressColoredIPA";
import IPAText from "@/components/IPAText";

type FilterType = "all" | "uncategorized" | string;

const FILTER_STORAGE_KEY = 'poly.savedPhrasesFilter';

function getStoredFilter(): FilterType {
    if (typeof window === 'undefined') return 'all';
    try {
        return (window.localStorage.getItem(FILTER_STORAGE_KEY) as FilterType) || 'all';
    } catch {
        return 'all';
    }
}

// Compact list item for mobile
const PhraseListItem = ({ event, t }: { event: any; t: any }) => {
    const meta = event.meta || {};
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div onClick={() => setIsRevealed(!isRevealed)} className={styles.phraseListItem}>
            <div className={styles.listItemContent}>
                <div className={styles.listItemText}>{meta.text}</div>
                <div
                    className={styles.listItemTranslation}
                    style={{
                        opacity: isRevealed ? 1 : 0,
                        maxHeight: isRevealed ? "60px" : "0",
                    }}
                >
                    {meta.translation || t.noTranslation}
                </div>
            </div>
            <div className={styles.listItemIndicator}>
                <ChevronDown
                    size={16}
                    style={{
                        transform: isRevealed ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s"
                    }}
                />
            </div>
        </div>
    );
};

// Full card for desktop
const PhraseCard = ({ event, t, credits, langCode, profile }: { event: any; t: any; credits: number; langCode: string; profile: any }) => {
    const meta = event.meta || {};
    const [isRevealed, setIsRevealed] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const { playbackSpeed, togglePlaybackSpeed, setPlaybackSpeed, ttsVoice, ttsLearnerMode, setTtsVoice, setTtsLearnerMode, ipaMode, setIPAMode } = useSettingsStore();

    // IPA state
    const [ipaRevealed, setIpaRevealed] = useState(false);
    const [ipa, setIpa] = useState("");
    const [ipaLoading, setIpaLoading] = useState(false);
    const ipaIdRef = useRef(getIPAId());

    // IPA accordion: close when another IPA opens
    useEffect(() => {
        return onIPAChange((activeId) => {
            if (activeId !== ipaIdRef.current) {
                setIpaRevealed(false);
            }
        });
    }, []);

    // Check if target text is English (for IPA button)
    const targetIsEnglish = useMemo(() => {
        const text = meta.text;
        if (!text) return false;
        const stripped = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
        if (stripped.length === 0) return false;
        const latinCount = (stripped.match(/[a-zA-Z\u00C0-\u024F]/g) || []).length;
        return latinCount / stripped.length > 0.7;
    }, [meta.text]);

    // Fetch IPA when toggled
    useEffect(() => {
        if (!ipaRevealed || !targetIsEnglish || !meta.text?.trim()) return;
        const cached = getCachedIPA(meta.text, ipaMode);
        if (cached) { setIpa(cached); return; }
        setIpaLoading(true);
        const cleanup = queueIPAFetch(meta.text, ipaMode, (result) => {
            setIpa(result);
            setIpaLoading(false);
        });
        return cleanup;
    }, [ipaRevealed, ipaMode, meta.text, targetIsEnglish]);

    // Check if user has audio premium (speed control + voice selection)
    const hasAudioPremium = useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("audio_premium");
    }, [profile]);

    // Long-press modals
    const [speedModalOpen, setSpeedModalOpen] = useState(false);
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);

    // Token boundaries display (long-press on card)
    const [showTokenBoundaries, setShowTokenBoundaries] = useState(false);
    const tokenBoundariesBind = useLongPress({
        threshold: 400,
        onLongPress: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button[data-token-index]')) return;
            setShowTokenBoundaries(true);
            if (navigator.vibrate) navigator.vibrate(30);
        },
    });
    const handleTokenBoundariesRelease = () => setShowTokenBoundaries(false);

    const lpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lpTriggeredRef = useRef(false);
    const [lpIndicator, setLpIndicator] = useState<{ x: number; y: number; exiting?: boolean } | null>(null);
    const makeLongPress = useCallback((onClick: () => void, onLongPress: () => void) => {
        const startLp = (el: HTMLElement) => {
            lpTriggeredRef.current = false;
            lpTimerRef.current = setTimeout(() => {
                lpTriggeredRef.current = true;
                const rect = el.getBoundingClientRect();
                setLpIndicator({ x: rect.left, y: rect.top + rect.height / 2 });
            }, 400);
        };
        const endLp = (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
            if ('preventDefault' in e && 'touches' in e) (e as React.TouchEvent).preventDefault();
            if (lpTimerRef.current) clearTimeout(lpTimerRef.current);
            const wasLongPress = lpTriggeredRef.current;
            if (wasLongPress) {
                setLpIndicator(prev => prev ? { ...prev, exiting: true } : null);
                setTimeout(() => setLpIndicator(null), 250);
                onLongPress();
            } else {
                setLpIndicator(null);
                onClick();
            }
        };
        const cancelLp = () => {
            if (lpTimerRef.current) { clearTimeout(lpTimerRef.current); lpTimerRef.current = null; }
            setLpIndicator(null);
            lpTriggeredRef.current = false;
        };
        return {
            onMouseDown: (e: React.MouseEvent) => startLp(e.currentTarget as HTMLElement),
            onMouseUp: endLp,
            onMouseLeave: cancelLp,
            onTouchStart: (e: React.TouchEvent) => startLp(e.currentTarget as HTMLElement),
            onTouchEnd: endLp,
        };
    }, []);

    const handlePlay = async () => {
        if (audioLoading) return;
        if (credits <= 0) {
            alert(t.stream_insufficient_audio_credits || "Insufficient audio credits");
            return;
        }
        setAudioLoading(true);
        try {
            const result = await generateSpeech(meta.text, langCode, ttsVoice, ttsLearnerMode);
            console.log('[DEBUG] generateSpeech result:', result);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType, playbackRate: playbackSpeed });
            } else {
                console.warn('[DEBUG] Gemini TTS failed, falling back to browser TTS. Error:', result);
                if ("speechSynthesis" in window) {
                    const u = new SpeechSynthesisUtterance(meta.text);
                    u.lang = langCode === 'zh' ? 'zh-CN' : 'en';
                    u.rate = playbackSpeed;
                    window.speechSynthesis.speak(u);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAudioLoading(false);
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(meta.text);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className={styles.phraseCard}>
            {/* Target language text - full width */}
            <div
                style={{
                    fontSize: "1.4rem",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1.4,
                }}
                onMouseDown={tokenBoundariesBind.onMouseDown}
                onMouseUp={(e) => { tokenBoundariesBind.onMouseUp(e); handleTokenBoundariesRelease(); }}
                onMouseLeave={(e) => { tokenBoundariesBind.onMouseLeave(e); handleTokenBoundariesRelease(); }}
                onTouchStart={tokenBoundariesBind.onTouchStart}
                onTouchEnd={(e) => { tokenBoundariesBind.onTouchEnd(e); handleTokenBoundariesRelease(); }}
                onTouchMove={tokenBoundariesBind.onTouchMove}
            >
                <TokenizedSentence
                    text={meta.text}
                    tokens={meta.tokens}
                    phraseId={meta.phrase_id || event.id}
                    showTokenBoundaries={showTokenBoundaries}
                />
            </div>

            {/* IPA display — stress-colored syllables */}
            {ipaRevealed && targetIsEnglish && (
                <div style={{
                    marginTop: "-4px",
                    opacity: ipaLoading && !ipa ? 0.4 : 1,
                    transition: "opacity 0.2s",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    flexWrap: "wrap",
                }}>
                    {ipaLoading && !ipa
                        ? <span style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>...</span>
                        : <StressColoredIPA ipa={ipa} />
                    }
                    <span style={{
                        fontSize: "0.65rem",
                        opacity: 0.6,
                        fontFamily: "system-ui, sans-serif",
                        whiteSpace: "nowrap",
                        color: "var(--color-fg-muted)",
                    }}>{ipaMode === "word" ? "単語" : "つながり"}</span>
                </div>
            )}

            {/* Bottom section: translation + buttons */}
            <div
                style={{
                    fontSize: "0.9rem",
                    color: "var(--color-fg-muted)",
                    textAlign: "start",
                    marginTop: "var(--space-3)",
                }}
            >
                <IPAText text={meta.translation || t.noTranslation} />

                {/* Action buttons - float right */}
                <span style={{ float: 'right', display: 'inline-flex', gap: '4px', alignItems: 'center', verticalAlign: 'middle' }}>
                    {/* IPA Toggle — tap: toggle, long-press: switch mode */}
                    {targetIsEnglish && (
                        <button
                            {...makeLongPress(
                                () => {
                                    const next = !ipaRevealed;
                                    setIpaRevealed(next);
                                    if (next) openIPA(ipaIdRef.current);
                                },
                                () => {
                                    const next = ipaMode === "word" ? "connected" : "word";
                                    setIPAMode(next);
                                    if (!ipaRevealed) {
                                        setIpaRevealed(true);
                                        openIPA(ipaIdRef.current);
                                    }
                                }
                            )}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: ipaRevealed ? "var(--color-accent)" : "var(--color-fg-muted)",
                                cursor: "pointer",
                                padding: "var(--space-1)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                                position: "relative",
                            }}
                            title={ipaRevealed ? `IPA: ${ipaMode === "word" ? "単語" : "つながり"} (長押しで切替)` : "Show IPA (長押しでモード切替)"}
                        >
                            <Type size={16} />
                            {ipaRevealed && (
                                <span style={{
                                    position: "absolute",
                                    top: "-2px",
                                    right: "-2px",
                                    fontSize: "0.5rem",
                                    fontWeight: 700,
                                    color: "var(--color-accent)",
                                    lineHeight: 1,
                                }}>{ipaMode === "word" ? "W" : "C"}</span>
                            )}
                        </button>
                    )}
                    {hasAudioPremium && (
                        <button
                            {...makeLongPress(() => togglePlaybackSpeed(), () => setSpeedModalOpen(true))}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: playbackSpeed === 1.0 ? "var(--color-fg-muted)" : "var(--color-accent)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "var(--space-1)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                fontFamily: "system-ui, sans-serif",
                            }}
                            title={`Speed: ${playbackSpeed}x`}
                        >
                            {`${playbackSpeed}x`}
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: hasCopied ? "var(--color-success)" : "var(--color-fg-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "var(--space-1)",
                        }}
                        title={t.copy || "Copy"}
                    >
                        {hasCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                        {...makeLongPress(() => handlePlay(), () => setVoiceModalOpen(true))}
                        onClick={(e) => e.stopPropagation()}
                        disabled={audioLoading}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-fg-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "var(--space-1)",
                        }}
                        title={t.play || "Play"}
                    >
                        {audioLoading ? (
                            <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                            <Volume2 size={16} />
                        )}
                    </button>
                </span>
            </div>

            <SpeedControlModal
                isOpen={speedModalOpen}
                onClose={() => setSpeedModalOpen(false)}
                currentSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
            />
            <VoiceSettingsModal
                isOpen={voiceModalOpen}
                onClose={() => setVoiceModalOpen(false)}
                currentVoice={ttsVoice}
                learnerMode={ttsLearnerMode}
                onVoiceChange={setTtsVoice}
                onLearnerModeChange={setTtsLearnerMode}
            />
            {lpIndicator && createPortal(
                <div style={{
                    position: 'fixed',
                    left: lpIndicator.x - 12,
                    top: lpIndicator.y - 12,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    pointerEvents: 'none',
                    zIndex: 999,
                    animation: lpIndicator.exiting
                        ? 'lpExpand 0.25s ease-out forwards'
                        : 'lpSlideLeft 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards',
                }}>
                    <style>{`
                        @keyframes lpSlideLeft {
                            from { transform: translateX(0) scale(0.3); opacity: 0; }
                            to   { transform: translateX(-36px) scale(1); opacity: 0.9; }
                        }
                        @keyframes lpExpand {
                            from { transform: translateX(-36px) scale(1); opacity: 0.9; }
                            to   { transform: translateX(-36px) scale(3); opacity: 0; }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </div>
    );
};

export default function MyPhrasesPage() {
    const {
        collections,
        phrasesByCollection,
        uncategorizedPhrases,
        isLoading,
        fetchCollections,
        fetchAllPhrases,
        createCollection,
        deleteCollection,
    } = useCollectionsStore();
    const { user, profile, activeLanguageCode, nativeLanguage } = useAppStore();
    const { drawerState, closeExplorer } = useExplorer();
    const { isMemoMode } = useAwarenessStore();

    const [activeFilter, setActiveFilterState] = useState<FilterType>(getStoredFilter);
    const setActiveFilter = (filter: FilterType) => {
        setActiveFilterState(filter);
        try { window.localStorage.setItem(FILTER_STORAGE_KEY, filter); } catch {}
    };
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
    const dropdownButtonRef = React.useRef<HTMLButtonElement>(null);

    const t = translations[(nativeLanguage || "en") as NativeLanguage] || translations.en;

    // Check if user has purchased the phrase collections feature
    const hasPhraseCollections = React.useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("phrase_collections");
    }, [profile]);

    useEffect(() => {
        if (user && activeLanguageCode && hasPhraseCollections) {
            fetchCollections(user.id, activeLanguageCode);
            fetchAllPhrases(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchCollections, fetchAllPhrases, hasPhraseCollections]);

    // Validate stored filter: if the saved collection ID no longer exists, reset to "all"
    useEffect(() => {
        if (!isLoading && activeFilter !== "all" && activeFilter !== "uncategorized") {
            const exists = collections.some(c => c.id === activeFilter);
            if (!exists) setActiveFilter("all");
        }
    }, [collections, isLoading]);

    // Show side panel when explorer is opened or memo mode is ON (same as phrases page)
    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;

    const handleCreateCollection = async (name: string, color: string) => {
        if (!user || !activeLanguageCode) return;
        await createCollection(user.id, activeLanguageCode, name, { color });
        setIsCreateModalOpen(false);
    };

    const handleDeleteCollection = async (e: React.MouseEvent, collectionId: string) => {
        e.stopPropagation();
        if (confirm((t as any).confirmDeleteCollection || "Delete this collection? Phrases will not be deleted.")) {
            await deleteCollection(collectionId);
            if (activeFilter === collectionId) {
                setActiveFilter("all");
            }
        }
    };

    const getDisplayPhrases = () => {
        if (activeFilter === "all") {
            const allPhrases = [
                ...uncategorizedPhrases,
                ...Object.values(phrasesByCollection).flat(),
            ];
            return allPhrases.sort(
                (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
            );
        }
        if (activeFilter === "uncategorized") {
            return uncategorizedPhrases;
        }
        return phrasesByCollection[activeFilter] || [];
    };

    const displayPhrases = getDisplayPhrases();
    const totalPhrases =
        uncategorizedPhrases.length + Object.values(phrasesByCollection).flat().length;

    if (isLoading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                {t.loading}
            </div>
        );
    }

    // Show locked state if user hasn't purchased the feature
    if (!hasPhraseCollections) {
        return (
            <div className={styles.lockedContainer}>
                <div className={styles.lockedContent}>
                    <div className={styles.lockedIcon}>
                        <Lock size={48} />
                    </div>
                    <h1 className={styles.lockedTitle}>
                        {(t as any).featureLockedTitle || "機能がロックされています"}
                    </h1>
                    <p className={styles.lockedDesc}>
                        {(t as any).featureLockedDesc || "この機能を使用するにはショップで購入してください。"}
                    </p>
                    <Link href="/app/shop" className={styles.shopButton}>
                        <ShoppingBag size={20} />
                        <span>{(t as any).goToShop || "ショップへ"}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className={clsx(
                styles.container,
                isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed
            )}
        >
            <div className={styles.leftArea}>
                {/* Header with Title and Filter */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>{(t as any).myPhrases || "保存済み"}</h1>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* MemoDropZone (Desktop only - compact) */}
                        <div className={styles.desktopOnly}>
                            <MemoDropZone />
                        </div>

                        {/* Filter Dropdown */}
                        <div className={styles.filterDropdownWrapper}>
                            <button
                                ref={dropdownButtonRef}
                                className={styles.filterDropdown}
                                onClick={() => {
                                    if (!isDropdownOpen && dropdownButtonRef.current) {
                                        const rect = dropdownButtonRef.current.getBoundingClientRect();
                                        setDropdownPosition({
                                            top: rect.bottom + 8,
                                            right: 12,
                                        });
                                    }
                                    setIsDropdownOpen(!isDropdownOpen);
                                }}
                            >
                                <Filter size={16} className={styles.filterIcon} />
                                <span className={styles.filterValue}>
                                    {activeFilter === "all"
                                        ? ((t as any).all || "全て")
                                        : activeFilter === "uncategorized"
                                            ? ((t as any).uncategorized || "未分類")
                                            : collections.find((c) => c.id === activeFilter)?.name || ""}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={clsx(styles.filterChevron, isDropdownOpen && styles.filterChevronOpen)}
                                />
                            </button>

                            {isDropdownOpen && dropdownPosition && createPortal(
                                <>
                                    <div
                                        className={styles.dropdownBackdrop}
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div
                                        className={styles.dropdownMenu}
                                        style={{
                                            position: 'fixed',
                                            top: dropdownPosition.top,
                                            right: dropdownPosition.right,
                                        }}
                                    >
                                        {/* All */}
                                        <button
                                            className={clsx(styles.dropdownItem, activeFilter === "all" && styles.dropdownItemActive)}
                                            onClick={() => { setActiveFilter("all"); setIsDropdownOpen(false); }}
                                        >
                                            <Folder size={16} />
                                            <span>{(t as any).all || "全て"}</span>
                                            <span className={styles.dropdownCount}>{totalPhrases}</span>
                                        </button>

                                        {/* Collections */}
                                        {collections.map((collection) => (
                                            <button
                                                key={collection.id}
                                                className={clsx(styles.dropdownItem, activeFilter === collection.id && styles.dropdownItemActive)}
                                                onClick={() => { setActiveFilter(collection.id); setIsDropdownOpen(false); }}
                                            >
                                                <div
                                                    className={styles.dropdownColorDot}
                                                    style={{ background: collection.color || "#3b82f6" }}
                                                />
                                                <span>{collection.name}</span>
                                                <span className={styles.dropdownCount}>{phrasesByCollection[collection.id]?.length || 0}</span>
                                                <button
                                                    className={styles.dropdownDeleteBtn}
                                                    onClick={(e) => handleDeleteCollection(e, collection.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </button>
                                        ))}

                                        {/* Uncategorized */}
                                        <button
                                            className={clsx(styles.dropdownItem, activeFilter === "uncategorized" && styles.dropdownItemActive)}
                                            onClick={() => { setActiveFilter("uncategorized"); setIsDropdownOpen(false); }}
                                        >
                                            <Folder size={16} />
                                            <span>{(t as any).uncategorized || "未分類"}</span>
                                            <span className={styles.dropdownCount}>{uncategorizedPhrases.length}</span>
                                        </button>

                                        <div className={styles.dropdownDivider} />

                                        {/* New Collection */}
                                        <button
                                            className={clsx(styles.dropdownItem, styles.dropdownItemNew)}
                                            onClick={() => { setIsCreateModalOpen(true); setIsDropdownOpen(false); }}
                                        >
                                            <Plus size={16} />
                                            <span>{(t as any).newCollection || "新規コレクション"}</span>
                                        </button>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>

                        {/* View Mode Toggle (Mobile Only) */}
                        <button
                            className={styles.viewToggle}
                            onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
                            title={viewMode === "list" ? "カード表示" : "リスト表示"}
                        >
                            {viewMode === "list" ? <LayoutGrid size={20} /> : <List size={20} />}
                        </button>
                    </div>
                </div>

                {/* MemoDropZone Expanded (Card mode only) */}
                <div className={clsx(styles.memoDropZoneExpanded, viewMode === "card" && styles.memoDropZoneVisible)}>
                    <MemoDropZone expandedLayout={true} />
                </div>

                {/* Scrollable Content Area */}
                <div className={styles.scrollArea}>
                    {/* Phrase List */}
                    {displayPhrases.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Folder size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                            <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                                {(t as any).noCollections || "No phrases yet"}
                            </h2>
                            <p>{(t as any).createFirstCollection || "Save phrases from corrections to see them here."}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Compact list view (when viewMode is list) */}
                            <div className={clsx(styles.phraseList, viewMode === "card" && styles.phraseListHidden)}>
                                {displayPhrases.map((event) => (
                                    <PhraseListItem
                                        key={event.id}
                                        event={event}
                                        t={t}
                                    />
                                ))}
                            </div>

                            {/* Desktop: Card grid view / Mobile: when viewMode is card */}
                            <div className={clsx(styles.phraseGrid, viewMode === "card" && styles.phraseGridMobile)}>
                                {displayPhrases.map((event) => (
                                    <PhraseCard
                                        key={event.id}
                                        event={event}
                                        t={t}
                                        credits={profile?.audio_credits ?? 0}
                                        langCode={activeLanguageCode || "en"}
                                        profile={profile}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isPanelOpen && (
                <>
                    <div className={styles.overlay} onClick={() => closeExplorer()} />
                    <div className={styles.rightPanel}>
                        <ExplorerSidePanel />
                    </div>
                </>
            )}

            <CreateCollectionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateCollection}
                nativeLanguage={(nativeLanguage || "en") as NativeLanguage}
            />
        </div>
    );
}
