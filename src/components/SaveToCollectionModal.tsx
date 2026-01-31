"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Folder, FolderPlus } from "lucide-react";
import { useCollectionsStore } from "@/store/collections-store";
import { useAppStore } from "@/store/app-context";
import { translations, NativeLanguage } from "@/lib/translations";

const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"
];

const ICONS = [
    "Folder", "Star", "Heart", "Bookmark",
    "Coffee", "Plane", "Music", "Book"
];

interface SaveToCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (collectionId: string | null) => void;
    text: string;
    translation?: string;
}

export function SaveToCollectionModal({
    isOpen,
    onClose,
    onSave,
    text,
    translation
}: SaveToCollectionModalProps) {
    const { user, nativeLanguage, activeLanguageCode } = useAppStore();
    const { collections, fetchCollections, createCollection } = useCollectionsStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [newIcon, setNewIcon] = useState(ICONS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const t = translations[(nativeLanguage || "en") as NativeLanguage] || translations.en;

    useEffect(() => {
        if (isOpen && user && activeLanguageCode) {
            fetchCollections(user.id, activeLanguageCode);
        }
    }, [isOpen, user, activeLanguageCode, fetchCollections]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleCreateCollection = async () => {
        if (!user || !activeLanguageCode || !newName.trim()) return;
        setIsSubmitting(true);
        const collection = await createCollection(user.id, activeLanguageCode, newName.trim(), {
            color: newColor,
            icon: newIcon
        });
        setIsSubmitting(false);
        if (collection) {
            setNewName("");
            setIsCreating(false);
            onSave(collection.id);
        }
    };

    const handleSelectCollection = (collectionId: string | null) => {
        onSave(collectionId);
    };

    return createPortal(
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
            onClick={onClose}
        >
            <div
                style={{
                    background: "var(--color-bg)",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "400px",
                    maxHeight: "80vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                        {(t as any).selectCollection || "Save to Collection"}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "var(--color-fg)"
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Preview */}
                <div style={{
                    padding: "0.75rem 1rem",
                    background: "var(--color-bg-sub)",
                    borderBottom: "1px solid var(--color-border)"
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}>
                        {text}
                    </p>
                    {translation && (
                        <p style={{
                            margin: "4px 0 0",
                            fontSize: "0.8rem",
                            opacity: 0.7,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                            {translation}
                        </p>
                    )}
                </div>

                {/* Collection List */}
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "0.5rem"
                }}>
                    {/* Create New Button */}
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "var(--color-bg-sub)",
                                border: "2px dashed var(--color-border)",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                color: "var(--color-fg)",
                                marginBottom: "0.5rem"
                            }}
                        >
                            <FolderPlus size={18} />
                            <span>{(t as any).createCollection || "Create New Collection"}</span>
                        </button>
                    )}

                    {/* Create Form */}
                    {isCreating && (
                        <div style={{
                            padding: "0.75rem",
                            background: "var(--color-bg-sub)",
                            borderRadius: "8px",
                            marginBottom: "0.5rem"
                        }}>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={(t as any).collectionName || "Collection name"}
                                style={{
                                    width: "100%",
                                    padding: "0.5rem",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "6px",
                                    background: "var(--color-bg)",
                                    color: "var(--color-fg)",
                                    marginBottom: "0.5rem"
                                }}
                                autoFocus
                            />

                            {/* Color Picker */}
                            <div style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "0.5rem",
                                flexWrap: "wrap"
                            }}>
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewColor(color)}
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: color,
                                            border: newColor === color
                                                ? "2px solid var(--color-fg)"
                                                : "2px solid transparent",
                                            cursor: "pointer"
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Icon Picker */}
                            <div style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "0.75rem",
                                flexWrap: "wrap"
                            }}>
                                {ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setNewIcon(icon)}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            background: newIcon === icon
                                                ? "var(--color-border)"
                                                : "transparent",
                                            border: "1px solid var(--color-border)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--color-fg)"
                                        }}
                                    >
                                        <Folder size={16} />
                                    </button>
                                ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewName("");
                                    }}
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
                                    {(t as any).cancel || "Cancel"}
                                </button>
                                <button
                                    onClick={handleCreateCollection}
                                    disabled={!newName.trim() || isSubmitting}
                                    style={{
                                        flex: 1,
                                        padding: "0.5rem",
                                        background: newName.trim()
                                            ? "var(--color-accent)"
                                            : "var(--color-border)",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: newName.trim() ? "pointer" : "not-allowed",
                                        color: "white"
                                    }}
                                >
                                    {isSubmitting ? "..." : ((t as any).create || "Create")}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Collections */}
                    {collections.map((collection) => (
                        <button
                            key={collection.id}
                            onClick={() => handleSelectCollection(collection.id)}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "var(--color-bg-sub)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                marginBottom: "0.5rem",
                                color: "var(--color-fg)"
                            }}
                        >
                            <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: collection.color || "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white"
                            }}>
                                <Folder size={16} />
                            </div>
                            <span style={{ fontWeight: 500 }}>{collection.name}</span>
                        </button>
                    ))}

                    {/* Uncategorized Option */}
                    <button
                        onClick={() => handleSelectCollection(null)}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            background: "transparent",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            color: "var(--color-fg)",
                            opacity: 0.7
                        }}
                    >
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "var(--color-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <Folder size={16} />
                        </div>
                        <span>{(t as any).uncategorized || "Uncategorized (History only)"}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
