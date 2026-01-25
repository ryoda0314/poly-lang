"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Folder, Volume2, Eye, EyeOff, Copy, Check, Trash2, Filter, ChevronDown, Plus, List, LayoutGrid, Lock, ShoppingBag } from "lucide-react";
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
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import MemoDropZone from "@/components/MemoDropZone";
import clsx from "clsx";
import styles from "./page.module.css";

type FilterType = "all" | "uncategorized" | string;

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
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

    // Check if user has speed control from shop
    const hasSpeedControl = useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("speed_control");
    }, [profile]);

    const handlePlay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioLoading) return;
        if (credits <= 0) {
            alert(t.stream_insufficient_audio_credits || "Insufficient audio credits");
            return;
        }
        setAudioLoading(true);
        try {
            const result = await generateSpeech(meta.text, langCode);
            if (result && 'data' in result) {
                await playBase64Audio(result.data, { mimeType: result.mimeType, playbackRate: playbackSpeed });
            } else {
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

    const toggleReveal = () => {
        setIsRevealed(!isRevealed);
    };

    return (
        <div onClick={toggleReveal} className={styles.phraseCard}>
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    display: "flex",
                    gap: "12px",
                    zIndex: 10,
                }}
            >
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
                        padding: 0,
                    }}
                    title={t.copy || "Copy"}
                >
                    {hasCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
                <button
                    onClick={handlePlay}
                    disabled={audioLoading}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-fg-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                    }}
                    title={t.play || "Play"}
                >
                    {audioLoading ? (
                        <div style={{ width: 20, height: 20, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    ) : (
                        <Volume2 size={20} />
                    )}
                </button>
                {hasSpeedControl && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPlaybackSpeed(prev => prev === 1.0 ? 0.75 : 1.0);
                        }}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: playbackSpeed === 1.0 ? "var(--color-fg-muted)" : "var(--color-accent)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                        }}
                        title={`Speed: ${playbackSpeed}x`}
                    >
                        {playbackSpeed}x
                    </button>
                )}
            </div>

            <div
                style={{
                    marginBottom: "16px",
                    fontSize: "1.4rem",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1.4,
                    paddingRight: "60px",
                }}
            >
                <TokenizedSentence
                    text={meta.text}
                    tokens={meta.tokens}
                    phraseId={meta.phrase_id || event.id}
                />
            </div>

            <div
                style={{
                    borderTop: "1px dashed var(--color-border)",
                    paddingTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: isRevealed ? "var(--color-fg-muted)" : "transparent",
                    transition: "color 0.3s",
                }}
            >
                <span
                    style={{
                        fontSize: "1rem",
                        filter: isRevealed ? "none" : "blur(4px)",
                        transition: "filter 0.3s",
                        userSelect: isRevealed ? "text" : "none",
                    }}
                >
                    {meta.translation || t.noTranslation}
                </span>
                <div style={{ color: "var(--color-fg-muted)" }}>
                    {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
            </div>
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
    const { closeExplorer } = useExplorer();
    const { isMemoMode } = useAwarenessStore();

    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");

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

    // Only show side panel when memo mode is ON (for phrase exploration)
    const isPanelOpen = isMemoMode;

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

                        {/* View Mode Toggle (Mobile Only) */}
                        <button
                            className={styles.viewToggle}
                            onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
                            title={viewMode === "list" ? "カード表示" : "リスト表示"}
                        >
                            {viewMode === "list" ? <LayoutGrid size={20} /> : <List size={20} />}
                        </button>

                        {/* Custom Filter Dropdown */}
                        <div className={styles.filterDropdownWrapper}>
                        <button
                            className={styles.filterDropdown}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                                <Filter size={18} className={styles.filterIcon} />
                                <span className={styles.filterValue}>
                                    {activeFilter === "all"
                                        ? (t as any).all || "全て"
                                        : activeFilter === "uncategorized"
                                            ? (t as any).uncategorized || "未分類"
                                            : collections.find(c => c.id === activeFilter)?.name || ""}
                                </span>
                                <ChevronDown size={18} className={clsx(styles.filterChevron, isDropdownOpen && styles.filterChevronOpen)} />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className={styles.dropdownBackdrop} onClick={() => setIsDropdownOpen(false)} />
                                    <div className={styles.dropdownMenu}>
                                        {/* All option */}
                                        <button
                                            className={clsx(styles.dropdownItem, activeFilter === "all" && styles.dropdownItemActive)}
                                            onClick={() => { setActiveFilter("all"); setIsDropdownOpen(false); }}
                                        >
                                            <Folder size={16} />
                                            <span>{(t as any).all || "全て"}</span>
                                            <span className={styles.dropdownCount}>({totalPhrases})</span>
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
                                                <span className={styles.dropdownCount}>({phrasesByCollection[collection.id]?.length || 0})</span>
                                                {activeFilter === collection.id && (
                                                    <button
                                                        className={styles.dropdownDeleteBtn}
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCollection(e, collection.id); setIsDropdownOpen(false); }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </button>
                                        ))}

                                        {/* Uncategorized option */}
                                        <button
                                            className={clsx(styles.dropdownItem, activeFilter === "uncategorized" && styles.dropdownItemActive)}
                                            onClick={() => { setActiveFilter("uncategorized"); setIsDropdownOpen(false); }}
                                        >
                                            <Folder size={16} style={{ opacity: 0.5 }} />
                                            <span>{(t as any).uncategorized || "未分類"}</span>
                                            <span className={styles.dropdownCount}>({uncategorizedPhrases.length})</span>
                                        </button>

                                        {/* Divider */}
                                        <div className={styles.dropdownDivider} />

                                        {/* New Collection option */}
                                        <button
                                            className={clsx(styles.dropdownItem, styles.dropdownItemNew)}
                                            onClick={() => { setIsCreateModalOpen(true); setIsDropdownOpen(false); }}
                                        >
                                            <Plus size={16} />
                                            <span>{(t as any).newCollection || "新規作成"}</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
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
