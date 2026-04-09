"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Field {
    name: string;
    label: string;
    type: "text" | "number" | "checkbox" | "select" | "textarea";
    options?: { label: string; value: string }[];
    required?: boolean;
    defaultValue?: any;
    placeholder?: string;
}

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    fields: Field[];
    initialData?: any;
    title: string;
    isSubmitting?: boolean;
}

export function EditModal({ isOpen, onClose, onSubmit, fields, initialData, title, isSubmitting }: EditModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
            padding: "var(--space-4)"
        }}>
            <div style={{
                background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-drawer)",
                width: "100%", maxWidth: "500px",
                maxHeight: "90vh", overflowY: "auto",
                border: "1px solid var(--color-border)"
            }}>
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "var(--space-4) var(--space-6)",
                    borderBottom: "1px solid var(--color-border)"
                }}>
                    <h3 style={{ fontSize: "1.2rem", fontFamily: "var(--font-display)", color: "var(--color-fg)", margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{ color: "var(--color-fg-muted)", cursor: "pointer" }}>
                        <X size={20} />
                    </button>
                </div>

                <form action={onSubmit} style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    {/* Hidden ID for updates */}
                    {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
                    {initialData?.level && <input type="hidden" name="level" value={initialData.level} />}

                    {fields.map((field) => (
                        <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-fg)" }}>
                                {field.label} {field.required && <span style={{ color: "var(--color-destructive, red)" }}>*</span>}
                            </label>

                            {field.type === "textarea" ? (
                                <textarea
                                    name={field.name}
                                    defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    style={{
                                        width: "100%",
                                        padding: "var(--space-2) var(--space-3)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-sm)",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontFamily: "var(--font-body)",
                                        fontSize: "0.95rem",
                                        resize: "vertical",
                                        outline: "none",
                                        transition: "border-color 0.2s"
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                                />
                            ) : field.type === "select" ? (
                                <select
                                    name={field.name}
                                    defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                    required={field.required}
                                    style={{
                                        width: "100%",
                                        padding: "var(--space-2) var(--space-3)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-sm)",
                                        background: "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontFamily: "var(--font-body)",
                                        fontSize: "0.95rem",
                                        outline: "none"
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                                >
                                    <option value="">Select option...</option>
                                    {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : field.type === "checkbox" ? (
                                <div style={{ display: "flex", alignItems: "center", marginTop: "var(--space-2)" }}>
                                    <input type="hidden" name={field.name} value="false" />
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        value="true"
                                        defaultChecked={initialData?.[field.name] ?? field.defaultValue ?? true}
                                        style={{
                                            width: "1rem", height: "1rem",
                                            accentColor: "var(--color-accent)",
                                            cursor: "pointer"
                                        }}
                                    />
                                    <span style={{ marginLeft: "var(--space-2)", fontSize: "0.875rem", color: "var(--color-fg-muted)" }}>Enable</span>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    readOnly={field.name === 'level' && !!initialData}
                                    style={{
                                        width: "100%",
                                        padding: "var(--space-2) var(--space-3)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-sm)",
                                        background: field.name === 'level' && !!initialData ? "var(--color-bg-subtle)" : "var(--color-bg)",
                                        color: "var(--color-fg)",
                                        fontFamily: "var(--font-body)",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        transition: "border-color 0.2s"
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                                />
                            )}
                        </div>
                    ))}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "var(--space-2) var(--space-4)",
                                background: "transparent",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "var(--color-fg)",
                                cursor: "pointer",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: "var(--space-2) var(--space-4)",
                                background: "var(--color-accent)",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "white",
                                cursor: "pointer",
                                opacity: isSubmitting ? 0.7 : 1,
                                transition: "opacity 0.2s"
                            }}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
