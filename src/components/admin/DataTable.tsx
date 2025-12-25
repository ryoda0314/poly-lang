"use client";

import React, { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";

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
            <div style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-fg-muted)",
                background: "var(--color-bg)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontStyle: "italic"
            }}>
                No data found.
            </div>
        );
    }

    return (
        <div style={{
            overflowX: "auto",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            background: "var(--color-surface)"
        }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                    <tr style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        textAlign: "left"
                    }}>
                        {columns.map((col, i) => (
                            <th key={i} style={{
                                padding: "var(--space-3) var(--space-4)",
                                fontWeight: 600,
                                color: "var(--color-fg)",
                                fontFamily: "var(--font-display)",
                                width: col.width
                            }}>
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th style={{
                                padding: "var(--space-3) var(--space-4)",
                                textAlign: "right",
                                fontWeight: 600,
                                fontFamily: "var(--font-display)",
                                color: "var(--color-fg)"
                            }}>
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={String(item[keyField])} style={{
                            borderBottom: index === data.length - 1 ? "none" : "1px solid var(--color-border)",
                            transition: "background-color 0.2s"
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            {columns.map((col, i) => (
                                <td key={i} style={{
                                    padding: "var(--space-3) var(--space-4)",
                                    color: "var(--color-fg)",
                                    verticalAlign: "middle"
                                }}>
                                    {typeof col.accessor === "function"
                                        ? col.accessor(item)
                                        : (item[col.accessor] as React.ReactNode)}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td style={{
                                    padding: "var(--space-3) var(--space-4)",
                                    textAlign: "right",
                                    whiteSpace: "nowrap"
                                }}>
                                    <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(item)}
                                                style={{
                                                    color: "var(--color-fg-muted)",
                                                    padding: "4px",
                                                    cursor: "pointer",
                                                    transition: "color 0.2s"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-accent)"}
                                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-fg-muted)"}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(item)}
                                                style={{
                                                    color: "var(--color-fg-muted)",
                                                    padding: "4px",
                                                    cursor: "pointer",
                                                    transition: "color 0.2s"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-destructive)"} // Assuming destructive color exists or fallback
                                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-fg-muted)"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Simple Button for Create
export function CreateButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                fontSize: "0.875rem", fontWeight: 500,
                color: "white", background: "var(--color-accent)",
                borderRadius: "var(--radius-sm)", border: "none",
                cursor: "pointer", transition: "opacity 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
            <Plus size={16} />
            {label}
        </button>
    );
}
