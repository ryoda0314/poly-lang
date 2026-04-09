"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Plus, MoreHorizontal, ChevronRight } from "lucide-react";

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    keyField: keyof T;
}

export function DataTable<T>({ data, columns, onEdit, onDelete, keyField }: DataTableProps<T>) {
    if (!data || data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: "60px 40px",
                    textAlign: "center",
                    color: "var(--color-fg-muted)",
                    background: "var(--color-surface)",
                    borderRadius: "16px",
                    border: "1px dashed var(--color-border)",
                }}
            >
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "4px" }}>No Data Found</div>
                <div style={{ fontSize: "0.9rem" }}>Start by adding your first entry.</div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)"
            }}
        >
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                    <tr style={{
                        background: "linear-gradient(to bottom, var(--color-bg-sub), var(--color-bg))",
                        textAlign: "left"
                    }}>
                        {columns.map((col, i) => (
                            <th key={i} style={{
                                padding: "16px 20px",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                color: "var(--color-fg-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderBottom: "1px solid var(--color-border)",
                                width: col.width
                            }}>
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th style={{
                                padding: "16px 20px",
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "var(--color-fg-muted)",
                                borderBottom: "1px solid var(--color-border)"
                            }}>
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {data.map((item, index) => (
                            <motion.tr
                                key={String(item[keyField])}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.03 }}
                                style={{
                                    borderBottom: index === data.length - 1 ? "none" : "1px solid var(--color-border)",
                                    cursor: onEdit ? "pointer" : "default"
                                }}
                                onClick={() => onEdit?.(item)}
                                whileHover={{ backgroundColor: "var(--color-bg-sub)" }}
                            >
                                {columns.map((col, i) => (
                                    <td key={i} style={{
                                        padding: "16px 20px",
                                        color: "var(--color-fg)",
                                        fontSize: "0.95rem",
                                        verticalAlign: "middle"
                                    }}>
                                        {typeof col.accessor === "function"
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td style={{
                                        padding: "16px 20px",
                                        textAlign: "right",
                                        whiteSpace: "nowrap"
                                    }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                                            {onEdit && (
                                                <motion.button
                                                    whileHover={{ scale: 1.1, backgroundColor: "var(--color-primary)", color: "white" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                    style={{
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        width: "32px", height: "32px",
                                                        borderRadius: "8px",
                                                        background: "var(--color-bg-sub)",
                                                        border: "none",
                                                        color: "var(--color-fg-muted)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </motion.button>
                                            )}
                                            {onDelete && (
                                                <motion.button
                                                    whileHover={{ scale: 1.1, backgroundColor: "var(--color-destructive, #EF4444)", color: "white" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                                    style={{
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        width: "32px", height: "32px",
                                                        borderRadius: "8px",
                                                        background: "var(--color-bg-sub)",
                                                        border: "none",
                                                        color: "var(--color-fg-muted)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </motion.button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
            </div>
        </motion.div>
    );
}

// Premium Create Button with gradient and animation
export function CreateButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 30px -8px var(--color-primary)" }}
            whileTap={{ scale: 0.98 }}
            style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 20px",
                fontSize: "0.9rem", fontWeight: 600,
                color: "white",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                borderRadius: "12px", border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 20px -4px var(--color-primary)"
            }}
        >
            <Plus size={18} strokeWidth={2.5} />
            {label}
        </motion.button>
    );
}
