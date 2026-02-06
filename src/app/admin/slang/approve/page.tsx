"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlangStore, SlangTerm } from "@/store/slang-store";
import {
    CheckCircle,
    XCircle,
    Trash2,
    ChevronLeft,
    Clock,
    Globe,
    Pencil,
    Check,
} from "lucide-react";
import styles from "./approve.module.css";
import clsx from "clsx";

const LANGUAGE_NAMES: Record<string, string> = {
    en: "English", ja: "日本語", ko: "한국어", zh: "中文",
    es: "Español", fr: "Français", de: "Deutsch", ru: "Русский", vi: "Tiếng Việt",
};

export default function SlangApprovePage() {
    const { terms, isLoading, fetchSlang, updateSlangStatus, deleteSlang } = useSlangStore();
    const [selectedLang, setSelectedLang] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTerm, setEditTerm] = useState('');
    const [editDef, setEditDef] = useState('');

    useEffect(() => {
        // Fetch all (no status filter) to get pending items
        fetchSlang("en");
    }, [fetchSlang]);

    const pendingTerms = useMemo(() =>
        terms.filter(t => t.status === 'pending')
    , [terms]);

    const langCounts = useMemo(() => {
        const map = new Map<string, number>();
        pendingTerms.forEach(t => {
            map.set(t.language_code, (map.get(t.language_code) || 0) + 1);
        });
        return Array.from(map.entries())
            .map(([code, count]) => ({ code, count }))
            .sort((a, b) => b.count - a.count);
    }, [pendingTerms]);

    const visibleTerms = useMemo(() => {
        if (!selectedLang) return pendingTerms;
        return pendingTerms.filter(t => t.language_code === selectedLang);
    }, [pendingTerms, selectedLang]);

    const handleApprove = async (id: string) => {
        if (editingId === id) {
            // Save edits first
            await useSlangStore.getState().updateSlang(id, { term: editTerm, definition: editDef });
            setEditingId(null);
        }
        await updateSlangStatus(id, 'approved');
    };

    const handleReject = async (id: string) => {
        await updateSlangStatus(id, 'rejected');
    };

    const handleDelete = async (id: string) => {
        await deleteSlang(id);
    };

    const startEdit = (term: SlangTerm) => {
        setEditingId(term.id);
        setEditTerm(term.term);
        setEditDef(term.definition);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleApproveAll = async () => {
        if (!confirm(`${visibleTerms.length}件すべて承認しますか？`)) return;
        for (const t of visibleTerms) {
            await updateSlangStatus(t.id, 'approved');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <a href="/admin/slang" className={styles.backLink}>
                    <ChevronLeft size={20} />
                    スラング管理
                </a>
                <div className={styles.titleRow}>
                    <Clock size={28} className={styles.titleIcon} />
                    <h1 className={styles.title}>承認待ち</h1>
                    <span className={styles.badge}>{pendingTerms.length}</span>
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loading}>読み込み中...</div>
            ) : pendingTerms.length === 0 ? (
                <div className={styles.empty}>
                    <CheckCircle size={48} className={styles.emptyIcon} />
                    <p>承認待ちのスラングはありません</p>
                </div>
            ) : (
                <>
                    {/* Language filter */}
                    <div className={styles.langFilter}>
                        <button
                            className={clsx(styles.langBtn, !selectedLang && styles.langBtnActive)}
                            onClick={() => setSelectedLang(null)}
                        >
                            すべて ({pendingTerms.length})
                        </button>
                        {langCounts.map(({ code, count }) => (
                            <button
                                key={code}
                                className={clsx(styles.langBtn, selectedLang === code && styles.langBtnActive)}
                                onClick={() => setSelectedLang(code)}
                            >
                                {code.toUpperCase()} ({count})
                            </button>
                        ))}
                    </div>

                    {/* Bulk approve */}
                    {visibleTerms.length > 1 && (
                        <button className={styles.approveAllBtn} onClick={handleApproveAll}>
                            <CheckCircle size={16} />
                            すべて承認 ({visibleTerms.length}件)
                        </button>
                    )}

                    {/* Pending list */}
                    <div className={styles.list}>
                        <AnimatePresence>
                            {visibleTerms.map((term) => (
                                <motion.div
                                    key={term.id}
                                    className={styles.card}
                                    initial={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: "hidden" }}
                                    transition={{ duration: 0.2 }}
                                    layout
                                >
                                    <div className={styles.cardTop}>
                                        <span className={styles.cardLang}>
                                            <Globe size={14} />
                                            {LANGUAGE_NAMES[term.language_code] || term.language_code.toUpperCase()}
                                        </span>
                                        <span className={styles.cardDate}>
                                            {new Date(term.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {editingId === term.id ? (
                                        <div className={styles.editSection}>
                                            <input
                                                className={styles.editInput}
                                                value={editTerm}
                                                onChange={(e) => setEditTerm(e.target.value)}
                                                placeholder="スラング"
                                            />
                                            <textarea
                                                className={styles.editTextarea}
                                                value={editDef}
                                                onChange={(e) => setEditDef(e.target.value)}
                                                placeholder="定義"
                                                rows={2}
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.cardBody}>
                                            <h3 className={styles.cardTerm}>{term.term}</h3>
                                            <p className={styles.cardDef}>{term.definition}</p>
                                        </div>
                                    )}

                                    <div className={styles.cardActions}>
                                        <button
                                            className={clsx(styles.actionBtn, styles.approveBtn)}
                                            onClick={() => handleApprove(term.id)}
                                            title="承認"
                                        >
                                            <CheckCircle size={20} />
                                            承認
                                        </button>
                                        <button
                                            className={clsx(styles.actionBtn, styles.rejectBtn)}
                                            onClick={() => handleReject(term.id)}
                                            title="却下"
                                        >
                                            <XCircle size={20} />
                                            却下
                                        </button>
                                        {editingId === term.id ? (
                                            <button
                                                className={clsx(styles.actionBtn, styles.editBtn)}
                                                onClick={cancelEdit}
                                                title="キャンセル"
                                            >
                                                <Check size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                className={clsx(styles.actionBtn, styles.editBtn)}
                                                onClick={() => startEdit(term)}
                                                title="編集"
                                            >
                                                <Pencil size={20} />
                                            </button>
                                        )}
                                        <button
                                            className={clsx(styles.actionBtn, styles.deleteBtn)}
                                            onClick={() => handleDelete(term.id)}
                                            title="削除"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
}
