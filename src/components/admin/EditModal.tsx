"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";

interface Field {
    name: string;
    label: string;
    type: "text" | "number" | "checkbox" | "select" | "textarea" | "datetime-local";
    options?: { label: string; value: string }[];
    required?: boolean;
    defaultValue?: any;
    placeholder?: string;
    description?: string;
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

    const isEditMode = !!initialData;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed", inset: 0, zIndex: 100,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(8px)",
                        padding: "24px"
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            background: "var(--color-surface)",
                            borderRadius: "20px",
                            boxShadow: "0 25px 80px -20px rgba(0,0,0,0.4)",
                            width: "100%", maxWidth: "520px",
                            maxHeight: "85vh", overflowY: "auto",
                            border: "1px solid var(--color-border)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "24px 28px 20px",
                            borderBottom: "1px solid var(--color-border)",
                            background: "linear-gradient(to bottom, var(--color-bg-sub), transparent)"
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: "1.3rem",
                                    fontFamily: "var(--font-display)",
                                    color: "var(--color-fg)",
                                    margin: 0,
                                    fontWeight: 700
                                }}>
                                    {title}
                                </h3>
                                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                                    {isEditMode ? "Update the details below" : "Fill in the required fields"}
                                </p>
                            </div>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    color: "var(--color-fg-muted)",
                                    cursor: "pointer",
                                    width: "36px", height: "36px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    borderRadius: "10px",
                                    background: "var(--color-bg-sub)",
                                    border: "none"
                                }}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Form */}
                        <form action={onSubmit} style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Hidden ID for updates */}
                            {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
                            {initialData?.level && <input type="hidden" name="level" value={initialData.level} />}
                            {initialData?.event_type && <input type="hidden" name="event_type" value={initialData.event_type} />}

                            {fields.map((field, index) => (
                                <motion.div
                                    key={field.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                                >
                                    <label style={{
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        color: "var(--color-fg)",
                                        display: "flex", alignItems: "center", gap: "6px"
                                    }}>
                                        {field.label}
                                        {field.required && (
                                            <span style={{
                                                color: "var(--color-destructive, #EF4444)",
                                                fontSize: "0.75rem",
                                                background: "rgba(239,68,68,0.1)",
                                                padding: "2px 6px",
                                                borderRadius: "4px"
                                            }}>Required</span>
                                        )}
                                    </label>

                                    {field.type === "textarea" ? (
                                        <textarea
                                            name={field.name}
                                            defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            rows={4}
                                            style={{
                                                width: "100%",
                                                padding: "14px 16px",
                                                border: "2px solid var(--color-border)",
                                                borderRadius: "12px",
                                                background: "var(--color-bg)",
                                                color: "var(--color-fg)",
                                                fontFamily: "var(--font-body)",
                                                fontSize: "0.95rem",
                                                resize: "vertical",
                                                outline: "none",
                                                transition: "all 0.2s"
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "var(--color-primary)";
                                                e.target.style.boxShadow = "0 0 0 4px rgba(var(--color-primary-rgb, 59,130,246), 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "var(--color-border)";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        />
                                    ) : field.type === "select" ? (
                                        <select
                                            name={field.name}
                                            defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                            required={field.required}
                                            style={{
                                                width: "100%",
                                                padding: "14px 16px",
                                                border: "2px solid var(--color-border)",
                                                borderRadius: "12px",
                                                background: "var(--color-bg)",
                                                color: "var(--color-fg)",
                                                fontFamily: "var(--font-body)",
                                                fontSize: "0.95rem",
                                                outline: "none",
                                                cursor: "pointer"
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "var(--color-primary)";
                                                e.target.style.boxShadow = "0 0 0 4px rgba(var(--color-primary-rgb, 59,130,246), 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "var(--color-border)";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        >
                                            <option value="">Select option...</option>
                                            {field.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : field.type === "checkbox" ? (
                                        <label style={{
                                            display: "flex", alignItems: "center", gap: "12px",
                                            padding: "12px 16px",
                                            background: "var(--color-bg)",
                                            borderRadius: "12px",
                                            border: "2px solid var(--color-border)",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}>
                                            <input
                                                type="checkbox"
                                                name={field.name}
                                                value="true"
                                                defaultChecked={initialData?.[field.name] ?? field.defaultValue ?? true}
                                                style={{
                                                    width: "20px", height: "20px",
                                                    accentColor: "var(--color-primary)",
                                                    cursor: "pointer"
                                                }}
                                            />
                                            <span style={{ fontSize: "0.95rem", color: "var(--color-fg)" }}>
                                                Enable this option
                                            </span>
                                        </label>
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
                                                padding: "14px 16px",
                                                border: "2px solid var(--color-border)",
                                                borderRadius: "12px",
                                                background: field.name === 'level' && !!initialData ? "var(--color-bg-subtle)" : "var(--color-bg)",
                                                color: "var(--color-fg)",
                                                fontFamily: "var(--font-body)",
                                                fontSize: "0.95rem",
                                                outline: "none",
                                                transition: "all 0.2s"
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "var(--color-primary)";
                                                e.target.style.boxShadow = "0 0 0 4px rgba(var(--color-primary-rgb, 59,130,246), 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "var(--color-border)";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        />
                                    )}
                                </motion.div>
                            ))}

                            {/* Action Buttons */}
                            <div style={{
                                display: "flex", justifyContent: "flex-end", gap: "12px",
                                marginTop: "12px", paddingTop: "20px",
                                borderTop: "1px solid var(--color-border)"
                            }}>
                                <motion.button
                                    type="button"
                                    onClick={onClose}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: "12px 24px",
                                        background: "transparent",
                                        border: "2px solid var(--color-border)",
                                        borderRadius: "10px",
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        color: "var(--color-fg)",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px -8px rgba(99,102,241,0.5)" }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: "12px 28px",
                                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        border: "none",
                                        borderRadius: "10px",
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        color: "white",
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.7 : 1,
                                        display: "flex", alignItems: "center", gap: "8px",
                                        boxShadow: "0 4px 20px -4px rgba(99,102,241,0.4)"
                                    }}
                                >
                                    <Save size={16} />
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
