"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Plus, Edit2, FolderOpen, AlertTriangle } from "lucide-react";
import { Database } from "@/types/supabase";

type PhraseSet = Database['public']['Tables']['phrase_sets']['Row'];
type PhraseSetItem = Database['public']['Tables']['phrase_set_items']['Row'];

const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"
];

interface ManagePhraseSetModalProps {
    isOpen: boolean;
    phraseSet: PhraseSet | null;
    phrases: PhraseSetItem[];
    onClose: () => void;
    onUpdate: (updates: { name?: string; description?: string; color?: string }) => Promise<void>;
    onDelete: () => Promise<void>;
    onDeletePhrase: (phraseId: string) => Promise<void>;
    onAddPhrases: () => void;
    translations: {
        manage_set: string;
        edit_set: string;
        set_name: string;
        description: string;
        color: string;
        phrases_in_set: string;
        no_phrases: string;
        add_phrases: string;
        delete_set: string;
        delete_set_confirm: string;
        cancel: string;
        save: string;
        delete: string;
    };
}

export function ManagePhraseSetModal({
    isOpen,
    phraseSet,
    phrases,
    onClose,
    onUpdate,
    onDelete,
    onDeletePhrase,
    onAddPhrases,
    translations: t
}: ManagePhraseSetModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLORS[5]);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (phraseSet) {
            setName(phraseSet.name);
            setDescription(phraseSet.description || "");
            setColor(phraseSet.color || COLORS[5]);
        }
    }, [phraseSet]);

    if (!isOpen || !phraseSet) return null;

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        try {
            await onUpdate({
                name: name.trim(),
                description: description.trim() || undefined,
                color
            });
            setIsEditing(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await onDelete();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsEditing(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    return (
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
                zIndex: 1000,
                padding: "1rem"
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    background: "var(--color-bg)",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "480px",
                    maxHeight: "85vh",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    display: "flex",
                    flexDirection: "column"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: phraseSet.color || color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white"
                        }}>
                            <FolderOpen size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                                {phraseSet.name}
                            </h3>
                            <span style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>
                                {phraseSet.phrase_count} phrases
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "var(--color-bg-sub)",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            color: "var(--color-fg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.5rem"
                }}>
                    {showDeleteConfirm ? (
                        <div style={{
                            textAlign: "center",
                            padding: "2rem 1rem"
                        }}>
                            <AlertTriangle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
                            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                                {t.delete_set}
                            </h4>
                            <p style={{ color: "var(--color-fg-muted)", marginBottom: "1.5rem" }}>
                                {t.delete_set_confirm}
                            </p>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "var(--color-bg-sub)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        color: "var(--color-fg)",
                                        fontWeight: 500
                                    }}
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "#ef4444",
                                        border: "none",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        color: "white",
                                        fontWeight: 500
                                    }}
                                >
                                    {isSubmitting ? "..." : t.delete}
                                </button>
                            </div>
                        </div>
                    ) : isEditing ? (
                        <div>
                            {/* Edit Form */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "var(--color-fg-muted)",
                                    marginBottom: "0.5rem",
                                    textTransform: "uppercase"
                                }}>
                                    {t.set_name}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        border: "2px solid var(--color-border)",
                                        borderRadius: "10px",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontSize: "1rem"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "var(--color-fg-muted)",
                                    marginBottom: "0.5rem",
                                    textTransform: "uppercase"
                                }}>
                                    {t.description}
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        border: "2px solid var(--color-border)",
                                        borderRadius: "10px",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontSize: "1rem"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "var(--color-fg-muted)",
                                    marginBottom: "0.75rem",
                                    textTransform: "uppercase"
                                }}>
                                    {t.color}
                                </label>
                                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                background: c,
                                                border: color === c ? "3px solid var(--color-fg)" : "3px solid transparent",
                                                cursor: "pointer",
                                                transform: color === c ? "scale(1.1)" : "scale(1)"
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: "var(--color-bg-sub)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        color: "var(--color-fg)",
                                        fontWeight: 500
                                    }}
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!name.trim() || isSubmitting}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: color,
                                        border: "none",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        color: "white",
                                        fontWeight: 600
                                    }}
                                >
                                    {isSubmitting ? "..." : t.save}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Actions */}
                            <div style={{
                                display: "flex",
                                gap: "0.5rem",
                                marginBottom: "1.5rem"
                            }}>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: "var(--color-bg-sub)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        color: "var(--color-fg)",
                                        fontWeight: 500,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <Edit2 size={16} />
                                    {t.edit_set}
                                </button>
                                <button
                                    onClick={() => {
                                        onAddPhrases();
                                        onClose();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: "var(--color-accent)",
                                        border: "none",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        color: "white",
                                        fontWeight: 500,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <Plus size={16} />
                                    {t.add_phrases}
                                </button>
                            </div>

                            {/* Phrases List */}
                            <h4 style={{
                                margin: "0 0 0.75rem 0",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                color: "var(--color-fg-muted)"
                            }}>
                                {t.phrases_in_set}
                            </h4>
                            {phrases.length === 0 ? (
                                <div style={{
                                    padding: "2rem",
                                    textAlign: "center",
                                    color: "var(--color-fg-muted)",
                                    background: "var(--color-bg-sub)",
                                    borderRadius: "12px"
                                }}>
                                    {t.no_phrases}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {phrases.map((phrase) => (
                                        <div
                                            key={phrase.id}
                                            style={{
                                                padding: "0.75rem",
                                                background: "var(--color-bg-sub)",
                                                borderRadius: "8px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between"
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: "0.95rem",
                                                    fontWeight: 500,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {phrase.target_text}
                                                </div>
                                                <div style={{
                                                    fontSize: "0.8rem",
                                                    color: "var(--color-fg-muted)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {phrase.translation}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onDeletePhrase(phrase.id)}
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "var(--color-fg-muted)",
                                                    padding: "8px",
                                                    marginLeft: "8px",
                                                    borderRadius: "6px"
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Delete Set Button */}
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{
                                    width: "100%",
                                    marginTop: "1.5rem",
                                    padding: "0.75rem",
                                    background: "transparent",
                                    border: "1px solid #ef4444",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                <Trash2 size={16} />
                                {t.delete_set}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
