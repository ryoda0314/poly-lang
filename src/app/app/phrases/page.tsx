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
import Link from "next/link";
import { Settings, Languages } from "lucide-react";
import styles from "./phrases.module.css";
import clsx from "clsx";
import PageTutorial, { TutorialStep } from "@/components/PageTutorial";
import { BookOpen, Smartphone, Info } from "lucide-react";
import { ShiftClickDemo, DragDropDemo, TapExploreDemo, AudioPlayDemo, RangeExploreDemo, ComparePhrasesDemo, InferMeaningDemo, PredictionMemoDemo } from "@/components/AnimatedTutorialDemos";
import { MobileSlideSelectDemo, MobileDragDropDemo, MobileTapExploreDemo, MobilePredictionMemoDemo, MobileAudioPlayDemo } from "@/components/MobileTutorialDemos";



export default function PhrasesPage() {
    const { activeLanguageCode, user, nativeLanguage, showPinyin, togglePinyin, speakingGender, setSpeakingGender } = useAppStore();
    const { fetchMemos, selectedToken, isMemoMode, toggleMemoMode, clearSelection } = useAwarenessStore();
    const {
        phraseSets,
        currentSetId,
        currentSetPhrases,
        isLoadingPhrases,
        fetchPhraseSets,
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
    const [mobileTutorialKey, setMobileTutorialKey] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddPhrasesModal, setShowAddPhrasesModal] = useState(false);
    const [manageSetId, setManageSetId] = useState<string | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleShowTutorial = () => {
        if (isMobile) {
            localStorage.removeItem("poly-lang-page-tutorial-phrases-mobile-v1");
            setMobileTutorialKey(k => k + 1);
        } else {
            localStorage.removeItem("poly-lang-page-tutorial-phrases-v1");
            setTutorialKey(k => k + 1);
        }
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

    // Phrase set selector translations
    const phraseSetTranslations = {
        basic_phrases: t.basic_phrases || "Basic Learning Phrases",
        create_phrase_set: t.create_phrase_set || "Create New Set",
        manage: t.manage || "Manage",
        phrase_sets: t.phrase_sets || "Phrase Sets"
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
                    <div className={styles.headerLeft}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h1 className={styles.title}>{t.phrases}</h1>
                                {/* Tutorial Button */}
                                <button
                                    onClick={handleShowTutorial}
                                    title="使い方"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "30px", // Slightly smaller to fit header
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
                        </div>
                    </div>

                    {/* Right side settings - Anchored to right */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <PhraseSetSelector
                            phraseSets={phraseSets}
                            selectedSetId={currentSetId}
                            onSelect={(id) => {
                                setCurrentSet(id);
                                setSelectedCategory("all");
                            }}
                            onCreateNew={() => setShowCreateModal(true)}
                            onManage={(setId) => setManageSetId(setId)}
                            translations={phraseSetTranslations}
                        />
                        {currentSetId === 'builtin' && (
                            <CategoryTabs
                                categories={localizedCategories}
                                selectedCategoryId={selectedCategory}
                                onSelect={setSelectedCategory}
                                allLabel={t.all}
                            />
                        )}





                        <div className={styles.desktopOnly}>
                            <MemoDropZone />
                        </div>
                    </div>
                </div>

                <div className={styles.mobileOnly}>
                    <div style={{ width: "100%", maxWidth: "340px" }}>
                        <MemoDropZone expandedLayout={true} />
                    </div>
                </div>

                {/* Add Phrases button for custom sets */}
                {currentSetId !== 'builtin' && (
                    <div style={{ marginBottom: "1rem" }}>
                        <button
                            onClick={() => setShowAddPhrasesModal(true)}
                            style={{
                                padding: "0.75rem 1.5rem",
                                background: "var(--color-accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                cursor: "pointer",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            + {t.add_phrases || "Add Phrases"}
                        </button>
                    </div>
                )}

                <motion.div
                    layout
                    className={clsx(styles.grid, isPanelOpen ? styles.gridOpen : styles.gridClosed)}
                >
                    {isLoadingPhrases && currentSetId !== 'builtin' ? (
                        <div className={styles.emptyState}>
                            {t.loading || "Loading..."}
                        </div>
                    ) : filteredPhrases.length > 0 ? (
                        filteredPhrases.map((phrase) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={`${phrase.id}-${selectedCategory}-${currentSetId}`}
                            >
                                <PhraseCard phrase={phrase} />
                            </motion.div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            {currentSetId === 'builtin'
                                ? "No phrases found for this category."
                                : (t.no_phrases || "No phrases yet. Add some!")
                            }
                        </div>
                    )}
                </motion.div>
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

            {/* Page Tutorial - PC */}
            <PageTutorial key={tutorialKey} pageId="phrases" steps={PHRASES_TUTORIAL_STEPS} />
            {/* Page Tutorial - Mobile */}
            <PageTutorial key={`mobile-${mobileTutorialKey}`} pageId="phrases-mobile" steps={MOBILE_PHRASES_TUTORIAL_STEPS} />

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
