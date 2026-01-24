"use client";

import React, { useEffect, useState } from "react";
import { Folder, Volume2, Eye, EyeOff, Copy, Check, Trash2, Filter, ChevronDown, Plus } from "lucide-react";
import { useCollectionsStore } from "@/store/collections-store";
import { useAppStore } from "@/store/app-context";
import { translations, NativeLanguage } from "@/lib/translations";
import TokenizedSentence from "@/components/TokenizedSentence";
import MemoDropZone from "@/components/MemoDropZone";
import { useExplorer } from "@/hooks/use-explorer";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import { useAwarenessStore } from "@/store/awareness-store";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import clsx from "clsx";
import styles from "./page.module.css";

type FilterType = "all" | "uncategorized" | string;

const PhraseCard = ({ event, t, credits }: { event: any; t: any; credits: number }) => {
    const meta = event.meta || {};
    const [isRevealed, setIsRevealed] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (credits <= 0) {
            alert(t.stream_insufficient_audio_credits || "Insufficient audio credits");
            return;
        }
        if ("speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(meta.text);
            u.lang = "en";
            window.speechSynthesis.speak(u);
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
                    <Volume2 size={20} />
                </button>
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
    const { drawerState, closeExplorer } = useExplorer();
    const { isMemoMode } = useAwarenessStore();

    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const t = translations[(nativeLanguage || "en") as NativeLanguage] || translations.en;

    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchCollections(user.id, activeLanguageCode);
            fetchAllPhrases(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchCollections, fetchAllPhrases]);

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

    return (
        <div
            className={clsx(
                styles.container,
                isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed
            )}
        >
            <div className={styles.leftArea}>
                <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
                    {/* Header with Title and Filter */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.title}>{(t as any).myPhrases || "マイフレーズ"}</h1>
                        </div>

                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
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

                            <div className={styles.desktopOnly}>
                                <MemoDropZone />
                            </div>
                        </div>
                    </div>

                    {/* Mobile MemoDropZone */}
                    <div className={styles.mobileOnly}>
                        <MemoDropZone expandedLayout={true} />
                    </div>

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
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: "16px",
                                marginTop: "24px",
                            }}
                        >
                            {displayPhrases.map((event) => (
                                <PhraseCard
                                    key={event.id}
                                    event={event}
                                    t={t}
                                    credits={profile?.audio_credits ?? 0}
                                />
                            ))}
                        </div>
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
