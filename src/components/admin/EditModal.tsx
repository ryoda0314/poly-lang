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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form action={onSubmit} className="p-6 space-y-4">
                    {/* Hidden ID for updates */}
                    {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
                    {initialData?.level && <input type="hidden" name="level" value={initialData.level} />}

                    {fields.map((field) => (
                        <div key={field.name} className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>

                            {field.type === "textarea" ? (
                                <textarea
                                    name={field.name}
                                    defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : field.type === "select" ? (
                                <select
                                    name={field.name}
                                    defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                    required={field.required}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select option...</option>
                                    {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : field.type === "checkbox" ? (
                                <div className="flex items-center mt-2">
                                    <input type="hidden" name={field.name} value="false" />
                                    {/* Hack to handle unchecked checkbox? Better to control with state or simplify */}
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        value="true"
                                        defaultChecked={initialData?.[field.name] ?? field.defaultValue ?? true}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-500">Enable</span>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    defaultValue={initialData?.[field.name] ?? field.defaultValue}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    readOnly={field.name === 'level' && !!initialData} // Lock PK if editing level
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
