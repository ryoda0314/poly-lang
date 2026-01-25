"use client";

import React, { useState } from "react";
import { Database } from "@/types/supabase";
import { BookOpen, ChevronDown, Check, Plus, Settings, FolderOpen } from "lucide-react";

type PhraseSet = Database['public']['Tables']['phrase_sets']['Row'];

interface Props {
    phraseSets: PhraseSet[];
    selectedSetId: string | 'builtin';
    onSelect: (id: string | 'builtin') => void;
    onCreateNew: () => void;
    onManage?: (setId: string) => void;
    builtinLabel?: string;
    translations: {
        basic_phrases: string;
        create_phrase_set: string;
        manage: string;
        phrase_sets: string;
    };
}

export default function PhraseSetSelector({
    phraseSets,
    selectedSetId,
    onSelect,
    onCreateNew,
    onManage,
    builtinLabel,
    translations: t
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedName = selectedSetId === 'builtin'
        ? (builtinLabel || t.basic_phrases)
        : phraseSets.find(s => s.id === selectedSetId)?.name || t.basic_phrases;

    const selectedColor = selectedSetId === 'builtin'
        ? undefined
        : phraseSets.find(s => s.id === selectedSetId)?.color;

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: "8px 12px 8px 12px",
                    borderRadius: "24px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-fg)",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontWeight: 500,
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-fg-muted)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
            >
                {selectedColor ? (
                    <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: selectedColor
                    }} />
                ) : (
                    <FolderOpen size={16} className="text-muted-foreground" />
                )}
                <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedName}
                </span>
                <ChevronDown size={16} style={{ marginLeft: "4px", opacity: 0.5 }} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 90 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "16px",
                        padding: "8px",
                        boxShadow: "var(--shadow-lg)",
                        zIndex: 1000,
                        minWidth: "240px",
                        maxHeight: "60vh",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px"
                    }}>
                        {/* Built-in Phrases Option */}
                        <button
                            onClick={() => {
                                onSelect('builtin');
                                setIsOpen(false);
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                background: selectedSetId === 'builtin' ? "var(--color-bg-sub)" : "transparent",
                                border: "none",
                                textAlign: "left",
                                color: "var(--color-fg)",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: selectedSetId === 'builtin' ? 600 : 400
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
                                <span>{builtinLabel || t.basic_phrases}</span>
                            </div>
                            {selectedSetId === 'builtin' && <Check size={16} />}
                        </button>

                        {phraseSets.length > 0 && (
                            <div style={{ height: 1, background: "var(--color-border-sub)", margin: "4px 8px" }} />
                        )}

                        {/* Custom Phrase Sets */}
                        {phraseSets.map(set => (
                            <div
                                key={set.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                }}
                            >
                                <button
                                    onClick={() => {
                                        onSelect(set.id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flex: 1,
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        background: selectedSetId === set.id ? "var(--color-bg-sub)" : "transparent",
                                        border: "none",
                                        textAlign: "left",
                                        color: "var(--color-fg)",
                                        cursor: "pointer",
                                        fontSize: "0.9rem",
                                        fontWeight: selectedSetId === set.id ? 600 : 400
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedSetId !== set.id) e.currentTarget.style.background = "var(--color-surface-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedSetId !== set.id) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {set.color ? (
                                            <div style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: "50%",
                                                background: set.color
                                            }} />
                                        ) : (
                                            <FolderOpen size={16} style={{ color: "var(--color-fg-muted)" }} />
                                        )}
                                        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {set.name}
                                        </span>
                                        <span style={{ color: "var(--color-fg-muted)", fontSize: "0.8rem" }}>
                                            ({set.phrase_count})
                                        </span>
                                    </div>
                                    {selectedSetId === set.id && <Check size={16} />}
                                </button>
                                {onManage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onManage(set.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: "8px",
                                            background: "transparent",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            color: "var(--color-fg-muted)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                        title={t.manage}
                                    >
                                        <Settings size={14} />
                                    </button>
                                )}
                            </div>
                        ))}

                        <div style={{ height: 1, background: "var(--color-border-sub)", margin: "4px 8px" }} />

                        {/* Create New Button */}
                        <button
                            onClick={() => {
                                onCreateNew();
                                setIsOpen(false);
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                background: "transparent",
                                border: "none",
                                textAlign: "left",
                                color: "var(--color-accent)",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: 500
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--color-surface-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <Plus size={16} />
                            <span>{t.create_phrase_set}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
