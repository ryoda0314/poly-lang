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
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react";

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
        <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-fg)", fontFamily: "var(--font-body)" }}>
            {/* Header */}
            <div style={{
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                position: "sticky",
                top: 0,
                zIndex: 10,
                boxShadow: "var(--shadow-sm)"
            }}>
                <div style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "var(--space-4) var(--space-6)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                        <button
                            onClick={() => router.push("/app/dashboard")}
                            style={{
                                display: "flex", alignItems: "center", gap: "var(--space-2)",
                                background: "none", border: "none", padding: "var(--space-1)",
                                color: "var(--color-fg-muted)", cursor: "pointer",
                                transition: "color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-fg)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-fg-muted)"}
                            title="Back to App"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{
                            marginTop: 0,
                            fontSize: "1.5rem",
                            fontFamily: "var(--font-display)",
                            color: "var(--color-fg)",
                            lineHeight: 1.2
                        }}>Dashboard Data Console</h1>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                        <div style={{ fontSize: "0.875rem", color: "var(--color-fg-muted)" }}>Admin Mode</div>
                    </div>
                </div>
                {/* Tabs */}
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 var(--space-6)" }}>
                    <nav style={{ display: "flex", gap: "var(--space-8)", borderBottom: "1px solid transparent" }}>
                        {["levels", "quests", "badges", "events", "tools"].map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    style={{
                                        whiteSpace: "nowrap",
                                        paddingBottom: "var(--space-4)",
                                        borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                                        fontWeight: 600,
                                        fontSize: "0.95rem",
                                        color: isActive ? "var(--color-accent)" : "var(--color-fg-muted)",
                                        fontFamily: "var(--font-body)",
                                        cursor: "pointer",
                                        transition: "color 0.2s"
                                    }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-fg)"; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-fg-muted)"; }}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}>
                {activeTab === "levels" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0 }}>Levels Configuration</h2>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0 }}>Daily Quest Templates</h2>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0 }}>Badges Configuration</h2>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0 }}>Learning Events Viewer</h2>
                            <button onClick={fetchEvents} style={{
                                display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "0.875rem",
                                background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)"
                            }}>
                                <RefreshCw size={14} className={eventsLoading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                        {eventsLoading ? (
                            <div style={{ padding: "var(--space-8)", display: "flex", justifyContent: "center" }}>
                                <Loader2 className="animate-spin" style={{ color: "var(--color-fg-muted)" }} />
                            </div>
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
                        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "center", marginTop: "var(--space-4)" }}>
                            <button
                                onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                                disabled={eventsPage === 1}
                                style={{
                                    padding: "var(--space-1) var(--space-3)", border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-sm)", background: "var(--color-surface)", opacity: eventsPage === 1 ? 0.5 : 1
                                }}
                            >
                                Prev
                            </button>
                            <span style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.9rem" }}>Page {eventsPage}</span>
                            <button
                                onClick={() => setEventsPage(p => p + 1)}
                                style={{
                                    padding: "var(--space-1) var(--space-3)", border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-sm)", background: "var(--color-surface)"
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "tools" && (
                    <div style={{
                        maxWidth: "600px", margin: "0 auto", background: "var(--color-surface)",
                        padding: "var(--space-6)", borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)",
                        display: "flex", flexDirection: "column", gap: "var(--space-6)"
                    }}>
                        <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0 }}>Development Tools</h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <div>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-fg)" }}>Generate Demo Events</h3>
                                <p style={{ fontSize: "0.875rem", color: "var(--color-fg-muted)", marginTop: "var(--space-1)" }}>
                                    Generates random learning events for the past 21 days for a specific user to test charts and streaks.
                                </p>
                            </div>

                            <form action={async (fd) => {
                                setSeedLoading(true);
                                const userId = fd.get('user_id') as string;
                                const lang = fd.get('language') as string;
                                const density = parseInt(fd.get('density') as string);

                                const res = await seedEvents(userId, lang, density);

                                setSeedLoading(false);
                                if (res?.error) showToast(res.error, "error");
                                else showToast(`Generated ${res.count} events`, "success");
                            }} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "var(--space-1)" }}>User ID</label>
                                    <input name="user_id" required placeholder="UUID" style={{
                                        width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)"
                                    }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "var(--space-1)" }}>Language</label>
                                    <input name="language" required placeholder="e.g. en" defaultValue="en" style={{
                                        width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)"
                                    }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "var(--space-1)" }}>Density (1-3)</label>
                                    <select name="density" style={{
                                        width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)"
                                    }}>
                                        <option value="1">Light (Sparse)</option>
                                        <option value="2">Medium</option>
                                        <option value="3">Heavy (Daily)</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={seedLoading}
                                    style={{
                                        width: "100%", padding: "var(--space-2)",
                                        background: "var(--color-accent)", color: "white",
                                        border: "none", borderRadius: "var(--radius-sm)",
                                        fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                                        opacity: seedLoading ? 0.7 : 1
                                    }}
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
                <div style={{
                    position: "fixed", bottom: "1rem", right: "1rem",
                    padding: "var(--space-3) var(--space-6)", borderRadius: "var(--radius-md)",
                    color: "white", fontWeight: 500, boxShadow: "var(--shadow-lg)",
                    background: toast.type === 'success' ? "#10B981" : "#EF4444", // Fallback colors for toast
                    animation: "fade-in-up 0.3s ease-out"
                }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
