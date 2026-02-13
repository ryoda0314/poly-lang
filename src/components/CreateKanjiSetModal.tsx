"use client";

import { useState } from "react";
import { X, Book } from "lucide-react";

const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"
];

interface CreateKanjiSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string, color: string) => Promise<void>;
}

export function CreateKanjiSetModal({
    isOpen,
    onClose,
    onCreate
}: CreateKanjiSetModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLORS[5]); // Blue as default
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!name.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onCreate(name.trim(), description.trim(), color);
            setName("");
            setDescription("");
            setColor(COLORS[5]);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setColor(COLORS[5]);
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
                    maxWidth: "400px",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                        新しい漢字セットを作成
                    </h3>
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
                <div style={{ padding: "1.5rem" }}>
                    {/* Preview */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1.5rem"
                    }}>
                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "16px",
                            background: color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            boxShadow: `0 8px 24px ${color}40`
                        }}>
                            <Book size={32} />
                        </div>
                    </div>

                    {/* Name Input */}
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--color-fg-muted)",
                            marginBottom: "0.5rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            セット名
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例: JLPT N5 漢字"
                            style={{
                                width: "100%",
                                padding: "0.875rem 1rem",
                                border: "2px solid var(--color-border)",
                                borderRadius: "12px",
                                background: "var(--color-bg)",
                                color: "var(--color-fg)",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreate();
                                if (e.key === "Escape") handleClose();
                            }}
                        />
                    </div>

                    {/* Description Input */}
                    <div style={{ marginBottom: "1.25rem" }}>
                        <label style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--color-fg-muted)",
                            marginBottom: "0.5rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            説明（任意）
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="初級漢字から韓国語の漢字語を学習"
                            style={{
                                width: "100%",
                                padding: "0.875rem 1rem",
                                border: "2px solid var(--color-border)",
                                borderRadius: "12px",
                                background: "var(--color-bg)",
                                color: "var(--color-fg)",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                        />
                    </div>

                    {/* Color Picker */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--color-fg-muted)",
                            marginBottom: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            カラー
                        </label>
                        <div style={{
                            display: "flex",
                            gap: "10px",
                            justifyContent: "center"
                        }}>
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        background: c,
                                        border: color === c
                                            ? "3px solid var(--color-fg)"
                                            : "3px solid transparent",
                                        cursor: "pointer",
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        boxShadow: color === c ? `0 4px 12px ${c}60` : "none",
                                        transform: color === c ? "scale(1.1)" : "scale(1)"
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "1rem 1.5rem 1.5rem",
                    display: "flex",
                    gap: "0.75rem"
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            flex: 1,
                            padding: "0.875rem",
                            background: "var(--color-bg-sub)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            color: "var(--color-fg)",
                            fontSize: "0.95rem",
                            fontWeight: 500
                        }}
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || isSubmitting}
                        style={{
                            flex: 1,
                            padding: "0.875rem",
                            background: name.trim() ? color : "var(--color-border)",
                            border: "none",
                            borderRadius: "12px",
                            cursor: name.trim() ? "pointer" : "not-allowed",
                            color: "white",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            boxShadow: name.trim() ? `0 4px 12px ${color}40` : "none",
                            transition: "all 0.2s"
                        }}
                    >
                        {isSubmitting ? "..." : "作成"}
                    </button>
                </div>
            </div>
        </div>
    );
}
