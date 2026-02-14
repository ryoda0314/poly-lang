"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { CATEGORIES, PHRASES, GENDER_SUPPORTED_LANGUAGES, PARENT_CATEGORIES, getParentCategoryId } from "@/lib/data";
import { translations } from "@/lib/translations";
import { adaptToPhrase } from "@/lib/phrase-adapter";
import PhraseCard from "@/components/PhraseCard";
import CategoryTabs from "@/components/CategoryTabs";
import PhraseSetSelector from "@/components/PhraseSetSelector";
import { CreatePhraseSetModal } from "@/components/CreatePhraseSetModal";
import { AddPhrasesModal } from "@/components/AddPhrasesModal";
import { ManagePhraseSetModal } from "@/components/ManagePhraseSetModal";
import AwarenessPanel from "@/components/AwarenessPanel";
import AwarenessMemoPanel from "@/components/AwarenessMemoPanel";
import ExplorerSidePanel from "@/components/ExplorerSidePanel";
import MemoDropZone from "@/components/MemoDropZone";
import { motion } from "framer-motion";
import { useExplorer } from "@/hooks/use-explorer";
import { List, LayoutGrid, ChevronDown, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./phrases.module.css";
import clsx from "clsx";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { BookOpen, Smartphone, Info } from "lucide-react";
import TokenizedSentence from "@/components/TokenizedSentence";

// Compact list item for custom phrase sets
const CustomPhraseListItem = ({ phrase, t }: { phrase: any; t: any }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const targetText = phrase.translations?.[Object.keys(phrase.translations || {})[0]] || phrase.translation || "";

    return (
        <div onClick={() => setIsRevealed(!isRevealed)} className={styles.phraseListItem}>
            <div className={styles.listItemContent}>
                <div className={styles.listItemText}>
                    <TokenizedSentence
                        text={targetText}
                        tokens={phrase.tokensMap?.[Object.keys(phrase.tokensMap || {})[0]] || phrase.tokens || []}
                        phraseId={phrase.id}
                    />
                </div>
                <div
                    className={styles.listItemTranslation}
                    style={{
                        opacity: isRevealed ? 1 : 0,
                        maxHeight: isRevealed ? "60px" : "0",
                    }}
                >
                    {phrase.translation || t.noTranslation}
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
import { ShiftClickDemo, DragDropDemo, TapExploreDemo, AudioPlayDemo, RangeExploreDemo, ComparePhrasesDemo, InferMeaningDemo, PredictionMemoDemo } from "@/components/AnimatedTutorialDemos";
import { MobileSlideSelectDemo, MobileDragDropDemo, MobileTapExploreDemo, MobilePredictionMemoDemo, MobileAudioPlayDemo } from "@/components/MobileTutorialDemos";



export default function PhrasesPage() {
    const { activeLanguageCode, user, nativeLanguage, showPinyin, togglePinyin, speakingGender, setSpeakingGender, profile } = useAppStore();
    const router = useRouter();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode, clearSelection } = useAwarenessStore();
    const {
        phraseSets,
        currentSetId,
        currentSetPhrases,
        isLoadingPhrases,
        fetchPhraseSets,
        fetchSetPhrases,
        setCurrentSet,
        createPhraseSet,
        updatePhraseSet,
        deletePhraseSet,
        addPhrases,
        deletePhrase
    } = usePhraseSetStore();
    const { drawerState, closeExplorer } = useExplorer();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [tutorialKey, setTutorialKey] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddPhrasesModal, setShowAddPhrasesModal] = useState(false);
    const [manageSetId, setManageSetId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        setIsLayoutReady(true);
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleShowTutorial = () => {
        const storageKey = isMobile
            ? "poly-lang-page-tutorial-phrases-mobile-v1"
            : "poly-lang-page-tutorial-phrases-v1";
        localStorage.removeItem(storageKey);
        setTutorialKey(k => k + 1);
    };

    useEffect(() => {
        if (user) {
            fetchMemos(user.id, activeLanguageCode);
            fetchPhraseSets(user.id, activeLanguageCode);
        }
        return () => {
            clearSelection();
        };
    }, [user, activeLanguageCode, fetchMemos, fetchPhraseSets, clearSelection]);

    // Restore saved set: once phraseSets load, validate & fetch phrases for the persisted set
    useEffect(() => {
        if (phraseSets.length > 0 && currentSetId !== 'builtin' && currentSetPhrases.length === 0 && !isLoadingPhrases) {
            const exists = phraseSets.some(s => s.id === currentSetId);
            if (exists) {
                fetchSetPhrases(currentSetId);
            } else {
                setCurrentSet('builtin');
            }
        }
    }, [phraseSets, currentSetId, currentSetPhrases.length, isLoadingPhrases, fetchSetPhrases, setCurrentSet]);

    // Localize categories (use PARENT_CATEGORIES for broader grouping)
    const t: any = translations[nativeLanguage] || translations.ja;

    const PHRASES_TUTORIAL_STEPS: TutorialStep[] = [
        {
            title: t.phrases_tutorial_intro_title,
            description: t.phrases_tutorial_intro_desc,
            icon: <BookOpen size={48} style={{ color: "var(--color-accent)" }} />
        },
        {
            title: t.phrases_tutorial_compare_title,
            description: t.phrases_tutorial_compare_desc,
            icon: <ComparePhrasesDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_infer_title,
            description: t.phrases_tutorial_infer_desc,
            icon: <InferMeaningDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_tap_title,
            description: t.phrases_tutorial_tap_desc,
            icon: <TapExploreDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_drag_title,
            description: t.phrases_tutorial_drag_desc,
            icon: <DragDropDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_predict_title,
            description: t.phrases_tutorial_predict_desc,
            icon: <PredictionMemoDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_shift_title,
            description: t.phrases_tutorial_shift_desc,
            icon: <ShiftClickDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_range_title,
            description: t.phrases_tutorial_range_desc,
            icon: <RangeExploreDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_audio_title,
            description: t.phrases_tutorial_audio_desc,
            icon: <AudioPlayDemo />,
            waitForAnimation: true
        }
    ];

    const MOBILE_PHRASES_TUTORIAL_STEPS: TutorialStep[] = [
        {
            title: t.phrases_mobile_intro_title,
            description: t.phrases_mobile_intro_desc,
            icon: <Smartphone size={48} style={{ color: "var(--color-accent)" }} />
        },
        {
            title: t.phrases_tutorial_compare_title,
            description: t.phrases_tutorial_compare_desc,
            icon: <ComparePhrasesDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_infer_title,
            description: t.phrases_tutorial_infer_desc,
            icon: <InferMeaningDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_mobile_tap_title,
            description: t.phrases_mobile_tap_desc,
            icon: <MobileTapExploreDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_mobile_drag_title,
            description: t.phrases_mobile_drag_desc,
            icon: <MobileDragDropDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_predict_title,
            description: t.phrases_tutorial_predict_desc,
            icon: <MobilePredictionMemoDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_mobile_slide_title,
            description: t.phrases_mobile_slide_desc,
            icon: <MobileSlideSelectDemo />,
            waitForAnimation: true
        },
        {
            title: t.phrases_tutorial_audio_title,
            description: t.phrases_tutorial_audio_desc,
            icon: <MobileAudioPlayDemo />,
            waitForAnimation: true
        }
    ];

    const localizedCategories = PARENT_CATEGORIES.map(cat => ({
        ...cat,
        name: (t as any)[cat.id] || cat.name
    }));

    // Display phrases based on current set selection
    const displayPhrases = useMemo(() => {
        if (currentSetId === 'builtin') {
            return PHRASES.filter(p => p.translations?.[activeLanguageCode]);
        }
        return currentSetPhrases.map(item => adaptToPhrase(item, activeLanguageCode));
    }, [currentSetId, currentSetPhrases, activeLanguageCode]);

    const filteredPhrases = selectedCategory === "all"
        ? displayPhrases
        : displayPhrases.filter(p => getParentCategoryId(p.categoryId) === selectedCategory);

    const isPanelOpen = drawerState !== "UNOPENED" || isMemoMode;

    // Get current phrase set for manage modal
    const currentPhraseSet = phraseSets.find(s => s.id === manageSetId) || null;

    // Handlers for phrase sets
    const handleCreatePhraseSet = async (name: string, description: string, color: string) => {
        if (!user) return;
        const newSet = await createPhraseSet(user.id, activeLanguageCode, name, { description, color });
        if (newSet) {
            setCurrentSet(newSet.id);
        }
    };

    const handleAddPhrases = async (phrases: { target_text: string; translation: string; tokens?: string[] }[]) => {
        if (currentSetId === 'builtin') return;
        await addPhrases(currentSetId, phrases);
    };

    // Check if user has purchased study set creator feature
    const hasStudySetCreator = useMemo(() => {
        const inventory = (profile?.settings as any)?.inventory || [];
        return inventory.includes("study_set_creator");
    }, [profile]);

    // Phrase set selector translations
    const phraseSetTranslations = {
        basic_phrases: t.basic_phrases || "Basic Learning Phrases",
        create_phrase_set: t.create_phrase_set || "Create New Set",
        manage: t.manage || "Manage",
        phrase_sets: t.phrase_sets || "Phrase Sets",
        purchase_required: t.purchase_required || "ショップで購入が必要",
        go_to_shop: t.goToShop || "ショップへ"
    };

    // Create phrase set modal translations
    const createSetTranslations = {
        create_phrase_set: t.create_phrase_set || "Create New Set",
        set_name: t.set_name || "Set Name",
        set_name_placeholder: t.set_name_placeholder || "e.g., Travel Phrases...",
        description: t.description || "Description",
        description_placeholder: t.description_placeholder || "Set description (optional)",
        color: t.color || "Color",
        cancel: t.cancel || "Cancel",
        create: t.create || "Create"
    };

    // Add phrases modal translations
    const addPhrasesTranslations = {
        add_phrases: t.add_phrases || "Add Phrases",
        manual_input: t.manual_input || "Manual Input",
        image_analysis: t.image_analysis || "From Image",
        target_text: t.target_text || "Target Text",
        translation: t.translation || "Translation",
        add: t.add || "Add",
        add_another: t.add_another || "Add Another",
        upload_image: t.upload_image || "Upload Image",
        analyzing_image: t.analyzing_image || "Analyzing image...",
        extracted_phrases: t.extracted_phrases || "Extracted Phrases",
        add_all: t.add_all || "Add All",
        no_phrases_extracted: t.no_phrases_extracted || "Upload an image to extract phrases",
        drag_drop_image: t.drag_drop_image || "Drag & drop or click to upload",
        cancel: t.cancel || "Cancel",
        tokenizing: t.tokenizing || "Tokenizing..."
    };

    // Manage set modal translations
    const manageSetTranslations = {
        manage_set: t.manage_set || "Manage Set",
        edit_set: t.edit_set || "Edit",
        set_name: t.set_name || "Set Name",
        description: t.description || "Description",
        color: t.color || "Color",
        phrases_in_set: t.phrases_in_set || "Phrases in Set",
        no_phrases: t.no_phrases || "No phrases yet",
        add_phrases: t.add_phrases || "Add Phrases",
        delete_set: t.delete_set || "Delete Set",
        delete_set_confirm: t.delete_set_confirm || "This will delete the set and all its phrases.",
        cancel: t.cancel || "Cancel",
        save: t.save || "Save",
        delete: t.delete || "Delete"
    };

    return (
        <div className={clsx(styles.container, isPanelOpen ? styles.containerPanelOpen : styles.containerPanelClosed)}>
            {/* Left Area */}
            <div className={styles.leftArea}>
                <div className={styles.header}>
                    {/* Left side */}
                    <div className={styles.headerLeft}>
                        {/* Desktop: Title + Tutorial */}
                        <div className={styles.titleArea}>
                            <h1 className={styles.title}>{t.phrases}</h1>
                            <button
                                onClick={() => router.push('/app/extraction-history')}
                                title={nativeLanguage === 'ja' ? "画像抽出履歴" : "Extraction History"}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "30px",
                                    height: "30px",
                                    background: "transparent",
                                    color: "var(--color-fg-muted, #6b7280)",
                                    border: "1px solid var(--color-border, #e5e7eb)",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                <Clock size={18} />
                            </button>
                            <button
                                onClick={handleShowTutorial}
                                title={(t as any).howToUse || "How to Use"}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "30px",
                                    height: "30px",
                                    background: "transparent",
                                    color: "var(--color-fg-muted, #6b7280)",
                                    border: "1px solid var(--color-border, #e5e7eb)",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                <Info size={18} />
                            </button>
                        </div>
                        {/* Mobile: Phrase Set Selector on left */}
                        <div className={styles.mobileOnlyInline}>
                            <PhraseSetSelector
                                phraseSets={phraseSets}
                                selectedSetId={currentSetId}
                                onSelect={(id) => {
                                    setCurrentSet(id);
                                    setSelectedCategory("all");
                                }}
                                onCreateNew={() => setShowCreateModal(true)}
                                onManage={(setId) => setManageSetId(setId)}
                                onGoToShop={() => router.push("/app/shop")}
                                hasPurchased={hasStudySetCreator}
                                translations={phraseSetTranslations}
                            />
                        </div>
                    </div>

                    {/* Center: Drop zone (Desktop only) */}
                    <div className={styles.desktopOnly} style={{ flex: 1, justifyContent: 'center' }}>
                        <MemoDropZone />
                    </div>

                    {/* Right side controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        {/* View Mode Toggle (for custom sets, mobile only) */}
                        {currentSetId !== 'builtin' && (
                            <button
                                className={styles.viewToggle}
                                onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
                                title={viewMode === "list" ? "カード表示" : "リスト表示"}
                            >
                                {viewMode === "list" ? <LayoutGrid size={18} /> : <List size={18} />}
                            </button>
                        )}

                        {/* Desktop: Phrase Set Selector */}
                        <div className={styles.desktopOnly}>
                            <PhraseSetSelector
                                phraseSets={phraseSets}
                                selectedSetId={currentSetId}
                                onSelect={(id) => {
                                    setCurrentSet(id);
                                    setSelectedCategory("all");
                                }}
                                onCreateNew={() => setShowCreateModal(true)}
                                onManage={(setId) => setManageSetId(setId)}
                                onGoToShop={() => router.push("/app/shop")}
                                hasPurchased={hasStudySetCreator}
                                translations={phraseSetTranslations}
                            />
                        </div>

                        {currentSetId === 'builtin' && (
                            <CategoryTabs
                                categories={localizedCategories}
                                selectedCategoryId={selectedCategory}
                                onSelect={setSelectedCategory}
                                allLabel={t.all}
                            />
                        )}
                    </div>
                </div>

                {/* Mobile: hide drop zone in list view (same as my-phrases) */}
                {(currentSetId === 'builtin' || viewMode === 'card') && (
                    <div className={styles.mobileOnly}>
                        <div style={{ width: "100%", maxWidth: "340px" }}>
                            <MemoDropZone expandedLayout={true} />
                        </div>
                    </div>
                )}


                {/* Loading / Empty State */}
                {isLoadingPhrases && currentSetId !== 'builtin' ? (
                    <div className={styles.emptyState}>
                        {t.loading || "Loading..."}
                    </div>
                ) : filteredPhrases.length === 0 ? (
                    <div className={styles.emptyState}>
                        {currentSetId === 'builtin'
                            ? "No phrases found for this category."
                            : (t.no_phrases || "No phrases yet. Add some!")
                        }
                    </div>
                ) : (
                    <>
                        {/* List View (Mobile default for custom sets) */}
                        {currentSetId !== 'builtin' && (
                            <div className={clsx(
                                styles.phraseList,
                                viewMode === "card" && styles.phraseListHidden
                            )}>
                                {filteredPhrases.map((phrase) => (
                                    <CustomPhraseListItem
                                        key={`list-${phrase.id}-${currentSetId}`}
                                        phrase={phrase}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Grid/Card View */}
                        <motion.div
                            layout
                            className={clsx(
                                styles.grid,
                                isPanelOpen ? styles.gridOpen : styles.gridClosed,
                                currentSetId === 'builtin' && styles.gridBuiltin,
                                currentSetId !== 'builtin' && viewMode === "card" && styles.gridMobileVisible
                            )}
                        >
                            {filteredPhrases.map((phrase) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    key={`card-${phrase.id}-${selectedCategory}-${currentSetId}`}
                                >
                                    <PhraseCard phrase={phrase} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}
            </div>

            {/* Right Panel: Explorer Side Panel Only (Memo Overlay Removed) */}
            {isPanelOpen && (
                <>
                    {/* Overlay for mobile */}
                    <div className={styles.overlay} onClick={() => closeExplorer()} />

                    <div className={styles.rightPanel}>
                        <ExplorerSidePanel />
                    </div>
                </>
            )}

            {/* Page Tutorial - only render after layout detection */}
            {isLayoutReady && (
                <PageTutorial
                    key={tutorialKey}
                    pageId={isMobile ? "phrases-mobile" : "phrases"}
                    steps={isMobile ? MOBILE_PHRASES_TUTORIAL_STEPS : PHRASES_TUTORIAL_STEPS}
                />
            )}

            {/* Create Phrase Set Modal */}
            <CreatePhraseSetModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreatePhraseSet}
                translations={createSetTranslations}
            />

            {/* Add Phrases Modal */}
            <AddPhrasesModal
                isOpen={showAddPhrasesModal}
                onClose={() => setShowAddPhrasesModal(false)}
                onAdd={handleAddPhrases}
                targetLang={activeLanguageCode}
                nativeLang={nativeLanguage}
                translations={addPhrasesTranslations}
            />

            {/* Manage Phrase Set Modal */}
            <ManagePhraseSetModal
                isOpen={!!manageSetId}
                phraseSet={currentPhraseSet}
                phrases={manageSetId ? currentSetPhrases : []}
                onClose={() => setManageSetId(null)}
                onUpdate={async (updates) => {
                    if (manageSetId) {
                        await updatePhraseSet(manageSetId, updates);
                    }
                }}
                onDelete={async () => {
                    if (manageSetId) {
                        await deletePhraseSet(manageSetId);
                        setManageSetId(null);
                    }
                }}
                onDeletePhrase={deletePhrase}
                onAddPhrases={() => {
                    setManageSetId(null);
                    setShowAddPhrasesModal(true);
                }}
                translations={manageSetTranslations}
            />
        </div>
    );
}
