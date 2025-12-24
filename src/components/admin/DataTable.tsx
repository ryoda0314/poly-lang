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
        return <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">No data found.</div>;
    }

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className="px-6 py-3 font-medium text-gray-900" style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && <th className="px-6 py-3 text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                        <tr key={String(item[keyField])} className="hover:bg-gray-50">
                            {columns.map((col, i) => (
                                <td key={i} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                                    {typeof col.accessor === "function"
                                        ? col.accessor(item)
                                        : (item[col.accessor] as React.ReactNode)}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td className="px-6 py-4 text-right space-x-2">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-1 text-blue-600 hover:text-blue-800 transition"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(item)}
                                            className="p-1 text-red-600 hover:text-red-800 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
        >
            <Plus size={16} />
            {label}
        </button>
    );
}
