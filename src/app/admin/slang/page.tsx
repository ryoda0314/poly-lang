"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlangStore } from "@/store/slang-store";
import { extractSlangFromText, ExtractedSlang } from "@/actions/extract-slang";
import {
    Plus,
    X,
    Bot,
    Save,
    Database,
    Code2,
    ArrowDownToLine,
    Sparkles,
    FileText,
    Trash2,
    Pencil,
    Check,
} from "lucide-react";
import styles from "./page.module.css";
import clsx from "clsx";

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "zh", name: "中文" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "ru", name: "Русский" },
];

export default function SlangAdminPage() {
    const { addSlang, addSlangBulk, fetchSlang, terms, isLoading } = useSlangStore();

    // Tab State
    const [activeTab, setActiveTab] = useState<"add" | "manage">("add");

    // Manual Form State
    const [formData, setFormData] = useState({
        term: "",
        definition: "",
        language_code: "en",
    });

    // Bulk Import State
    const [bulkText, setBulkText] = useState("");
    const [bulkLanguage, setBulkLanguage] = useState("en");
    const [jsonInput, setJsonInput] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [parsedItems, setParsedItems] = useState<ExtractedSlang[]>([]);

    // Manage Tab State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchSlang("en");
    }, [fetchSlang]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addSlang(formData.term, formData.definition, formData.language_code);
        setFormData((prev) => ({
            ...prev,
            term: "",
            definition: "",
        }));
    };

    const handleBulkParse = async () => {
        if (!bulkText.trim()) return;
        setIsParsing(true);
        const results = await extractSlangFromText(bulkText, bulkLanguage);
        if (results) {
            setParsedItems((prev) => [...prev, ...results]);
        }
        setIsParsing(false);
        setBulkText("");
    };

    const handleJsonParse = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (Array.isArray(parsed)) {
                const validItems = parsed.map((p: any) => ({
                    term: p.term || "",
                    definition: p.definition || "",
                    language_code: p.language_code || "en",
                }));
                setParsedItems((prev) => [...prev, ...validItems]);
                setJsonInput("");
            }
        } catch {
            // Invalid JSON
        }
    };

    const handleSaveBulk = async () => {
        if (parsedItems.length === 0) return;
        await addSlangBulk(parsedItems);
        setParsedItems([]);
        fetchSlang("en");
    };

    const updateParsedItem = (
        index: number,
        field: keyof ExtractedSlang,
        value: string
    ) => {
        setParsedItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const removeParsedItem = (index: number) => {
        setParsedItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDelete = async (id: string) => {
        if (confirm("このスラングを削除しますか？")) {
            await useSlangStore.getState().deleteSlang(id);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`${selectedIds.size}件のスラングを削除しますか？`)) return;

        setIsDeleting(true);
        await useSlangStore.getState().deleteSlangBulk(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsDeleting(false);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === terms.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(terms.map((t) => t.id)));
        }
    };

    const handleUpdate = async (
        id: string,
        field: string,
        value: any
    ) => {
        await useSlangStore.getState().updateSlang(id, { [field]: value });
    };

    const sortedTerms = [...terms].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <Sparkles size={28} className={styles.titleIcon} />
                    <h1 className={styles.title}>スラング管理</h1>
                </div>
                <p className={styles.subtitle}>スラングデータベースの追加・編集・管理</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={clsx(styles.tab, activeTab === "add" && styles.tabActive)}
                    onClick={() => setActiveTab("add")}
                >
                    <Plus size={18} />
                    <span>追加</span>
                </button>
                <button
                    className={clsx(styles.tab, activeTab === "manage" && styles.tabActive)}
                    onClick={() => setActiveTab("manage")}
                >
                    <Database size={18} />
                    <span>管理</span>
                    <span className={styles.tabBadge}>{terms.length}</span>
                </button>
            </div>

            {/* Add Tab */}
            <AnimatePresence mode="wait">
                {activeTab === "add" && (
                    <motion.div
                        key="add"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* AI Bulk Import */}
                        <div className={clsx(styles.section, styles.sectionAi)}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>AI一括インポート</h2>
                                    <p className={styles.sectionSubtitle}>
                                        テキストからスラングを自動抽出
                                    </p>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>言語</label>
                                <select
                                    className={styles.select}
                                    value={bulkLanguage}
                                    onChange={(e) => setBulkLanguage(e.target.value)}
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <textarea
                                className={styles.textarea}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder="テキストを貼り付けてください... (例: 'rizz means charisma. no cap means for real.')"
                                rows={4}
                            />

                            <div className={styles.btnRow}>
                                <button
                                    className={clsx(styles.btn, styles.btnPrimary)}
                                    onClick={handleBulkParse}
                                    disabled={isParsing || !bulkText.trim()}
                                >
                                    {isParsing ? (
                                        "解析中..."
                                    ) : (
                                        <>
                                            <Bot size={16} />
                                            AIで解析
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* JSON Import */}
                        <div className={clsx(styles.section, styles.sectionJson)}>
                            <div className={styles.sectionHeader}>
                                <div className={clsx(styles.sectionIcon, styles.sectionIconMuted)}>
                                    <Code2 size={20} />
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>JSONインポート</h2>
                                    <p className={styles.sectionSubtitle}>
                                        JSON配列を直接インポート
                                    </p>
                                </div>
                            </div>

                            <textarea
                                className={clsx(styles.textarea, styles.textareaCode)}
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='[{"term": "slang", "definition": "定義", "language_code": "en"}]'
                                rows={3}
                            />

                            <div className={styles.btnRow}>
                                <button
                                    className={clsx(styles.btn, styles.btnSecondary)}
                                    onClick={handleJsonParse}
                                    disabled={!jsonInput.trim()}
                                >
                                    <ArrowDownToLine size={16} />
                                    JSONを読み込む
                                </button>
                            </div>
                        </div>

                        {/* Parsed Items Preview */}
                        {parsedItems.length > 0 && (
                            <div className={styles.previewSection}>
                                <div className={styles.previewHeader}>
                                    <h3 className={styles.previewTitle}>プレビュー</h3>
                                    <span className={styles.previewCount}>
                                        {parsedItems.length}件
                                    </span>
                                </div>

                                <div className={styles.previewList}>
                                    {parsedItems.map((item, idx) => (
                                        <div key={idx} className={styles.previewItem}>
                                            <button
                                                className={styles.previewRemoveBtn}
                                                onClick={() => removeParsedItem(idx)}
                                            >
                                                <X size={14} />
                                            </button>

                                            <div className={styles.previewItemHeader}>
                                                <input
                                                    className={styles.previewTermInput}
                                                    value={item.term}
                                                    onChange={(e) =>
                                                        updateParsedItem(idx, "term", e.target.value)
                                                    }
                                                    placeholder="スラング"
                                                />
                                                <span className={styles.previewLangBadge}>
                                                    {item.language_code.toUpperCase()}
                                                </span>
                                            </div>

                                            <textarea
                                                className={styles.previewDefinitionInput}
                                                value={item.definition}
                                                onChange={(e) =>
                                                    updateParsedItem(idx, "definition", e.target.value)
                                                }
                                                placeholder="定義"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={clsx(styles.btn, styles.btnSuccess, styles.btnFull)}
                                    onClick={handleSaveBulk}
                                >
                                    <Save size={18} />
                                    すべて保存
                                </button>
                            </div>
                        )}

                        {/* Manual Entry */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={clsx(styles.sectionIcon, styles.sectionIconMuted)}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>手動入力</h2>
                                    <p className={styles.sectionSubtitle}>
                                        1件ずつスラングを追加
                                    </p>
                                </div>
                            </div>

                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={clsx(styles.formRow, styles.formRow2)}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>スラング</label>
                                        <input
                                            className={styles.input}
                                            name="term"
                                            value={formData.term}
                                            onChange={handleChange}
                                            placeholder="例: rizz"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>言語</label>
                                        <select
                                            className={styles.select}
                                            name="language_code"
                                            value={formData.language_code}
                                            onChange={handleChange}
                                        >
                                            {LANGUAGES.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>定義</label>
                                    <textarea
                                        className={styles.textarea}
                                        name="definition"
                                        value={formData.definition}
                                        onChange={handleChange}
                                        placeholder="意味と使い方の説明..."
                                        required
                                        rows={3}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={clsx(styles.btn, styles.btnPrimary, styles.btnFull)}
                                >
                                    <Plus size={18} />
                                    追加
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* Manage Tab */}
                {activeTab === "manage" && (
                    <motion.div
                        key="manage"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className={styles.manageHeader}>
                            {/* Bulk Actions */}
                            {terms.length > 0 && (
                                <div className={styles.bulkActions}>
                                    <div className={styles.selectAllRow}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={selectedIds.size === terms.length && terms.length > 0}
                                            onChange={toggleSelectAll}
                                            id="selectAll"
                                        />
                                        <label htmlFor="selectAll" className={styles.selectLabel}>
                                            すべて選択
                                        </label>
                                        {selectedIds.size > 0 && (
                                            <span className={styles.selectedCount}>
                                                ({selectedIds.size}件選択中)
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className={clsx(styles.btn, styles.btnDanger)}
                                        onClick={handleBulkDelete}
                                        disabled={selectedIds.size === 0 || isDeleting}
                                    >
                                        <Trash2 size={16} />
                                        {isDeleting ? "削除中..." : `一括削除`}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Term List */}
                        {isLoading ? (
                            <div className={styles.loadingState}>読み込み中...</div>
                        ) : sortedTerms.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>スラングがありません</p>
                            </div>
                        ) : (
                            <div className={styles.termList}>
                                {sortedTerms.map((term) => (
                                    <div
                                        key={term.id}
                                        className={clsx(
                                            styles.termCard,
                                            editingId === term.id && styles.termCardEdit,
                                            selectedIds.has(term.id) && styles.termCardSelected
                                        )}
                                    >
                                        <div className={styles.termCardHeader}>
                                            <input
                                                type="checkbox"
                                                className={clsx(styles.checkbox, styles.termCardCheckbox)}
                                                checked={selectedIds.has(term.id)}
                                                onChange={() => toggleSelect(term.id)}
                                            />
                                            <div className={styles.termCardMain}>
                                                {editingId === term.id ? (
                                                    <>
                                                        <input
                                                            className={styles.editInput}
                                                            value={term.term}
                                                            onChange={(e) =>
                                                                handleUpdate(term.id, "term", e.target.value)
                                                            }
                                                        />
                                                        <textarea
                                                            className={styles.editTextarea}
                                                            value={term.definition}
                                                            onChange={(e) =>
                                                                handleUpdate(
                                                                    term.id,
                                                                    "definition",
                                                                    e.target.value
                                                                )
                                                            }
                                                            rows={2}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className={styles.termCardTerm}>
                                                            {term.term}
                                                        </h3>
                                                        <p className={styles.termCardDefinition}>
                                                            {term.definition}
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            <div className={styles.termCardActions}>
                                                <span className={styles.termCardLang}>
                                                    {term.language_code.toUpperCase()}
                                                </span>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() =>
                                                        setEditingId(
                                                            editingId === term.id ? null : term.id
                                                        )
                                                    }
                                                >
                                                    {editingId === term.id ? (
                                                        <Check size={16} />
                                                    ) : (
                                                        <Pencil size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    className={clsx(
                                                        styles.actionBtn,
                                                        styles.actionBtnDanger
                                                    )}
                                                    onClick={() => handleDelete(term.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
