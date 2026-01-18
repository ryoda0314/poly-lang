"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    createLevel, updateLevel, deleteLevel,
    createQuest, updateQuest, deleteQuest,
    createBadge, updateBadge, deleteBadge,
    getEvents, seedEvents, getEventStats,
    getUsers, getUserStats,
    getXpSettings, updateXpSetting
} from "./actions";
import { DataTable, CreateButton } from "@/components/admin/DataTable";
import { EditModal } from "@/components/admin/EditModal";
import { Loader2, RefreshCw, ArrowLeft, Plus, Search, Zap } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

// Types matching DB tables
type Level = { level: number; xp_threshold: number; title: string; next_unlock_label: string };
type Quest = { id: string; quest_key: string; title: string; required_count: number; event_type: string; language_code: string | null; level_min: number | null; level_max: number | null; is_active: boolean };
type Badge = { id: string; badge_key: string; title: string; description: string; icon: string | null; is_active: boolean };
type LearningEvent = { id: string; user_id: string; event_type: string; language_code: string; xp_delta: number; occurred_at: string; meta: any };
type XpSetting = { event_type: string; xp_value: number; label_ja: string | null; description: string | null; is_active: boolean };

interface AdminConsoleProps {
    levels: Level[];
    quests: Quest[];
    badges: Badge[];
}

export default function AdminConsole({ levels, quests, badges }: AdminConsoleProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"users" | "levels" | "quests" | "badges" | "events" | "xp_settings" | "tools">("users");
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
    const [eventsFilter, setEventsFilter] = useState<string>("");
    const [stats, setStats] = useState<Record<string, number>>({});

    // Seed State
    const [seedLoading, setSeedLoading] = useState(false);

    // Users State
    const [users, setUsers] = useState<any[]>([]); // Weak type for simplicity
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersPage, setUsersPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userStats, setUserStats] = useState<Record<string, number>>({});
    const [userStatsLoading, setUserStatsLoading] = useState(false);

    // XP Settings State
    const [xpSettings, setXpSettings] = useState<XpSetting[]>([]);
    const [xpSettingsLoading, setXpSettingsLoading] = useState(false);

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
            const res = await getEvents(eventsPage, 50, eventsFilter);
            if (res.data) setEvents(res.data);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchStats = async () => {
        const res = await getEventStats();
        if (res.stats) setStats(res.stats);
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await getUsers(usersPage);
            if (res.data) setUsers(res.data);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchUserDetail = async (user: any) => {
        setSelectedUser(user);
        setUserStatsLoading(true);
        setUserStats({});
        try {
            const res = await getUserStats(user.id);
            if (res.stats) setUserStats(res.stats);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setUserStatsLoading(false);
        }
    };

    const fetchXpSettings = async () => {
        setXpSettingsLoading(true);
        try {
            const data = await getXpSettings();
            setXpSettings(data || []);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setXpSettingsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "events") {
            fetchEvents();
            fetchStats();
        } else if (activeTab === "users") {
            fetchUsers();
        } else if (activeTab === "xp_settings") {
            fetchXpSettings();
        }
    }, [activeTab, eventsPage, eventsFilter, usersPage]);

    // --- Render Logic ---

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            background: "var(--color-bg)",
            color: "var(--color-fg)",
            fontFamily: "var(--font-body)",
            overflow: "hidden" // Prevent body scroll, let panels scroll
        }}>
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab as any} />

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                height: "100vh",
                overflowY: "auto",
                position: "relative",
                background: "var(--color-bg-sub)" // Slightly different bg for contrast
            }}>
                {/* Dynamic Header based on active Tab */}
                <header style={{
                    padding: "32px 48px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end"
                }}>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: "2rem",
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            background: "linear-gradient(to right, var(--color-fg), var(--color-fg-muted))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textTransform: "capitalize"
                        }}>
                            {activeTab} Management
                        </h1>
                        <p style={{ margin: "8px 0 0", color: "var(--color-fg-muted)", fontSize: "0.95rem" }}>
                            Manage your application's {activeTab} data and configurations.
                        </p>
                    </div>

                    {/* Global Actions? Maybe per page is better */}
                </header>

                <div style={{ padding: "12px 48px 100px" }}>
                    {activeTab === "users" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700 }}>Registered Users</h2>
                                    <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                                        {users.length} users loaded
                                    </p>
                                </div>
                                <motion.button
                                    onClick={fetchUsers}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem",
                                        background: "var(--color-surface)", border: "1px solid var(--color-border)",
                                        borderRadius: "10px", padding: "10px 16px",
                                        cursor: "pointer", color: "var(--color-fg)", fontWeight: 500
                                    }}
                                >
                                    <RefreshCw size={14} className={usersLoading ? "animate-spin" : ""} /> Refresh
                                </motion.button>
                            </div>
                            {usersLoading ? (
                                <div style={{ padding: "60px", display: "flex", justifyContent: "center" }}>
                                    <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-fg-muted)" }} />
                                </div>
                            ) : (
                                <DataTable
                                    data={users}
                                    keyField="id"
                                    columns={[
                                        {
                                            header: "User",
                                            accessor: (item) => (
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{
                                                        width: "40px", height: "40px",
                                                        borderRadius: "50%",
                                                        background: `linear-gradient(135deg, hsl(${item.id.charCodeAt(0) * 10}, 70%, 60%), hsl(${item.id.charCodeAt(1) * 10}, 70%, 50%))`,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        color: "white", fontWeight: 700, fontSize: "1rem"
                                                    }}>
                                                        {(item.username || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "var(--color-fg)" }}>{item.username || "Unknown"}</div>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)", fontFamily: "monospace" }}>{item.id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            )
                                        },
                                        { header: "Native", accessor: (item) => <span style={{ background: "var(--color-bg-sub)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 500 }}>{item.native_language || "—"}</span> },
                                        { header: "Learning", accessor: (item) => <span style={{ background: "var(--color-primary)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 500 }}>{item.learning_language || "—"}</span> },
                                        { header: "Joined", accessor: (item) => new Date(item.created_at).toLocaleDateString() },
                                        {
                                            header: "Actions",
                                            accessor: (item) => (
                                                <button
                                                    onClick={() => fetchUserDetail(item)}
                                                    style={{
                                                        padding: "8px 16px",
                                                        background: "#3B82F6",
                                                        color: "#FFFFFF",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontSize: "0.85rem",
                                                        fontWeight: 600,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    詳細
                                                </button>
                                            )
                                        },
                                    ]}
                                />
                            )}
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                                <motion.button
                                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                    disabled={usersPage === 1}
                                    whileHover={{ scale: usersPage === 1 ? 1 : 1.05 }}
                                    whileTap={{ scale: usersPage === 1 ? 1 : 0.95 }}
                                    style={{
                                        padding: "10px 20px", border: "1px solid var(--color-border)",
                                        borderRadius: "10px", background: "var(--color-surface)",
                                        opacity: usersPage === 1 ? 0.5 : 1, cursor: usersPage === 1 ? "not-allowed" : "pointer",
                                        fontWeight: 500
                                    }}
                                >
                                    ← Previous
                                </motion.button>
                                <span style={{ padding: "10px 16px", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Page {usersPage}</span>
                                <motion.button
                                    onClick={() => setUsersPage(p => p + 1)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: "10px 20px", border: "1px solid var(--color-border)",
                                        borderRadius: "10px", background: "var(--color-surface)",
                                        cursor: "pointer", fontWeight: 500
                                    }}
                                >
                                    Next →
                                </motion.button>
                            </div>

                            {/* User Detail Modal */}
                            {selectedUser && (
                                <div
                                    style={{
                                        position: "fixed", inset: 0, zIndex: 100,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        background: "rgba(0,0,0,0.4)"
                                    }}
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <div
                                        style={{
                                            background: "#fff",
                                            width: "92%",
                                            maxWidth: "560px",
                                            maxHeight: "85vh",
                                            borderRadius: "16px",
                                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                                            overflowY: "auto"
                                        }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* Header with avatar */}
                                        <div style={{
                                            padding: "24px",
                                            borderBottom: "1px solid #e5e5e5",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px"
                                        }}>
                                            <div style={{
                                                width: "56px", height: "56px",
                                                borderRadius: "50%",
                                                background: "#6366f1",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff", fontSize: "1.4rem", fontWeight: 700
                                            }}>
                                                {(selectedUser.username || "?")[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#1a1a1a" }}>
                                                    {selectedUser.username || "ユーザー"}
                                                </h3>
                                                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#666" }}>
                                                    {selectedUser.id.substring(0, 16)}...
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedUser(null)}
                                                style={{
                                                    width: "36px", height: "36px",
                                                    borderRadius: "8px",
                                                    background: "#f3f4f6",
                                                    border: "none",
                                                    fontSize: "1.2rem",
                                                    color: "#666",
                                                    cursor: "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center"
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        {/* User Info Cards */}
                                        <div style={{
                                            padding: "20px 24px",
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            gap: "12px",
                                            borderBottom: "1px solid #e5e5e5"
                                        }}>
                                            <div style={{ background: "#f8f9fa", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                                                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "4px" }}>母語</div>
                                                <div style={{ fontSize: "1rem", fontWeight: 600, color: "#333" }}>{selectedUser.native_language || "—"}</div>
                                            </div>
                                            <div style={{ background: "#f8f9fa", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                                                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "4px" }}>学習中</div>
                                                <div style={{ fontSize: "1rem", fontWeight: 600, color: "#333" }}>{selectedUser.learning_language || "—"}</div>
                                            </div>
                                            <div style={{ background: "#f8f9fa", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                                                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "4px" }}>登録日</div>
                                                <div style={{ fontSize: "1rem", fontWeight: 600, color: "#333" }}>{new Date(selectedUser.created_at).toLocaleDateString("ja-JP")}</div>
                                            </div>
                                        </div>

                                        {/* Activity Stats */}
                                        <div style={{ padding: "20px 24px" }}>
                                            <h4 style={{
                                                margin: "0 0 16px",
                                                fontSize: "0.95rem",
                                                fontWeight: 600,
                                                color: "#333",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}>
                                                <span style={{ width: "3px", height: "16px", background: "#6366f1", borderRadius: "2px" }}></span>
                                                アクティビティ
                                            </h4>

                                            {userStatsLoading ? (
                                                <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                                                    読み込み中...
                                                </div>
                                            ) : Object.keys(userStats).length === 0 ? (
                                                <div style={{
                                                    textAlign: "center",
                                                    padding: "40px",
                                                    color: "#888",
                                                    background: "#f8f9fa",
                                                    borderRadius: "10px"
                                                }}>
                                                    まだアクティビティがありません
                                                </div>
                                            ) : (
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                    {Object.entries(userStats)
                                                        .map(([key, count]) => (
                                                            <div
                                                                key={key}
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    padding: "12px 16px",
                                                                    background: count > 0 ? "#f0f4ff" : "#f8f9fa",
                                                                    borderRadius: "8px",
                                                                    borderLeft: count > 0 ? "3px solid #6366f1" : "3px solid transparent"
                                                                }}
                                                            >
                                                                <span style={{ fontSize: "0.9rem", color: "#444", textTransform: "capitalize" }}>
                                                                    {key.replace(/_/g, " ")}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: "1.1rem",
                                                                    fontWeight: 700,
                                                                    color: count > 0 ? "#6366f1" : "#bbb"
                                                                }}>
                                                                    {count}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Close Button */}
                                        <div style={{ padding: "0 24px 24px" }}>
                                            <button
                                                onClick={() => setSelectedUser(null)}
                                                style={{
                                                    width: "100%",
                                                    padding: "14px",
                                                    background: "#6366f1",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "10px",
                                                    fontSize: "0.95rem",
                                                    fontWeight: 600,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                閉じる
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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

                            {/* Stats Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
                                {[
                                    { key: 'saved_phrase', label: '保存したフレーズ', color: '#6366f1' },
                                    { key: 'correction_request', label: '校正リクエスト', color: '#8b5cf6' },
                                    { key: 'audio_play', label: '音声再生', color: '#06b6d4' },
                                    { key: 'text_copy', label: 'テキストコピー', color: '#10b981' },
                                    { key: 'word_explore', label: '単語探索', color: '#f59e0b' },
                                    { key: 'explanation_request', label: '説明リクエスト', color: '#ec4899' },
                                    { key: 'memo_created', label: 'メモ作成', color: '#14b8a6' },
                                    { key: 'memo_verified', label: 'メモ検証', color: '#22c55e' },
                                    { key: 'category_select', label: 'カテゴリ選択', color: '#64748b' },
                                    { key: 'tutorial_complete', label: 'チュートリアル', color: '#a855f7' }
                                ].map(({ key, label, color }) => {
                                    const isActive = key === eventsFilter;
                                    const count = stats[key] || 0;
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => {
                                                setEventsFilter(isActive ? "" : key);
                                                setEventsPage(1);
                                            }}
                                            style={{
                                                background: isActive ? `${color}10` : "#fff",
                                                border: `1px solid ${isActive ? color : "#e5e7eb"}`,
                                                borderRadius: "12px",
                                                padding: "16px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <div style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                background: color,
                                                borderRadius: "12px 0 0 12px"
                                            }} />
                                            <div style={{
                                                fontSize: "0.8rem",
                                                color: "#6b7280",
                                                fontWeight: 500,
                                                marginBottom: "4px"
                                            }}>
                                                {label}
                                            </div>
                                            <div style={{
                                                fontSize: "1.75rem",
                                                fontWeight: 700,
                                                color: count > 0 ? color : "#9ca3af"
                                            }}>
                                                {count}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0 }}>Learning Events Viewer</h2>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <select
                                        value={eventsFilter}
                                        onChange={(e) => { setEventsFilter(e.target.value); setEventsPage(1); }}
                                        style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--color-border)" }}
                                    >
                                        <option value="">All Types</option>
                                        <option value="saved_phrase">Saved Phrase</option>
                                        <option value="correction_request">Correction</option>
                                        <option value="audio_play">Audio Play</option>
                                        <option value="text_copy">Copy</option>
                                        <option value="word_explore">Word Explore</option>
                                        <option value="explanation_request">Explanation</option>
                                        <option value="memo_created">Memo Created</option>
                                        <option value="memo_verified">Memo Verified</option>
                                        <option value="category_select">Category</option>
                                        <option value="tutorial_complete">Tutorial</option>
                                    </select>
                                    <button onClick={() => { fetchEvents(); fetchStats(); }} style={{
                                        display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "0.875rem",
                                        background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)"
                                    }}>
                                        <RefreshCw size={14} className={eventsLoading ? "animate-spin" : ""} /> Refresh
                                    </button>
                                </div>
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
                                        { header: "Params", accessor: (item) => <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(item.meta)}>{JSON.stringify(item.meta)}</div> },
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

                    {activeTab === "xp_settings" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700 }}>
                                        経験値設定
                                    </h2>
                                    <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                                        各アクションで付与される経験値を設定します
                                    </p>
                                </div>
                                <button
                                    onClick={fetchXpSettings}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem",
                                        background: "var(--color-surface)", border: "1px solid var(--color-border)",
                                        borderRadius: "10px", padding: "10px 16px",
                                        cursor: "pointer", color: "var(--color-fg)", fontWeight: 500
                                    }}
                                >
                                    <RefreshCw size={14} className={xpSettingsLoading ? "animate-spin" : ""} /> 更新
                                </button>
                            </div>

                            {xpSettingsLoading ? (
                                <div style={{ padding: "60px", display: "flex", justifyContent: "center" }}>
                                    <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-fg-muted)" }} />
                                </div>
                            ) : (
                                <div style={{
                                    background: "var(--color-surface)",
                                    borderRadius: "12px",
                                    border: "1px solid var(--color-border)",
                                    overflow: "hidden"
                                }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--color-bg-sub)" }}>
                                                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>イベントタイプ</th>
                                                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>日本語ラベル</th>
                                                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>説明</th>
                                                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)", width: "100px" }}>XP</th>
                                                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)", width: "80px" }}>有効</th>
                                                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)", width: "100px" }}>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {xpSettings.map((setting, index) => (
                                                <tr
                                                    key={setting.event_type}
                                                    style={{
                                                        borderTop: "1px solid var(--color-border)",
                                                        background: index % 2 === 0 ? "transparent" : "var(--color-bg-sub)"
                                                    }}
                                                >
                                                    <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 500 }}>
                                                        <code style={{
                                                            background: "var(--color-bg-sub)",
                                                            padding: "2px 6px",
                                                            borderRadius: "4px",
                                                            fontSize: "0.85rem"
                                                        }}>
                                                            {setting.event_type}
                                                        </code>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{setting.label_ja || "-"}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>{setting.description || "-"}</td>
                                                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                        <span style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            background: setting.xp_value > 0 ? "#22c55e20" : "#f3f4f6",
                                                            color: setting.xp_value > 0 ? "#16a34a" : "#9ca3af",
                                                            padding: "4px 10px",
                                                            borderRadius: "999px",
                                                            fontWeight: 600,
                                                            fontSize: "0.9rem"
                                                        }}>
                                                            <Zap size={14} />
                                                            {setting.xp_value}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                        <span style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "4px",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 500,
                                                            background: setting.is_active ? "#22c55e20" : "#ef444420",
                                                            color: setting.is_active ? "#16a34a" : "#dc2626"
                                                        }}>
                                                            {setting.is_active ? "有効" : "無効"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                        <button
                                                            onClick={() => {
                                                                setModalMode("edit");
                                                                setEditingItem(setting);
                                                                setIsModalOpen(true);
                                                            }}
                                                            style={{
                                                                padding: "8px 16px",
                                                                fontSize: "0.85rem",
                                                                background: "#6366f1",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius: "8px",
                                                                cursor: "pointer",
                                                                fontWeight: 600,
                                                                boxShadow: "0 2px 4px rgba(99,102,241,0.3)"
                                                            }}
                                                        >
                                                            編集
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <EditModal
                                isOpen={isModalOpen && activeTab === 'xp_settings'}
                                onClose={() => setIsModalOpen(false)}
                                onSubmit={async (fd) => {
                                    const res = await updateXpSetting(fd);
                                    if (res?.error) {
                                        showToast(res.error, "error");
                                    } else {
                                        showToast("XP設定を更新しました", "success");
                                        setIsModalOpen(false);
                                        fetchXpSettings();
                                    }
                                }}
                                title="XP設定を編集"
                                initialData={editingItem}
                                isSubmitting={isPending}
                                fields={[
                                    { name: "event_type", label: "イベントタイプ", type: "text", required: true },
                                    { name: "xp_value", label: "経験値 (XP)", type: "number", required: true },
                                    { name: "label_ja", label: "日本語ラベル", type: "text" },
                                    { name: "description", label: "説明", type: "text" },
                                    { name: "is_active", label: "有効", type: "checkbox", defaultValue: true },
                                ]}
                            />
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
                </div>
            </main>

            {/* Toast */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    style={{
                        position: "fixed", bottom: "32px", right: "32px",
                        padding: "16px 24px", borderRadius: "12px",
                        color: "white", fontWeight: 600,
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)",
                        background: toast.type === 'success' ? "var(--color-success, #10B981)" : "var(--color-destructive, #EF4444)",
                        zIndex: 1000,
                        display: "flex", alignItems: "center", gap: "10px"
                    }}
                >
                    {toast.type === 'success' ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} /> : null}
                    {toast.msg}
                </motion.div>
            )}
        </div>
    );
}
