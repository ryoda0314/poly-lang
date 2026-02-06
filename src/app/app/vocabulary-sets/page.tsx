"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";
import { getVocabularySets, createVocabularySet, updateVocabularySet, deleteVocabularySet, VocabularySet } from "@/actions/vocabulary-sets";
import { FolderOpen, Plus, Trash2, Edit2, BookMarked, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./page.module.css";

export default function VocabularySetsPage() {
    const router = useRouter();
    const { activeLanguageCode } = useAppStore();

    const [sets, setSets] = useState<VocabularySet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingSet, setEditingSet] = useState<VocabularySet | null>(null);
    const [modalName, setModalName] = useState("");
    const [modalDescription, setModalDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (menuOpenId) {
                setMenuOpenId(null);
            }
        };

        if (menuOpenId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [menuOpenId]);

    const fetchSets = useCallback(async () => {
        setIsLoading(true);
        const result = await getVocabularySets(activeLanguageCode);
        if (!result.error) {
            setSets(result.sets);
        }
        setIsLoading(false);
    }, [activeLanguageCode]);

    useEffect(() => {
        fetchSets();
    }, [fetchSets]);

    const handleOpenCreate = () => {
        setEditingSet(null);
        setModalName("");
        setModalDescription("");
        setShowModal(true);
    };

    const handleOpenEdit = (set: VocabularySet) => {
        setEditingSet(set);
        setModalName(set.name);
        setModalDescription(set.description || "");
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSet(null);
        setModalName("");
        setModalDescription("");
    };

    const handleSubmit = async () => {
        if (!modalName.trim()) return;

        setIsSubmitting(true);

        if (editingSet) {
            // Update existing set
            const result = await updateVocabularySet(
                editingSet.id,
                modalName.trim(),
                modalDescription.trim() || undefined
            );

            if (result.success) {
                await fetchSets();
                handleCloseModal();
            }
        } else {
            // Create new set
            const result = await createVocabularySet(
                modalName.trim(),
                activeLanguageCode,
                modalDescription.trim() || undefined
            );

            if (result.success) {
                await fetchSets();
                handleCloseModal();
            }
        }

        setIsSubmitting(false);
    };

    const handleDelete = async (setId: string, setName: string) => {
        if (!confirm(`「${setName}」を削除しますか？\n※単語集内の単語は削除されません`)) return;

        const result = await deleteVocabularySet(setId);
        if (result.success) {
            await fetchSets();
        }
    };

    const handleSetClick = (setId: string) => {
        router.push(`/app/my-vocabulary?setId=${setId}`);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.createButton} onClick={handleOpenCreate}>
                    <Plus size={20} />
                    新規作成
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <p>読み込み中...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && sets.length === 0 && (
                <div className={styles.emptyState}>
                    <FolderOpen size={64} className={styles.emptyIcon} />
                    <h2>単語集がありません</h2>
                    <p>単語集を作成して、生成した単語を整理しましょう</p>
                    <button className={styles.emptyCreateButton} onClick={handleOpenCreate}>
                        <Plus size={20} />
                        単語集を作成
                    </button>
                </div>
            )}

            {/* Sets Grid */}
            {!isLoading && sets.length > 0 && (
                <div className={styles.setsGrid}>
                    {sets.map((set) => (
                        <div
                            key={set.id}
                            className={styles.setCard}
                            onClick={() => handleSetClick(set.id)}
                        >
                            <div className={styles.setIcon}>
                                <BookMarked size={24} />
                            </div>
                            <div className={styles.setInfo}>
                                <h3 className={styles.setName}>{set.name}</h3>
                                {set.description && (
                                    <p className={styles.setDescription}>{set.description}</p>
                                )}
                                <div className={styles.setMeta}>
                                    <span className={styles.wordCount}>
                                        {set.wordCount}語
                                    </span>
                                    <span className={styles.setDate}>
                                        {formatDate(set.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.menuContainer}>
                                <button
                                    className={styles.menuButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === set.id ? null : set.id);
                                    }}
                                >
                                    <MoreVertical size={20} />
                                </button>
                                {menuOpenId === set.id && (
                                    <>
                                        <div
                                            className={styles.menuOverlay}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(null);
                                            }}
                                        />
                                        <div className={styles.dropdownMenu}>
                                            <button
                                                className={styles.menuItem}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenId(null);
                                                    handleOpenEdit(set);
                                                }}
                                            >
                                                <Edit2 size={16} />
                                                編集
                                            </button>
                                            <button
                                                className={styles.menuItem}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenId(null);
                                                    handleDelete(set.id, set.name);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                                削除
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && mounted && createPortal(
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "1rem"
                    }}
                    onClick={handleCloseModal}
                >
                    <div
                        style={{
                            background: "var(--color-bg)",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "400px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: "1rem",
                            borderBottom: "1px solid var(--color-border)"
                        }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                                {editingSet ? "単語集を編集" : "新しい単語集"}
                            </h3>
                        </div>

                        {/* Form */}
                        <div style={{ padding: "1rem" }}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.5rem",
                                    color: "var(--color-fg)"
                                }}>
                                    名前 *
                                </label>
                                <input
                                    type="text"
                                    value={modalName}
                                    onChange={(e) => setModalName(e.target.value)}
                                    placeholder="例: ビジネス英語"
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "6px",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontSize: "0.9rem"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.5rem",
                                    color: "var(--color-fg)"
                                }}>
                                    説明（任意）
                                </label>
                                <textarea
                                    value={modalDescription}
                                    onChange={(e) => setModalDescription(e.target.value)}
                                    placeholder="この単語集について..."
                                    rows={3}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "6px",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontSize: "0.9rem",
                                        resize: "vertical"
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={handleCloseModal}
                                    style={{
                                        flex: 1,
                                        padding: "0.5rem",
                                        background: "var(--color-bg)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        color: "var(--color-fg)"
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!modalName.trim() || isSubmitting}
                                    style={{
                                        flex: 1,
                                        padding: "0.5rem",
                                        background: modalName.trim()
                                            ? "var(--color-accent)"
                                            : "var(--color-border)",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: modalName.trim() ? "pointer" : "not-allowed",
                                        color: "white"
                                    }}
                                >
                                    {isSubmitting ? "..." : (editingSet ? "更新" : "作成")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
