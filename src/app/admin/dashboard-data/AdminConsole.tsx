"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createLevel, updateLevel, deleteLevel,
    createQuest, updateQuest, deleteQuest,
    createBadge, updateBadge, deleteBadge,
    getEvents, seedEvents
} from "./actions";
import { DataTable, CreateButton } from "@/components/admin/DataTable";
import { EditModal } from "@/components/admin/EditModal";
import { Loader2, RefreshCw } from "lucide-react";

// Types matching DB tables
type Level = { level: number; xp_threshold: number; title: string; next_unlock_label: string };
type Quest = { id: string; quest_key: string; title: string; required_count: number; event_type: string; language_code: string | null; level_min: number | null; level_max: number | null; is_active: boolean };
type Badge = { id: string; badge_key: string; title: string; description: string; icon: string | null; is_active: boolean };
type LearningEvent = { id: string; user_id: string; event_type: string; language_code: string; xp_delta: number; occurred_at: string; meta: any };

interface AdminConsoleProps {
    levels: Level[];
    quests: Quest[];
    badges: Badge[];
}

export default function AdminConsole({ levels, quests, badges }: AdminConsoleProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"levels" | "quests" | "badges" | "events" | "tools">("levels");
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingItem, setEditingItem] = useState<any>(null); // Weak type for simplicity

    // Events State
    const [events, setEvents] = useState<LearningEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsPage, setEventsPage] = useState(1);

    // Seed State
    const [seedLoading, setSeedLoading] = useState(false);

    // Toast Timer
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
    };

    // --- Helpers ---

    const handleAction = async (actionFn: (formData: FormData) => Promise<any>, formData: FormData) => {
        setIsModalOpen(false);
        startTransition(async () => {
            const res = await actionFn(formData);
            if (res?.error) {
                showToast(res.error, "error");
            } else {
                showToast("Success", "success");
                router.refresh();
            }
        });
    };

    const handleDelete = async (actionFn: (id: any) => Promise<any>, id: any) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        startTransition(async () => {
            const res = await actionFn(id);
            if (res?.error) {
                showToast(res.error, "error");
            } else {
                showToast("Deleted successfully", "success");
                router.refresh();
            }
        });
    };

    // --- Events Data ---
    const fetchEvents = async () => {
        setEventsLoading(true);
        try {
            const res = await getEvents(eventsPage);
            if (res.data) setEvents(res.data);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "events") {
            fetchEvents();
        }
    }, [activeTab, eventsPage]);

    // --- Render Logic ---

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Dashboard Data Console</h1>
                    <div className="flex gap-2">
                        {/* Lang selector placeholder if needed */}
                        <div className="text-sm text-gray-500">Admin Mode</div>
                    </div>
                </div>
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="-mb-px flex space-x-8">
                        {["levels", "quests", "badges", "events", "tools"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`
                                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                                    ${activeTab === tab
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
                                `}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "levels" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium">Levels Configuration</h2>
                            <CreateButton
                                label="Add Level"
                                onClick={() => { setModalMode("create"); setEditingItem(null); setIsModalOpen(true); }}
                            />
                        </div>
                        <DataTable
                            data={levels}
                            keyField="level"
                            columns={[
                                { header: "Lvl", accessor: "level", width: "80px" },
                                { header: "XP Threshold", accessor: "xp_threshold" },
                                { header: "Title", accessor: "title" },
                                { header: "Next Unlock", accessor: "next_unlock_label" },
                            ]}
                            onEdit={(item) => { setModalMode("edit"); setEditingItem(item); setIsModalOpen(true); }}
                            onDelete={(item) => handleDelete(deleteLevel, item.level)}
                        />
                        <EditModal
                            isOpen={isModalOpen && activeTab === 'levels'}
                            onClose={() => setIsModalOpen(false)}
                            onSubmit={(fd) => handleAction(modalMode === 'create' ? createLevel : updateLevel, fd)}
                            title={`${modalMode === 'create' ? 'Create' : 'Edit'} Level`}
                            initialData={editingItem}
                            isSubmitting={isPending}
                            fields={[
                                { name: "level", label: "Level (ID)", type: "number", required: true },
                                { name: "xp_threshold", label: "XP Threshold", type: "number", required: true },
                                { name: "title", label: "Title", type: "text", required: true },
                                { name: "next_unlock_label", label: "Next Unlock Label", type: "text", required: true },
                            ]}
                        />
                    </div>
                )}

                {activeTab === "quests" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium">Daily Quest Templates</h2>
                            <CreateButton
                                label="Add Quest"
                                onClick={() => { setModalMode("create"); setEditingItem(null); setIsModalOpen(true); }}
                            />
                        </div>
                        <DataTable
                            data={quests}
                            keyField="id"
                            columns={[
                                { header: "Key", accessor: "quest_key" },
                                { header: "Title", accessor: "title" },
                                { header: "Type", accessor: "event_type" },
                                { header: "Count", accessor: "required_count" },
                                { header: "Active", accessor: (item) => item.is_active ? "Yes" : "No" },
                            ]}
                            onEdit={(item) => { setModalMode("edit"); setEditingItem(item); setIsModalOpen(true); }}
                            onDelete={(item) => handleDelete(deleteQuest, item.id)}
                        />
                        <EditModal
                            isOpen={isModalOpen && activeTab === 'quests'}
                            onClose={() => setIsModalOpen(false)}
                            onSubmit={(fd) => handleAction(modalMode === 'create' ? createQuest : updateQuest, fd)}
                            title={`${modalMode === 'create' ? 'Create' : 'Edit'} Quest`}
                            initialData={editingItem}
                            isSubmitting={isPending}
                            fields={[
                                { name: "quest_key", label: "Unique Key", type: "text", required: true },
                                { name: "title", label: "Title", type: "text", required: true },
                                { name: "event_type", label: "Event Type", type: "text", required: true, placeholder: "e.g. phrase_viewed" },
                                { name: "required_count", label: "Required Count", type: "number", defaultValue: 1, required: true },
                                { name: "language_code", label: "Language (Optional)", type: "text", placeholder: "e.g. en (leave empty for all)" },
                                { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
                            ]}
                        />
                    </div>
                )}

                {activeTab === "badges" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium">Badges Configuration</h2>
                            <CreateButton
                                label="Add Badge"
                                onClick={() => { setModalMode("create"); setEditingItem(null); setIsModalOpen(true); }}
                            />
                        </div>
                        <DataTable
                            data={badges}
                            keyField="id"
                            columns={[
                                { header: "Key", accessor: "badge_key" },
                                { header: "Title", accessor: "title" },
                                { header: "Desc", accessor: "description" },
                                { header: "Active", accessor: (item) => item.is_active ? "Yes" : "No" },
                            ]}
                            onEdit={(item) => { setModalMode("edit"); setEditingItem(item); setIsModalOpen(true); }}
                            onDelete={(item) => handleDelete(deleteBadge, item.id)}
                        />
                        <EditModal
                            isOpen={isModalOpen && activeTab === 'badges'}
                            onClose={() => setIsModalOpen(false)}
                            onSubmit={(fd) => handleAction(modalMode === 'create' ? createBadge : updateBadge, fd)}
                            title={`${modalMode === 'create' ? 'Create' : 'Edit'} Badge`}
                            initialData={editingItem}
                            isSubmitting={isPending}
                            fields={[
                                { name: "badge_key", label: "Unique Key", type: "text", required: true },
                                { name: "title", label: "Title", type: "text", required: true },
                                { name: "description", label: "Description", type: "textarea", required: true },
                                { name: "icon", label: "Icon Name (Lucide)", type: "text" },
                                { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
                            ]}
                        />
                    </div>
                )}

                {activeTab === "events" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium">Learning Events Viewer</h2>
                            <button onClick={fetchEvents} className="flex items-center gap-1 text-sm text-blue-600">
                                <RefreshCw size={14} className={eventsLoading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                        {eventsLoading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : (
                            <DataTable
                                data={events}
                                keyField="id"
                                columns={[
                                    { header: "Time", accessor: (item) => new Date(item.occurred_at).toLocaleString() },
                                    { header: "User ID", accessor: (item) => item.user_id.substring(0, 8) + '...' },
                                    { header: "Type", accessor: "event_type" },
                                    { header: "Params", accessor: (item) => JSON.stringify(item.meta) },
                                    { header: "XP", accessor: "xp_delta" },
                                ]}
                            />
                        )}
                        <div className="flex gap-2 justify-center mt-4">
                            <button
                                onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                                disabled={eventsPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-2 py-1">Page {eventsPage}</span>
                            <button
                                onClick={() => setEventsPage(p => p + 1)}
                                className="px-3 py-1 border rounded"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "tools" && (
                    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-sm border space-y-6">
                        <h2 className="text-lg font-bold">Development Tools</h2>

                        <div className="space-y-4">
                            <h3 className="text-md font-medium text-gray-800">Generate Demo Events</h3>
                            <p className="text-sm text-gray-500">
                                Generates random learning events for the past 21 days for a specific user to test charts and streaks.
                            </p>

                            <form action={async (fd) => {
                                setSeedLoading(true);
                                const userId = fd.get('user_id') as string;
                                const lang = fd.get('language') as string;
                                const density = parseInt(fd.get('density') as string);

                                const res = await seedEvents(userId, lang, density);

                                setSeedLoading(false);
                                if (res?.error) showToast(res.error, "error");
                                else showToast(`Generated ${res.count} events`, "success");
                            }} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium">User ID</label>
                                    <input name="user_id" required placeholder="UUID" className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Language</label>
                                    <input name="language" required placeholder="e.g. en" defaultValue="en" className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Density (1-3)</label>
                                    <select name="density" className="w-full border rounded px-3 py-2">
                                        <option value="1">Light (Sparse)</option>
                                        <option value="2">Medium</option>
                                        <option value="3">Heavy (Daily)</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={seedLoading}
                                    className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {seedLoading ? "Generating..." : "Generate Events"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg text-white font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fade-in-up`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
