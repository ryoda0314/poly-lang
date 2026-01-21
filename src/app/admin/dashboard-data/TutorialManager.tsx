"use client";

import React, { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getTutorials, createTutorial, updateTutorial, deleteTutorial, duplicateTutorial,
    Tutorial, TutorialStep
} from "./actions";
import { DataTable, CreateButton } from "@/components/admin/DataTable";
import {
    Loader2, RefreshCw, Plus, Trash2, Copy, ChevronDown, ChevronUp,
    GripVertical, X, Eye, EyeOff, Globe, BookOpen
} from "lucide-react";

const SUPPORTED_LANGUAGES = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' },
    { code: 'vi', name: 'Tiếng Việt' },
];

const TUTORIAL_TYPES = [
    { value: 'phrases', label: 'Phrases Tutorial' },
    { value: 'corrections', label: 'Corrections Tutorial' },
    { value: 'app_intro', label: 'App Introduction' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'phrases_mobile', label: 'Phrases (Mobile)' },
    { value: 'corrections_mobile', label: 'Corrections (Mobile)' },
];

const DEMO_TYPES = [
    { value: '', label: 'No Demo' },
    { value: 'slide_select', label: 'Slide Select' },
    { value: 'drag_drop', label: 'Drag & Drop' },
    { value: 'tap_explore', label: 'Tap Explore' },
    { value: 'prediction_memo', label: 'Prediction Memo' },
    { value: 'audio_play', label: 'Audio Play' },
    { value: 'mobile_slide_select', label: 'Mobile Slide Select' },
    { value: 'mobile_drag_drop', label: 'Mobile Drag & Drop' },
    { value: 'mobile_tap_explore', label: 'Mobile Tap Explore' },
    { value: 'mobile_prediction_memo', label: 'Mobile Prediction Memo' },
    { value: 'mobile_audio_play', label: 'Mobile Audio Play' },
    { value: 'correction_typing', label: 'Correction Typing' },
    { value: 'correction_feedback', label: 'Correction Feedback' },
    { value: 'correction_word_track', label: 'Correction Word Track' },
    { value: 'correction_loop', label: 'Correction Loop' },
];

interface TutorialManagerProps {
    showToast: (msg: string, type: "success" | "error") => void;
}

export default function TutorialManager({ showToast }: TutorialManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterNative, setFilterNative] = useState<string>("");
    const [filterLearning, setFilterLearning] = useState<string>("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);

    // Duplicate Modal State
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateTargetId, setDuplicateTargetId] = useState<string>("");
    const [duplicateNative, setDuplicateNative] = useState<string>("ja");
    const [duplicateLearning, setDuplicateLearning] = useState<string>("en");

    // Form State
    const [formData, setFormData] = useState({
        id: "",
        native_language: "ja",
        learning_language: "en",
        tutorial_type: "phrases",
        title: "",
        description: "",
        steps: [] as TutorialStep[],
        is_active: true,
    });

    const fetchTutorials = async () => {
        setLoading(true);
        try {
            const data = await getTutorials(filterNative || undefined, filterLearning || undefined);
            setTutorials(data || []);
        } catch (e: any) {
            showToast(e.message || "Failed to fetch tutorials", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutorials();
    }, [filterNative, filterLearning]);

    const handleOpenCreate = () => {
        setModalMode("create");
        setFormData({
            id: "",
            native_language: "ja",
            learning_language: "en",
            tutorial_type: "phrases",
            title: "",
            description: "",
            steps: [],
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (tutorial: Tutorial) => {
        setModalMode("edit");
        setEditingTutorial(tutorial);
        setFormData({
            id: tutorial.id,
            native_language: tutorial.native_language,
            learning_language: tutorial.learning_language,
            tutorial_type: tutorial.tutorial_type,
            title: tutorial.title,
            description: tutorial.description,
            steps: tutorial.steps || [],
            is_active: tutorial.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const fd = new FormData();
        fd.append("id", formData.id);
        fd.append("native_language", formData.native_language);
        fd.append("learning_language", formData.learning_language);
        fd.append("tutorial_type", formData.tutorial_type);
        fd.append("title", formData.title);
        fd.append("description", formData.description);
        fd.append("steps", JSON.stringify(formData.steps));
        fd.append("is_active", formData.is_active ? "true" : "false");

        startTransition(async () => {
            const res = modalMode === "create" ? await createTutorial(fd) : await updateTutorial(fd);
            if (res?.error) {
                showToast(res.error, "error");
            } else {
                showToast(modalMode === "create" ? "Tutorial created" : "Tutorial updated", "success");
                setIsModalOpen(false);
                fetchTutorials();
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tutorial?")) return;

        startTransition(async () => {
            const res = await deleteTutorial(id);
            if (res?.error) {
                showToast(res.error, "error");
            } else {
                showToast("Tutorial deleted", "success");
                fetchTutorials();
            }
        });
    };

    const handleDuplicate = async () => {
        if (!duplicateTargetId) return;

        startTransition(async () => {
            const res = await duplicateTutorial(duplicateTargetId, duplicateNative, duplicateLearning);
            if (res?.error) {
                showToast(res.error, "error");
            } else {
                showToast("Tutorial duplicated", "success");
                setIsDuplicateModalOpen(false);
                fetchTutorials();
            }
        });
    };

    const openDuplicateModal = (id: string) => {
        setDuplicateTargetId(id);
        setDuplicateNative("ja");
        setDuplicateLearning("en");
        setIsDuplicateModalOpen(true);
    };

    // Step Management
    const addStep = () => {
        setFormData({
            ...formData,
            steps: [...formData.steps, { title: "", description: "", demo_type: "", demo_data: {} }],
        });
    };

    const removeStep = (index: number) => {
        setFormData({
            ...formData,
            steps: formData.steps.filter((_, i) => i !== index),
        });
    };

    const updateStep = (index: number, field: keyof TutorialStep, value: any) => {
        const newSteps = [...formData.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, steps: newSteps });
    };

    const moveStep = (index: number, direction: "up" | "down") => {
        const newSteps = [...formData.steps];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setFormData({ ...formData, steps: newSteps });
    };

    const getLanguageName = (code: string) => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700 }}>
                        Tutorial Management
                    </h2>
                    <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                        Manage tutorials for different language pairs.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <motion.button
                        onClick={fetchTutorials}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem",
                            background: "var(--color-surface)", border: "1px solid var(--color-border)",
                            borderRadius: "10px", padding: "10px 16px",
                            cursor: "pointer", color: "var(--color-fg)", fontWeight: 500
                        }}
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                    </motion.button>
                    <CreateButton label="Add Tutorial" onClick={handleOpenCreate} />
                </div>
            </div>

            {/* Filters */}
            <div style={{
                display: "flex", gap: "16px", alignItems: "center",
                padding: "16px", background: "var(--color-surface)",
                borderRadius: "12px", border: "1px solid var(--color-border)"
            }}>
                <Globe size={20} style={{ color: "var(--color-fg-muted)" }} />
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>Native:</label>
                    <select
                        value={filterNative}
                        onChange={(e) => setFilterNative(e.target.value)}
                        style={{
                            padding: "8px 12px", borderRadius: "8px",
                            border: "1px solid var(--color-border)", fontSize: "0.9rem"
                        }}
                    >
                        <option value="">All</option>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>Learning:</label>
                    <select
                        value={filterLearning}
                        onChange={(e) => setFilterLearning(e.target.value)}
                        style={{
                            padding: "8px 12px", borderRadius: "8px",
                            border: "1px solid var(--color-border)", fontSize: "0.9rem"
                        }}
                    >
                        <option value="">All</option>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tutorial List */}
            {loading ? (
                <div style={{ padding: "60px", display: "flex", justifyContent: "center" }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-fg-muted)" }} />
                </div>
            ) : tutorials.length === 0 ? (
                <div style={{
                    padding: "60px", textAlign: "center",
                    background: "var(--color-surface)", borderRadius: "12px",
                    border: "1px dashed var(--color-border)"
                }}>
                    <BookOpen size={48} style={{ color: "var(--color-fg-muted)", marginBottom: "16px" }} />
                    <p style={{ color: "var(--color-fg-muted)", fontSize: "1rem" }}>
                        No tutorials found. Create one to get started.
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {tutorials.map((tutorial) => (
                        <motion.div
                            key={tutorial.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "12px",
                                padding: "20px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                                        {tutorial.title}
                                    </h3>
                                    <span style={{
                                        padding: "4px 8px", borderRadius: "6px",
                                        fontSize: "0.75rem", fontWeight: 600,
                                        background: tutorial.is_active ? "#22c55e20" : "#ef444420",
                                        color: tutorial.is_active ? "#16a34a" : "#dc2626"
                                    }}>
                                        {tutorial.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                                    <span>
                                        <strong>Native:</strong> {getLanguageName(tutorial.native_language)}
                                    </span>
                                    <span>→</span>
                                    <span>
                                        <strong>Learning:</strong> {getLanguageName(tutorial.learning_language)}
                                    </span>
                                    <span>|</span>
                                    <span>
                                        <strong>Type:</strong> {tutorial.tutorial_type}
                                    </span>
                                    <span>|</span>
                                    <span>
                                        <strong>Steps:</strong> {tutorial.steps?.length || 0}
                                    </span>
                                </div>
                                {tutorial.description && (
                                    <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                                        {tutorial.description.substring(0, 100)}
                                        {tutorial.description.length > 100 ? "..." : ""}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <motion.button
                                    onClick={() => openDuplicateModal(tutorial.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Duplicate to another language"
                                    style={{
                                        padding: "8px 12px", background: "#f3f4f6",
                                        border: "none", borderRadius: "8px",
                                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                                        fontSize: "0.85rem", fontWeight: 500
                                    }}
                                >
                                    <Copy size={14} /> Duplicate
                                </motion.button>
                                <motion.button
                                    onClick={() => handleOpenEdit(tutorial)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: "8px 16px", background: "#6366f1",
                                        color: "white", border: "none", borderRadius: "8px",
                                        cursor: "pointer", fontSize: "0.85rem", fontWeight: 600
                                    }}
                                >
                                    Edit
                                </motion.button>
                                <motion.button
                                    onClick={() => handleDelete(tutorial.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: "8px 12px", background: "#fee2e2",
                                        border: "none", borderRadius: "8px",
                                        cursor: "pointer", color: "#dc2626"
                                    }}
                                >
                                    <Trash2 size={16} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 100,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.5)"
                        }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: "#fff",
                                width: "95%",
                                maxWidth: "800px",
                                maxHeight: "90vh",
                                borderRadius: "16px",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column"
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #e5e5e5",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
                                    {modalMode === "create" ? "Create Tutorial" : "Edit Tutorial"}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "8px",
                                        background: "#f3f4f6", border: "none", fontSize: "1.2rem",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                                {/* Basic Info */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                            Native Language *
                                        </label>
                                        <select
                                            value={formData.native_language}
                                            onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
                                            style={{
                                                width: "100%", padding: "10px 12px", borderRadius: "8px",
                                                border: "1px solid #d1d5db", fontSize: "0.95rem"
                                            }}
                                        >
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                            Learning Language *
                                        </label>
                                        <select
                                            value={formData.learning_language}
                                            onChange={(e) => setFormData({ ...formData, learning_language: e.target.value })}
                                            style={{
                                                width: "100%", padding: "10px 12px", borderRadius: "8px",
                                                border: "1px solid #d1d5db", fontSize: "0.95rem"
                                            }}
                                        >
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                            Tutorial Type *
                                        </label>
                                        <select
                                            value={formData.tutorial_type}
                                            onChange={(e) => setFormData({ ...formData, tutorial_type: e.target.value })}
                                            style={{
                                                width: "100%", padding: "10px 12px", borderRadius: "8px",
                                                border: "1px solid #d1d5db", fontSize: "0.95rem"
                                            }}
                                        >
                                            {TUTORIAL_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                style={{ width: "18px", height: "18px" }}
                                            />
                                            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>Active</span>
                                        </label>
                                    </div>
                                </div>

                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter tutorial title"
                                        style={{
                                            width: "100%", padding: "10px 12px", borderRadius: "8px",
                                            border: "1px solid #d1d5db", fontSize: "0.95rem"
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter tutorial description"
                                        rows={3}
                                        style={{
                                            width: "100%", padding: "10px 12px", borderRadius: "8px",
                                            border: "1px solid #d1d5db", fontSize: "0.95rem", resize: "vertical"
                                        }}
                                    />
                                </div>

                                {/* Steps */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <label style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                                            Steps ({formData.steps.length})
                                        </label>
                                        <button
                                            onClick={addStep}
                                            style={{
                                                display: "flex", alignItems: "center", gap: "6px",
                                                padding: "8px 14px", background: "#6366f1", color: "white",
                                                border: "none", borderRadius: "8px", fontSize: "0.85rem",
                                                fontWeight: 600, cursor: "pointer"
                                            }}
                                        >
                                            <Plus size={14} /> Add Step
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {formData.steps.map((step, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    background: "#f8f9fa",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    padding: "16px"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <GripVertical size={16} style={{ color: "#9ca3af" }} />
                                                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Step {index + 1}</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        <button
                                                            onClick={() => moveStep(index, "up")}
                                                            disabled={index === 0}
                                                            style={{
                                                                padding: "4px 8px", background: "#fff", border: "1px solid #d1d5db",
                                                                borderRadius: "6px", cursor: index === 0 ? "not-allowed" : "pointer",
                                                                opacity: index === 0 ? 0.5 : 1
                                                            }}
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveStep(index, "down")}
                                                            disabled={index === formData.steps.length - 1}
                                                            style={{
                                                                padding: "4px 8px", background: "#fff", border: "1px solid #d1d5db",
                                                                borderRadius: "6px", cursor: index === formData.steps.length - 1 ? "not-allowed" : "pointer",
                                                                opacity: index === formData.steps.length - 1 ? 0.5 : 1
                                                            }}
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeStep(index)}
                                                            style={{
                                                                padding: "4px 8px", background: "#fee2e2", border: "none",
                                                                borderRadius: "6px", cursor: "pointer", color: "#dc2626"
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "4px" }}>
                                                            Title
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={step.title}
                                                            onChange={(e) => updateStep(index, "title", e.target.value)}
                                                            placeholder="Step title"
                                                            style={{
                                                                width: "100%", padding: "8px 10px", borderRadius: "6px",
                                                                border: "1px solid #d1d5db", fontSize: "0.9rem"
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "4px" }}>
                                                            Demo Type
                                                        </label>
                                                        <select
                                                            value={step.demo_type || ""}
                                                            onChange={(e) => updateStep(index, "demo_type", e.target.value)}
                                                            style={{
                                                                width: "100%", padding: "8px 10px", borderRadius: "6px",
                                                                border: "1px solid #d1d5db", fontSize: "0.9rem"
                                                            }}
                                                        >
                                                            {DEMO_TYPES.map(type => (
                                                                <option key={type.value} value={type.value}>{type.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "4px" }}>
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={step.description}
                                                        onChange={(e) => updateStep(index, "description", e.target.value)}
                                                        placeholder="Step description"
                                                        rows={2}
                                                        style={{
                                                            width: "100%", padding: "8px 10px", borderRadius: "6px",
                                                            border: "1px solid #d1d5db", fontSize: "0.9rem", resize: "vertical"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: "16px 24px",
                                borderTop: "1px solid #e5e5e5",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px"
                            }}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        padding: "10px 20px", background: "#f3f4f6",
                                        border: "none", borderRadius: "8px",
                                        fontSize: "0.95rem", fontWeight: 500, cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    onClick={handleSubmit}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isPending}
                                    style={{
                                        padding: "10px 24px", background: "#6366f1", color: "white",
                                        border: "none", borderRadius: "8px",
                                        fontSize: "0.95rem", fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer",
                                        opacity: isPending ? 0.7 : 1,
                                        display: "flex", alignItems: "center", gap: "8px"
                                    }}
                                >
                                    {isPending && <Loader2 className="animate-spin" size={16} />}
                                    {modalMode === "create" ? "Create" : "Save Changes"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Duplicate Modal */}
            <AnimatePresence>
                {isDuplicateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 100,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.5)"
                        }}
                        onClick={() => setIsDuplicateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: "#fff",
                                width: "95%",
                                maxWidth: "400px",
                                borderRadius: "16px",
                                padding: "24px"
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ margin: "0 0 20px", fontSize: "1.15rem", fontWeight: 600 }}>
                                Duplicate Tutorial
                            </h3>
                            <p style={{ margin: "0 0 20px", fontSize: "0.9rem", color: "#666" }}>
                                Select the target language pair for the duplicated tutorial.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                        Target Native Language
                                    </label>
                                    <select
                                        value={duplicateNative}
                                        onChange={(e) => setDuplicateNative(e.target.value)}
                                        style={{
                                            width: "100%", padding: "10px 12px", borderRadius: "8px",
                                            border: "1px solid #d1d5db", fontSize: "0.95rem"
                                        }}
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                                        Target Learning Language
                                    </label>
                                    <select
                                        value={duplicateLearning}
                                        onChange={(e) => setDuplicateLearning(e.target.value)}
                                        style={{
                                            width: "100%", padding: "10px 12px", borderRadius: "8px",
                                            border: "1px solid #d1d5db", fontSize: "0.95rem"
                                        }}
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                <button
                                    onClick={() => setIsDuplicateModalOpen(false)}
                                    style={{
                                        padding: "10px 20px", background: "#f3f4f6",
                                        border: "none", borderRadius: "8px",
                                        fontSize: "0.95rem", fontWeight: 500, cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    onClick={handleDuplicate}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isPending}
                                    style={{
                                        padding: "10px 24px", background: "#6366f1", color: "white",
                                        border: "none", borderRadius: "8px",
                                        fontSize: "0.95rem", fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer",
                                        opacity: isPending ? 0.7 : 1,
                                        display: "flex", alignItems: "center", gap: "8px"
                                    }}
                                >
                                    {isPending && <Loader2 className="animate-spin" size={16} />}
                                    Duplicate
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
