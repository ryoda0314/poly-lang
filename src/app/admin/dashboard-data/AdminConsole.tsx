"use client";

import React, { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    createLevel, updateLevel, deleteLevel,
    createQuest, updateQuest, deleteQuest,
    createBadge, updateBadge, deleteBadge,
    getEvents, seedEvents, getEventStats,
    getUsers, getUserStats,
    updateUserCoins,
    getUserCredits, updateUserCreditBalance,
    getXpSettings, updateXpSetting, getUserProgress, recalculateAllUserProgress, seedXpSettings, getUserActivityDetail,
    getDistributionEvents, createDistributionEvent, updateDistributionEvent,
    cancelDistributionEvent, publishDistributionEvent,
    type DistributionEvent, type RewardEntry
} from "./actions";
import {
    getTotalTokenStats,
    getTokenUsageSummary,
    getDailyTokenUsage,
    getRecentTokenUsage,
    type TokenUsageSummary,
    type DailyTokenUsage,
    type TokenUsageLog
} from "@/lib/token-usage";
import TutorialManager from "./TutorialManager";
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
    const [activeTab, setActiveTab] = useState<"users" | "levels" | "quests" | "badges" | "events" | "distributions" | "xp_settings" | "tools" | "usage" | "tutorials" | "api_tokens">("users");
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

    // Fix body overflow on mobile
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            const originalOverflow = document.body.style.overflow;
            const originalHeight = document.body.style.height;
            document.body.style.overflow = 'visible';
            document.body.style.height = 'auto';
            document.documentElement.style.overflow = 'visible';
            document.documentElement.style.height = 'auto';

            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.height = originalHeight;
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            };
        }
    }, []);

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

    // Usage State
    const [usageData, setUsageData] = useState<any[]>([]);
    const [usageLoading, setUsageLoading] = useState(false);
    const [usageDate, setUsageDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [userProgressData, setUserProgressData] = useState<any[]>([]);
    const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
    const [activityDetail, setActivityDetail] = useState<any>(null);
    const [coinEditValue, setCoinEditValue] = useState<number>(0); // For coin addition
    const [creditAdditions, setCreditAdditions] = useState({
        audio_credits: 0,
        explorer_credits: 0,
        correction_credits: 0,
        explanation_credits: 0,
        extraction_credits: 0,
        etymology_credits: 0,
        chat_credits: 0,
        expression_credits: 0,
        vocab_credits: 0,
        grammar_credits: 0,
        extension_credits: 0,
        sentence_credits: 0
    }); // For credit additions

    // API Token Usage State
    const [tokenStats, setTokenStats] = useState<{
        total_input_tokens: number;
        total_output_tokens: number;
        total_tokens: number;
        total_requests: number;
        today_tokens: number;
        today_requests: number;
        avg_tokens_per_request: number;
        avg_input_per_request: number;
        avg_output_per_request: number;
        total_estimated_cost: number;
        today_estimated_cost: number;
        avg_cost_per_request: number;
    } | null>(null);
    const [tokenSummary, setTokenSummary] = useState<TokenUsageSummary[]>([]);
    const [dailyTokenUsage, setDailyTokenUsage] = useState<DailyTokenUsage[]>([]);
    const [recentTokenLogs, setRecentTokenLogs] = useState<TokenUsageLog[]>([]);
    const [tokenLogsPage, setTokenLogsPage] = useState(1);
    const [tokenLogsCount, setTokenLogsCount] = useState<number | null>(null);
    const [tokenDataLoading, setTokenDataLoading] = useState(false);
    const [tokenDisplayMode, setTokenDisplayMode] = useState<"avg" | "total">("avg");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Distribution Events State
    const [distributions, setDistributions] = useState<DistributionEvent[]>([]);
    const [distributionsLoading, setDistributionsLoading] = useState(false);
    const [distributionsPage, setDistributionsPage] = useState(1);
    const [distributionsFilter, setDistributionsFilter] = useState<string>("");
    const [distFormOpen, setDistFormOpen] = useState(false);
    const [distFormMode, setDistFormMode] = useState<"create" | "edit">("create");
    const [distFormData, setDistFormData] = useState<{
        id?: string;
        title: string;
        description: string;
        rewards: RewardEntry[];
        recurrence: string;
        scheduled_at: string;
        expires_at: string;
    }>({
        title: "", description: "", rewards: [{ type: "coins", amount: 100 }],
        recurrence: "once", scheduled_at: "", expires_at: ""
    });

    // Fetch User Progress when selectedUser changes
    useEffect(() => {
        setActiveLanguage(null);
        setActivityDetail(null);

        if (selectedUser) {
            startTransition(async () => {
                try {
                    const progress = await getUserProgress(selectedUser.id);
                    setUserProgressData(progress || []);
                } catch (e: any) {
                    console.error("Failed to fetch user progress", e);
                    showToast(e.message || "おっと、ユーザー進捗の取得に失敗しました", "error");
                }

                try {
                    const detail = await getUserActivityDetail(selectedUser.id);
                    if (!detail.error) setActivityDetail(detail);
                } catch (e) { console.error(e); }
            });
        }
    }, [selectedUser]);

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
        setCoinEditValue(0); // Reset to 0 for addition mode
        setCreditAdditions({ // Reset credit additions
            audio_credits: 0,
            explorer_credits: 0,
            correction_credits: 0,
            explanation_credits: 0,
            extraction_credits: 0,
            etymology_credits: 0,
            chat_credits: 0,
            expression_credits: 0,
            vocab_credits: 0,
            grammar_credits: 0,
            extension_credits: 0,
            sentence_credits: 0
        });
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

    const fetchUsage = async () => {
        setUsageLoading(true);
        try {
            const res = await getUserCredits();
            if (res.data) setUsageData(res.data);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setUsageLoading(false);
        }
    };

    const fetchTokenUsageData = async () => {
        setTokenDataLoading(true);
        try {
            const [statsRes, summaryRes, dailyRes, logsRes] = await Promise.all([
                getTotalTokenStats(),
                getTokenUsageSummary(),
                getDailyTokenUsage(30),
                getRecentTokenUsage(tokenLogsPage, 50)
            ]);

            if (statsRes.data) setTokenStats(statsRes.data);
            if (summaryRes.data) setTokenSummary(summaryRes.data);
            if (dailyRes.data) setDailyTokenUsage(dailyRes.data);
            if (logsRes.data) {
                setRecentTokenLogs(logsRes.data);
                setTokenLogsCount(logsRes.count);
            }
        } catch (e: any) {
            showToast(e.message || "Failed to load token usage data", "error");
        } finally {
            setTokenDataLoading(false);
        }
    };

    const fetchDistributions = async () => {
        setDistributionsLoading(true);
        try {
            const res = await getDistributionEvents(
                distributionsPage, 50,
                distributionsFilter || undefined
            );
            if (res.data) setDistributions(res.data);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setDistributionsLoading(false);
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
        } else if (activeTab === "usage") {
            fetchUsage();
        } else if (activeTab === "api_tokens") {
            fetchTokenUsageData();
        } else if (activeTab === "distributions") {
            fetchDistributions();
        }
    }, [activeTab, eventsPage, eventsFilter, usersPage, usageDate, tokenLogsPage, distributionsPage, distributionsFilter]);

    // --- Render Logic ---

    return (
        <div className="admin-root" style={{
            display: "flex",
            minHeight: "100vh",
            background: "var(--color-bg)",
            color: "var(--color-fg)",
            fontFamily: "var(--font-body)",
            overflow: "hidden" // Prevent body scroll, let panels scroll
        }}>
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab as any} isOpen={sidebarOpen} onToggle={toggleSidebar} />

            {/* Main Content Area */}
            <main className="admin-main-content" style={{
                flex: 1,
                height: "100vh",
                overflowY: "auto",
                position: "relative",
                background: "var(--color-bg-sub)" // Slightly different bg for contrast
            }}>
                {/* Dynamic Header based on active Tab */}
                <header className="admin-header" style={{
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

                <div className="admin-content-area" style={{ padding: "12px 48px 100px" }}>
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
                                        className="admin-modal-content"
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
                                        <div className="admin-grid-3" style={{
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


                                        {/* Coin Management */}
                                        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e5e5", background: "#fffbeb" }}>
                                            <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 600, color: "#92400e", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div style={{ width: "20px", height: "20px", background: "#f59e0b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "bold" }}>$</div>
                                                Coin Balance
                                            </h4>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                                                <div style={{ fontSize: "0.8rem", color: "#92400e" }}>現在:</div>
                                                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#92400e" }}>
                                                    {(selectedUser.coins || 0).toLocaleString()}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "0.85rem", color: "#666", whiteSpace: "nowrap" }}>追加:</span>
                                                    <input
                                                        type="number"
                                                        value={coinEditValue}
                                                        onChange={(e) => setCoinEditValue(parseInt(e.target.value) || 0)}
                                                        placeholder="0"
                                                        style={{
                                                            width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db",
                                                            fontSize: "1.1rem", fontWeight: "bold", textAlign: "right"
                                                        }}
                                                    />
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={async () => {
                                                        const newTotal = (selectedUser.coins || 0) + coinEditValue;
                                                        if (newTotal < 0) {
                                                            showToast("コインがマイナスになります", "error");
                                                            return;
                                                        }
                                                        const formData = new FormData();
                                                        formData.append("user_id", selectedUser.id);
                                                        formData.append("coins", newTotal.toString());
                                                        startTransition(async () => {
                                                            const res = await updateUserCoins(formData);
                                                            if (res?.error) {
                                                                showToast(res.error, "error");
                                                            } else {
                                                                showToast(`${coinEditValue >= 0 ? '+' : ''}${coinEditValue} コイン追加しました`, "success");
                                                                setSelectedUser((prev: any) => ({ ...prev, coins: newTotal }));
                                                                setCoinEditValue(0); // Reset input
                                                                fetchUsers();
                                                            }
                                                        });
                                                    }}
                                                    disabled={isPending || coinEditValue === 0}
                                                    style={{
                                                        padding: "10px 20px", background: coinEditValue === 0 ? "#ccc" : "#f59e0b", color: "white", fontWeight: 600,
                                                        border: "none", borderRadius: "8px", cursor: (isPending || coinEditValue === 0) ? "not-allowed" : "pointer",
                                                        opacity: isPending ? 0.7 : 1
                                                    }}
                                                >
                                                    {isPending ? "..." : "追加"}
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Credits Management */}
                                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e5e5" }}>
                                            <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 600, color: "#333", display: "flex", gap: "8px", alignItems: "center" }}>
                                                <Zap size={16} color="#3b82f6" fill="#3b82f6" />
                                                Usage Credits
                                            </h4>

                                            <div className="admin-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                                {[
                                                    { key: 'audio_credits', label: 'Audio', min: 10 },
                                                    { key: 'explorer_credits', label: 'Explorer', min: 5 },
                                                    { key: 'correction_credits', label: 'Correction', min: 2 },
                                                    { key: 'explanation_credits', label: 'Explanation', min: 5 },
                                                    { key: 'extraction_credits', label: 'Extraction', min: 3 },
                                                    { key: 'etymology_credits', label: 'Etymology', min: 3 },
                                                    { key: 'chat_credits', label: 'Chat', min: 3 },
                                                    { key: 'expression_credits', label: 'Expression', min: 3 },
                                                    { key: 'vocab_credits', label: 'Vocab', min: 1 },
                                                    { key: 'grammar_credits', label: 'Grammar', min: 1 },
                                                    { key: 'extension_credits', label: 'Extension', min: 5 },
                                                    { key: 'sentence_credits', label: 'Sentence', min: 3 }
                                                ].map(item => (
                                                    <div key={item.key} style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                                        <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>
                                                            {item.label}
                                                            <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "#94a3b8" }}>
                                                                (現在: {selectedUser[item.key] ?? 0})
                                                            </span>
                                                        </label>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                            <span style={{ fontSize: "0.85rem", color: "#666" }}>+</span>
                                                            <input
                                                                type="number"
                                                                value={creditAdditions[item.key as keyof typeof creditAdditions]}
                                                                onChange={(e) => setCreditAdditions(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                                                                placeholder="0"
                                                                style={{
                                                                    width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1",
                                                                    fontSize: "1rem", fontWeight: "600",
                                                                    color: "#0f172a"
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                                                <motion.button
                                                    onClick={() => {
                                                        const newCredits = {
                                                            audio_credits: (selectedUser.audio_credits || 0) + creditAdditions.audio_credits,
                                                            explorer_credits: (selectedUser.explorer_credits || 0) + creditAdditions.explorer_credits,
                                                            correction_credits: (selectedUser.correction_credits || 0) + creditAdditions.correction_credits,
                                                            explanation_credits: (selectedUser.explanation_credits || 0) + creditAdditions.explanation_credits,
                                                            extraction_credits: (selectedUser.extraction_credits || 0) + creditAdditions.extraction_credits,
                                                            etymology_credits: (selectedUser.etymology_credits || 0) + creditAdditions.etymology_credits,
                                                            chat_credits: (selectedUser.chat_credits || 0) + creditAdditions.chat_credits,
                                                            expression_credits: (selectedUser.expression_credits || 0) + creditAdditions.expression_credits,
                                                            vocab_credits: (selectedUser.vocab_credits || 0) + creditAdditions.vocab_credits,
                                                            grammar_credits: (selectedUser.grammar_credits || 0) + creditAdditions.grammar_credits,
                                                            extension_credits: (selectedUser.extension_credits || 0) + creditAdditions.extension_credits,
                                                            sentence_credits: (selectedUser.sentence_credits || 0) + creditAdditions.sentence_credits
                                                        };
                                                        // Check for negative values
                                                        for (const [key, value] of Object.entries(newCredits)) {
                                                            if (value < 0) {
                                                                showToast(`${key}がマイナスになります`, "error");
                                                                return;
                                                            }
                                                        }
                                                        handleAction(async () => {
                                                            const res = await updateUserCreditBalance(selectedUser.id, newCredits);
                                                            if (!res?.error) {
                                                                setSelectedUser((prev: any) => ({ ...prev, ...newCredits }));
                                                                setCreditAdditions({
                                                                    audio_credits: 0,
                                                                    explorer_credits: 0,
                                                                    correction_credits: 0,
                                                                    explanation_credits: 0,
                                                                    extraction_credits: 0,
                                                                    etymology_credits: 0,
                                                                    chat_credits: 0,
                                                                    expression_credits: 0,
                                                                    vocab_credits: 0,
                                                                    grammar_credits: 0,
                                                                    extension_credits: 0,
                                                                    sentence_credits: 0
                                                                });
                                                            }
                                                            return res;
                                                        }, new FormData());
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    disabled={Object.values(creditAdditions).every(v => v === 0)}
                                                    style={{
                                                        padding: "8px 16px",
                                                        background: Object.values(creditAdditions).every(v => v === 0) ? "#ccc" : "#3b82f6",
                                                        color: "white",
                                                        border: "none", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 600,
                                                        cursor: Object.values(creditAdditions).every(v => v === 0) ? "not-allowed" : "pointer"
                                                    }}
                                                >
                                                    クレジット追加
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Progress Stats */}
                                        <div style={{ padding: "0 24px 20px", borderBottom: "1px solid #e5e5e5" }}>
                                            <h4 style={{ margin: "20px 0 12px", fontSize: "0.95rem", fontWeight: 600, color: "#333", display: "flex", gap: "8px", alignItems: "center" }}>
                                                <Zap size={16} color="#eab308" fill="#eab308" />
                                                レベル・経験値
                                            </h4>
                                            {userProgressData.length === 0 ? (
                                                <div style={{ padding: "12px", background: "#f8f9fa", borderRadius: "8px", fontSize: "0.85rem", color: "#666" }}>
                                                    データなし
                                                </div>
                                            ) : (
                                                <div className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                    {userProgressData.map((p: any) => (
                                                        <div key={p.language_code}
                                                            onClick={() => setActiveLanguage(activeLanguage === p.language_code ? null : p.language_code)}
                                                            style={{
                                                                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px",
                                                                border: activeLanguage === p.language_code ? "2px solid #3b82f6" : "1px solid #eee",
                                                                background: activeLanguage === p.language_code ? "#eff6ff" : "#fff",
                                                                cursor: "pointer", transition: "all 0.2s ease"
                                                            }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 6px", background: "#eee", borderRadius: "4px", textTransform: "uppercase" }}>
                                                                    {p.language_code}
                                                                </span>
                                                                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#333" }}>Lv.{p.current_level}</span>
                                                            </div>
                                                            <div style={{ fontSize: "0.85rem", color: "#666" }}>
                                                                <span style={{ fontWeight: 600, color: "#6366f1" }}>{p.xp_total}</span> XP
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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

                                            {(() => {
                                                const stats = activeLanguage
                                                    ? (activityDetail?.byLanguage?.[activeLanguage] || {})
                                                    : (activityDetail?.total || userStats || {});
                                                const entries = Object.entries(stats);

                                                if (!activityDetail && userStatsLoading) return <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>読み込み中...</div>;

                                                if (entries.length === 0) {
                                                    return (
                                                        <div style={{ textAlign: "center", padding: "40px", color: "#888", background: "#f8f9fa", borderRadius: "10px" }}>
                                                            {activeLanguage ? `${activeLanguage}のアクティビティはありません` : "まだアクティビティがありません"}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                        {entries.map(([key, count]) => (
                                                            <div key={key} style={{
                                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                padding: "12px 16px", background: (count as number) > 0 ? "#f0f4ff" : "#f8f9fa",
                                                                borderRadius: "8px", borderLeft: (count as number) > 0 ? "3px solid #6366f1" : "3px solid transparent"
                                                            }}>
                                                                <span style={{ fontSize: "0.9rem", color: "#444", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                                                                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: (count as number) > 0 ? "#6366f1" : "#bbb" }}>{count as number}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
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

                    {activeTab === "usage" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700 }}>User Credit Balances</h2>
                                    <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                                        Manage usage credits for users.
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

                                    <motion.button
                                        onClick={fetchUsage}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem",
                                            background: "var(--color-surface)", border: "1px solid var(--color-border)",
                                            borderRadius: "10px", padding: "10px 16px",
                                            cursor: "pointer", color: "var(--color-fg)", fontWeight: 500
                                        }}
                                    >
                                        <RefreshCw size={14} className={usageLoading ? "animate-spin" : ""} /> Refresh
                                    </motion.button>
                                </div>
                            </div>

                            {usageData.length === 0 && !usageLoading ? (
                                <div style={{ padding: "40px", textAlign: "center", background: "var(--color-surface)", borderRadius: "12px", color: "var(--color-fg-muted)" }}>
                                    No usage data found for this date.
                                </div>
                            ) : (
                                <DataTable
                                    data={usageData}
                                    keyField="id"
                                    columns={[
                                        { header: "User", accessor: (item) => <span style={{ fontWeight: 600 }}>{item.username}</span> },
                                        {
                                            header: "Audio Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.audio_credits < 10 ? 'red' : 'inherit' }}>{item.audio_credits}</span>
                                        },
                                        {
                                            header: "Explorer Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.explorer_credits < 5 ? 'red' : 'inherit' }}>{item.explorer_credits}</span>
                                        },
                                        {
                                            header: "Correction Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.correction_credits < 2 ? 'red' : 'inherit' }}>{item.correction_credits}</span>
                                        },
                                        {
                                            header: "Explanation Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.explanation_credits < 5 ? 'red' : 'inherit' }}>{item.explanation_credits}</span>
                                        },
                                        {
                                            header: "Extraction Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.extraction_credits < 3 ? 'red' : 'inherit' }}>{item.extraction_credits}</span>
                                        },
                                        {
                                            header: "Etymology Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.etymology_credits < 3 ? 'red' : 'inherit' }}>{item.etymology_credits}</span>
                                        },
                                        {
                                            header: "Chat Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.chat_credits < 3 ? 'red' : 'inherit' }}>{item.chat_credits}</span>
                                        },
                                        {
                                            header: "Expression Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.expression_credits < 3 ? 'red' : 'inherit' }}>{item.expression_credits}</span>
                                        },
                                        {
                                            header: "Vocab Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.vocab_credits < 1 ? 'red' : 'inherit' }}>{item.vocab_credits}</span>
                                        },
                                        {
                                            header: "Grammar Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.grammar_credits < 1 ? 'red' : 'inherit' }}>{item.grammar_credits}</span>
                                        },
                                        {
                                            header: "Extension Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.extension_credits < 5 ? 'red' : 'inherit' }}>{item.extension_credits}</span>
                                        },
                                        {
                                            header: "Sentence Credits",
                                            accessor: (item) => <span style={{ fontWeight: 700, color: item.sentence_credits < 3 ? 'red' : 'inherit' }}>{item.sentence_credits}</span>
                                        },
                                        {
                                            header: "Actions",
                                            accessor: (item) => (
                                                <motion.button
                                                    onClick={() => fetchUserDetail(item)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{
                                                        padding: "6px 12px", background: "#dbeafe", color: "#1e40af",
                                                        border: "none", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Details
                                                </motion.button>
                                            )
                                        }
                                    ]}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === "events" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

                            {/* Stats Cards */}
                            <div className="admin-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
                                {[
                                    // Core Features
                                    { key: 'phrase_view', label: 'フレーズ閲覧', color: '#3b82f6' },
                                    { key: 'saved_phrase', label: '保存したフレーズ', color: '#6366f1' },
                                    { key: 'audio_play', label: '音声再生', color: '#06b6d4' },
                                    { key: 'text_copy', label: 'テキストコピー', color: '#10b981' },
                                    { key: 'word_explore', label: '単語探索', color: '#f59e0b' },
                                    { key: 'explanation_request', label: '説明リクエスト', color: '#ec4899' },
                                    // Correction Features
                                    { key: 'correction_request', label: '校正リクエスト', color: '#8b5cf6' },
                                    // Memo Features
                                    { key: 'memo_created', label: 'メモ作成', color: '#14b8a6' },
                                    { key: 'memo_verified', label: 'メモ検証', color: '#22c55e' },
                                    { key: 'memo_reviewed', label: 'メモSRS復習', color: '#059669' },
                                    // Review & Study
                                    { key: 'card_reviewed', label: 'カード復習', color: '#84cc16' },
                                    { key: 'review_complete', label: 'レビュー完了', color: '#65a30d' },
                                    { key: 'study_session_complete', label: '学習セッション完了', color: '#16a34a' },
                                    // Grammar & Sentence
                                    { key: 'grammar_pattern_studied', label: '文法パターン学習', color: '#a855f7' },
                                    { key: 'sentence_completed', label: '文読了', color: '#9333ea' },
                                    { key: 'sentence_analyzed', label: '文構造解析', color: '#7c3aed' },
                                    // Advanced Features
                                    { key: 'etymology_searched', label: '語源検索', color: '#c026d3' },
                                    { key: 'phrasal_verb_searched', label: '句動詞検索', color: '#db2777' },
                                    { key: 'image_extract', label: '画像抽出', color: '#f97316' },
                                    // Vocabulary
                                    { key: 'vocab_generated', label: 'ボキャブ生成', color: '#ea580c' },
                                    { key: 'vocab_card_reviewed', label: 'ボキャブカード復習', color: '#dc2626' },
                                    { key: 'vocabulary_set_created', label: 'ボキャブセット作成', color: '#b91c1c' },
                                    // Script & Characters
                                    { key: 'script_character_reviewed', label: '文字カード復習', color: '#0891b2' },
                                    // AI Features
                                    { key: 'ai_exercise_completed', label: 'AI演習回答', color: '#0e7490' },
                                    // Slang & Community
                                    { key: 'slang_voted', label: 'スラング投票', color: '#0d9488' },
                                    // Pronunciation
                                    { key: 'pronunciation_check', label: '発音チェック', color: '#14b8a6' },
                                    { key: 'pronunciation_result', label: '発音結果', color: '#06b6d4' },
                                    // Expression
                                    { key: 'expression_translate', label: '表現翻訳', color: '#8b5cf6' },
                                    { key: 'expression_examples', label: '表現例文', color: '#a855f7' },
                                    // Tutorial & Onboarding
                                    { key: 'tutorial_complete', label: 'チュートリアル', color: '#a855f7' },
                                    // Settings & Preferences
                                    { key: 'category_select', label: 'カテゴリ選択', color: '#64748b' },
                                    { key: 'gender_change', label: '性別変更', color: '#f472b6' },
                                    { key: 'nuance_refinement', label: 'ニュアンス調整', color: '#e11d48' },
                                    // Social & Engagement
                                    { key: 'chat_message', label: 'チャットメッセージ', color: '#6366f1' },
                                    { key: 'daily_checkin', label: 'デイリーチェックイン', color: '#fbbf24' },
                                    { key: 'reward_claimed', label: '報酬獲得', color: '#f59e0b' }
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
                                        <option value="image_extract">Image Extract</option>
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

                            {/* Maintenance Section */}
                            <div style={{ marginTop: "40px", padding: "24px", background: "#f8f9fa", borderRadius: "12px", border: "1px dashed #ccc" }}>
                                <h3 style={{ marginTop: 0, fontSize: "1.1rem", color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <RefreshCw size={20} />
                                    メンテナンス
                                </h3>
                                <p style={{ fontSize: "0.9rem", color: "#666", lineHeight: "1.6" }}>
                                    現在のXP設定値に基づいて、過去の全イベント履歴から全ユーザーのXPとレベルを再計算します。<br />
                                    <span style={{ color: "#ef4444", fontWeight: 600 }}>注意:</span> 現在の進捗データは上書きされます。XP設定を変更した後などに使用してください。
                                </p>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("XP設定の初期データを投入します。よろしいですか？")) return;
                                            startTransition(async () => {
                                                const res = await seedXpSettings();
                                                if (res?.error) showToast(res.error, "error");
                                                else { showToast("XP設定を初期化しました", "success"); fetchXpSettings(); }
                                            });
                                        }}
                                        disabled={isPending}
                                        style={{
                                            marginTop: "16px",
                                            padding: "10px 20px",
                                            background: "#fff",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            cursor: isPending ? "not-allowed" : "pointer",
                                            fontWeight: 600,
                                            color: "#555",
                                            display: "flex", alignItems: "center", gap: "8px",
                                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                                        }}
                                    >
                                        <Plus size={16} /> 初期設定を投入
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("全ユーザーのXPとレベルを再計算します。よろしいですか？")) return;

                                            startTransition(async () => {
                                                try {
                                                    const res = await recalculateAllUserProgress();
                                                    if (res?.error) showToast(res.error, "error");
                                                    else showToast(res.details || `再計算完了: ${res.count}件の進捗データを更新しました`, "success"); // Show details if available
                                                } catch (e: any) {
                                                    console.error(e);
                                                    showToast("エラーが発生しました: " + e.message, "error");
                                                }
                                            });
                                        }}
                                        disabled={isPending}
                                        style={{
                                            marginTop: "16px",
                                            padding: "10px 20px",
                                            background: "#fff",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            cursor: isPending ? "not-allowed" : "pointer",
                                            fontWeight: 600,
                                            color: "#333",
                                            display: "flex", alignItems: "center", gap: "8px",
                                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                                        }}
                                    >
                                        {isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                        XP・レベルの全再計算を実行
                                    </button>
                                </div>
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

                    {activeTab === "tutorials" && (
                        <TutorialManager showToast={showToast} />
                    )}

                    {activeTab === "distributions" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700 }}>
                                        Distribution Events
                                    </h2>
                                    <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                                        Claim-based distributions. Users must log in and claim rewards.
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <select
                                        value={distributionsFilter}
                                        onChange={(e) => { setDistributionsFilter(e.target.value); setDistributionsPage(1); }}
                                        style={{
                                            padding: "10px 14px", borderRadius: "10px",
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-surface)",
                                            color: "var(--color-fg)", fontSize: "0.875rem"
                                        }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <motion.button
                                        onClick={fetchDistributions}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "8px",
                                            fontSize: "0.875rem",
                                            background: "var(--color-surface)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "10px", padding: "10px 16px",
                                            cursor: "pointer", color: "var(--color-fg)", fontWeight: 500
                                        }}
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </motion.button>
                                    <CreateButton
                                        label="New Distribution"
                                        onClick={() => {
                                            setDistFormMode("create");
                                            setDistFormData({
                                                title: "", description: "",
                                                rewards: [{ type: "coins", amount: 100 }],
                                                recurrence: "once", scheduled_at: "", expires_at: ""
                                            });
                                            setDistFormOpen(true);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            {distributionsLoading ? (
                                <div style={{ padding: "60px", display: "flex", justifyContent: "center" }}>
                                    <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-fg-muted)" }} />
                                </div>
                            ) : distributions.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: "60px 40px", textAlign: "center",
                                        color: "var(--color-fg-muted)",
                                        background: "var(--color-surface)",
                                        borderRadius: "16px",
                                        border: "1px dashed var(--color-border)"
                                    }}
                                >
                                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎁</div>
                                    <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "4px" }}>No Distribution Events</div>
                                    <div style={{ fontSize: "0.9rem" }}>Create your first claim-based distribution event.</div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        borderRadius: "16px", overflow: "hidden",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-surface)",
                                        boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)"
                                    }}
                                >
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{
                                                background: "linear-gradient(to bottom, var(--color-bg-sub), var(--color-bg))",
                                                textAlign: "left"
                                            }}>
                                                {["Title", "Rewards", "Recurrence", "Scheduled", "Status", "Claims", "Actions"].map(h => (
                                                    <th key={h} style={{ padding: "16px 16px", fontWeight: 700, fontSize: "0.75rem", color: "var(--color-fg-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", textAlign: h === "Actions" ? "right" : "left" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {distributions.map((item, index) => {
                                                    const statusColors: Record<string, { bg: string; fg: string }> = {
                                                        draft: { bg: "#94a3b820", fg: "#64748b" },
                                                        active: { bg: "#22c55e20", fg: "#16a34a" },
                                                        expired: { bg: "#f59e0b20", fg: "#d97706" },
                                                        cancelled: { bg: "#ef444420", fg: "#dc2626" }
                                                    };
                                                    const sc = statusColors[item.status] || statusColors.draft;
                                                    const rewards = Array.isArray(item.rewards) ? item.rewards : [];
                                                    const recurrenceLabels: Record<string, string> = { once: "Once", daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
                                                    return (
                                                        <motion.tr
                                                            key={item.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            style={{
                                                                borderBottom: index === distributions.length - 1 ? "none" : "1px solid var(--color-border)"
                                                            }}
                                                        >
                                                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                                                                <div style={{ fontWeight: 600, color: "var(--color-fg)" }}>{item.title}</div>
                                                                {item.description && (
                                                                    <div style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)", marginTop: "2px" }}>
                                                                        {item.description.length > 50 ? item.description.substring(0, 50) + "..." : item.description}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                                    {rewards.map((r: RewardEntry, ri: number) => (
                                                                        <span key={ri} style={{
                                                                            background: "var(--color-bg-sub)",
                                                                            padding: "2px 8px", borderRadius: "6px",
                                                                            fontSize: "0.8rem", fontWeight: 500, display: "inline-block", width: "fit-content"
                                                                        }}>
                                                                            +{r.amount} {r.type.replace(/_/g, ' ')}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: "0.85rem" }}>
                                                                {recurrenceLabels[item.recurrence] || item.recurrence}
                                                            </td>
                                                            <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: "0.85rem", color: "var(--color-fg)" }}>
                                                                {new Date(item.scheduled_at).toLocaleString()}
                                                                {item.expires_at && (
                                                                    <div style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", marginTop: "2px" }}>
                                                                        Expires: {new Date(item.expires_at).toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                                                                <span style={{
                                                                    padding: "4px 10px", borderRadius: "6px",
                                                                    fontSize: "0.8rem", fontWeight: 600,
                                                                    background: sc.bg, color: sc.fg,
                                                                    textTransform: "capitalize"
                                                                }}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: "0.9rem", fontWeight: 600 }}>
                                                                {item.claim_count}
                                                            </td>
                                                            <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                                                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                                                    {item.status === "draft" && (
                                                                        <>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.05 }}
                                                                                whileTap={{ scale: 0.95 }}
                                                                                onClick={() => {
                                                                                    if (confirm(`Publish "${item.title}"?\nUsers will be able to claim this reward.`)) {
                                                                                        startTransition(async () => {
                                                                                            const res = await publishDistributionEvent(item.id);
                                                                                            if (res?.error) showToast(res.error, "error");
                                                                                            else { showToast("Event published", "success"); fetchDistributions(); }
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    padding: "6px 12px", fontSize: "0.8rem",
                                                                                    background: "#22c55e", color: "white",
                                                                                    border: "none", borderRadius: "6px",
                                                                                    cursor: "pointer", fontWeight: 600
                                                                                }}
                                                                            >
                                                                                Publish
                                                                            </motion.button>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.05 }}
                                                                                whileTap={{ scale: 0.95 }}
                                                                                onClick={() => {
                                                                                    setDistFormMode("edit");
                                                                                    setDistFormData({
                                                                                        id: item.id,
                                                                                        title: item.title,
                                                                                        description: item.description || "",
                                                                                        rewards: Array.isArray(item.rewards) ? item.rewards : [],
                                                                                        recurrence: item.recurrence,
                                                                                        scheduled_at: new Date(item.scheduled_at).toISOString().slice(0, 16),
                                                                                        expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : ""
                                                                                    });
                                                                                    setDistFormOpen(true);
                                                                                }}
                                                                                style={{
                                                                                    padding: "6px 12px", fontSize: "0.8rem",
                                                                                    background: "#6366f1", color: "white",
                                                                                    border: "none", borderRadius: "6px",
                                                                                    cursor: "pointer", fontWeight: 600
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </motion.button>
                                                                        </>
                                                                    )}
                                                                    {(item.status === "draft" || item.status === "active") && (
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => {
                                                                                if (confirm(`Cancel "${item.title}"?`)) {
                                                                                    startTransition(async () => {
                                                                                        const res = await cancelDistributionEvent(item.id);
                                                                                        if (res?.error) showToast(res.error, "error");
                                                                                        else { showToast("Event cancelled", "success"); fetchDistributions(); }
                                                                                    });
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                padding: "6px 12px", fontSize: "0.8rem",
                                                                                background: "#ef4444", color: "white",
                                                                                border: "none", borderRadius: "6px",
                                                                                cursor: "pointer", fontWeight: 600
                                                                            }}
                                                                        >
                                                                            {item.status === "active" ? "Stop" : "Cancel"}
                                                                        </motion.button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}

                            {/* Pagination */}
                            {distributions.length > 0 && (
                                <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                                    <motion.button
                                        onClick={() => setDistributionsPage(p => Math.max(1, p - 1))}
                                        disabled={distributionsPage === 1}
                                        whileHover={{ scale: distributionsPage === 1 ? 1 : 1.05 }}
                                        whileTap={{ scale: distributionsPage === 1 ? 1 : 0.95 }}
                                        style={{
                                            padding: "10px 20px", border: "1px solid var(--color-border)",
                                            borderRadius: "10px", background: "var(--color-surface)",
                                            opacity: distributionsPage === 1 ? 0.5 : 1,
                                            cursor: distributionsPage === 1 ? "not-allowed" : "pointer",
                                            fontWeight: 500, color: "var(--color-fg)"
                                        }}
                                    >
                                        Previous
                                    </motion.button>
                                    <span style={{ padding: "10px 16px", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>
                                        Page {distributionsPage}
                                    </span>
                                    <motion.button
                                        onClick={() => setDistributionsPage(p => p + 1)}
                                        disabled={distributions.length < 50}
                                        whileHover={{ scale: distributions.length < 50 ? 1 : 1.05 }}
                                        whileTap={{ scale: distributions.length < 50 ? 1 : 0.95 }}
                                        style={{
                                            padding: "10px 20px", border: "1px solid var(--color-border)",
                                            borderRadius: "10px", background: "var(--color-surface)",
                                            opacity: distributions.length < 50 ? 0.5 : 1,
                                            cursor: distributions.length < 50 ? "not-allowed" : "pointer",
                                            fontWeight: 500, color: "var(--color-fg)"
                                        }}
                                    >
                                        Next
                                    </motion.button>
                                </div>
                            )}

                            {/* Create/Edit Form Modal */}
                            <AnimatePresence>
                                {distFormOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            position: "fixed", inset: 0, zIndex: 100,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "24px"
                                        }}
                                        onClick={() => setDistFormOpen(false)}
                                    >
                                        <motion.div
                                            className="admin-modal-content"
                                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            style={{
                                                background: "var(--color-surface)", borderRadius: "20px",
                                                boxShadow: "0 25px 80px -20px rgba(0,0,0,0.4)",
                                                width: "100%", maxWidth: "580px", maxHeight: "85vh", overflowY: "auto",
                                                border: "1px solid var(--color-border)"
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {/* Modal Header */}
                                            <div style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "24px 28px 20px", borderBottom: "1px solid var(--color-border)"
                                            }}>
                                                <h3 style={{ fontSize: "1.3rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700, color: "var(--color-fg)" }}>
                                                    {distFormMode === "create" ? "Create" : "Edit"} Distribution
                                                </h3>
                                                <motion.button
                                                    onClick={() => setDistFormOpen(false)}
                                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    style={{
                                                        color: "var(--color-fg-muted)", cursor: "pointer",
                                                        width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
                                                        borderRadius: "10px", background: "var(--color-bg-sub)", border: "none"
                                                    }}
                                                >
                                                    ✕
                                                </motion.button>
                                            </div>

                                            {/* Modal Body */}
                                            <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                                                {/* Title */}
                                                <div>
                                                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", display: "block", marginBottom: "6px" }}>Title *</label>
                                                    <input
                                                        type="text" value={distFormData.title}
                                                        onChange={e => setDistFormData(d => ({ ...d, title: e.target.value }))}
                                                        placeholder="e.g. New Year Bonus"
                                                        style={{
                                                            width: "100%", padding: "12px 14px", border: "2px solid var(--color-border)",
                                                            borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                            fontSize: "0.95rem", outline: "none"
                                                        }}
                                                    />
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", display: "block", marginBottom: "6px" }}>Description</label>
                                                    <textarea
                                                        value={distFormData.description}
                                                        onChange={e => setDistFormData(d => ({ ...d, description: e.target.value }))}
                                                        placeholder="Optional description"
                                                        rows={2}
                                                        style={{
                                                            width: "100%", padding: "12px 14px", border: "2px solid var(--color-border)",
                                                            borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                            fontSize: "0.95rem", outline: "none", resize: "vertical", fontFamily: "var(--font-body)"
                                                        }}
                                                    />
                                                </div>

                                                {/* Rewards (dynamic list) */}
                                                <div>
                                                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", display: "block", marginBottom: "8px" }}>
                                                        Rewards *
                                                    </label>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        {distFormData.rewards.map((reward, ri) => (
                                                            <div key={ri} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                                <select
                                                                    value={reward.type}
                                                                    onChange={e => {
                                                                        const updated = [...distFormData.rewards];
                                                                        updated[ri] = { ...updated[ri], type: e.target.value };
                                                                        setDistFormData(d => ({ ...d, rewards: updated }));
                                                                    }}
                                                                    style={{
                                                                        flex: 1, padding: "10px 12px", border: "2px solid var(--color-border)",
                                                                        borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                                        fontSize: "0.9rem", outline: "none"
                                                                    }}
                                                                >
                                                                    <option value="coins">Coins</option>
                                                                    <option value="audio_credits">Audio Credits</option>
                                                                    <option value="explorer_credits">Explorer Credits</option>
                                                                    <option value="correction_credits">Correction Credits</option>
                                                                    <option value="explanation_credits">Explanation Credits</option>
                                                                    <option value="extraction_credits">Extraction Credits</option>
                                                                    <option value="etymology_credits">Etymology Credits</option>
                                                                    <option value="chat_credits">Chat Credits</option>
                                                                    <option value="expression_credits">Expression Credits</option>
                                                                    <option value="vocab_credits">Vocab Credits</option>
                                                                    <option value="grammar_credits">Grammar Credits</option>
                                                                    <option value="extension_credits">Extension Credits</option>
                                                                    <option value="sentence_credits">Sentence Credits</option>
                                                                </select>
                                                                <input
                                                                    type="number" value={reward.amount} min={1}
                                                                    onChange={e => {
                                                                        const updated = [...distFormData.rewards];
                                                                        updated[ri] = { ...updated[ri], amount: parseInt(e.target.value) || 0 };
                                                                        setDistFormData(d => ({ ...d, rewards: updated }));
                                                                    }}
                                                                    style={{
                                                                        width: "100px", padding: "10px 12px", border: "2px solid var(--color-border)",
                                                                        borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                                        fontSize: "0.9rem", outline: "none"
                                                                    }}
                                                                />
                                                                {distFormData.rewards.length > 1 && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => {
                                                                            setDistFormData(d => ({
                                                                                ...d,
                                                                                rewards: d.rewards.filter((_, i) => i !== ri)
                                                                            }));
                                                                        }}
                                                                        style={{
                                                                            padding: "8px", border: "none", background: "#ef444420",
                                                                            borderRadius: "8px", cursor: "pointer", color: "#ef4444",
                                                                            fontWeight: 700, fontSize: "0.9rem", lineHeight: 1
                                                                        }}
                                                                    >
                                                                        ✕
                                                                    </motion.button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setDistFormData(d => ({
                                                                ...d,
                                                                rewards: [...d.rewards, { type: "coins", amount: 100 }]
                                                            }))}
                                                            style={{
                                                                padding: "10px", border: "2px dashed var(--color-border)",
                                                                borderRadius: "10px", background: "transparent",
                                                                cursor: "pointer", color: "var(--color-fg-muted)",
                                                                fontSize: "0.85rem", fontWeight: 600
                                                            }}
                                                        >
                                                            + Add Reward
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                {/* Recurrence */}
                                                <div>
                                                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", display: "block", marginBottom: "6px" }}>Recurrence *</label>
                                                    <select
                                                        value={distFormData.recurrence}
                                                        onChange={e => setDistFormData(d => ({ ...d, recurrence: e.target.value }))}
                                                        style={{
                                                            width: "100%", padding: "12px 14px", border: "2px solid var(--color-border)",
                                                            borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                            fontSize: "0.95rem", outline: "none"
                                                        }}
                                                    >
                                                        <option value="once">Once</option>
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                    </select>
                                                </div>

                                                {/* Scheduled At */}
                                                <div>
                                                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", display: "block", marginBottom: "6px" }}>Available From *</label>
                                                    <input
                                                        type="datetime-local" value={distFormData.scheduled_at}
                                                        onChange={e => setDistFormData(d => ({ ...d, scheduled_at: e.target.value }))}
                                                        style={{
                                                            width: "100%", padding: "12px 14px", border: "2px solid var(--color-border)",
                                                            borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                            fontSize: "0.95rem", outline: "none"
                                                        }}
                                                    />
                                                </div>

                                                {/* Expires At */}
                                                <div>
                                                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", display: "block", marginBottom: "6px" }}>
                                                        Expires At <span style={{ fontWeight: 400, color: "var(--color-fg-muted)" }}>(optional)</span>
                                                    </label>
                                                    <input
                                                        type="datetime-local" value={distFormData.expires_at}
                                                        onChange={e => setDistFormData(d => ({ ...d, expires_at: e.target.value }))}
                                                        style={{
                                                            width: "100%", padding: "12px 14px", border: "2px solid var(--color-border)",
                                                            borderRadius: "10px", background: "var(--color-bg)", color: "var(--color-fg)",
                                                            fontSize: "0.95rem", outline: "none"
                                                        }}
                                                    />
                                                </div>

                                                {/* Submit */}
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                                                    <motion.button
                                                        onClick={() => setDistFormOpen(false)}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        style={{
                                                            padding: "12px 24px", background: "transparent",
                                                            border: "2px solid var(--color-border)", borderRadius: "10px",
                                                            fontSize: "0.9rem", fontWeight: 600, color: "var(--color-fg)", cursor: "pointer"
                                                        }}
                                                    >
                                                        Cancel
                                                    </motion.button>
                                                    <motion.button
                                                        disabled={isPending}
                                                        whileHover={{ scale: 1.02, boxShadow: "0 8px 25px -8px rgba(99,102,241,0.5)" }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            startTransition(async () => {
                                                                let res;
                                                                if (distFormMode === "create") {
                                                                    res = await createDistributionEvent({
                                                                        title: distFormData.title,
                                                                        description: distFormData.description || undefined,
                                                                        rewards: distFormData.rewards,
                                                                        recurrence: distFormData.recurrence,
                                                                        scheduled_at: distFormData.scheduled_at,
                                                                        expires_at: distFormData.expires_at || undefined,
                                                                    });
                                                                } else {
                                                                    res = await updateDistributionEvent(distFormData.id!, {
                                                                        title: distFormData.title,
                                                                        description: distFormData.description || undefined,
                                                                        rewards: distFormData.rewards,
                                                                        recurrence: distFormData.recurrence,
                                                                        scheduled_at: distFormData.scheduled_at,
                                                                        expires_at: distFormData.expires_at || undefined,
                                                                    });
                                                                }
                                                                if (res?.error) {
                                                                    showToast(res.error, "error");
                                                                } else {
                                                                    showToast(distFormMode === "create" ? "Distribution created" : "Distribution updated", "success");
                                                                    setDistFormOpen(false);
                                                                    fetchDistributions();
                                                                }
                                                            });
                                                        }}
                                                        style={{
                                                            padding: "12px 28px",
                                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                            border: "none", borderRadius: "10px",
                                                            fontSize: "0.9rem", fontWeight: 600, color: "white",
                                                            cursor: isPending ? "not-allowed" : "pointer",
                                                            opacity: isPending ? 0.7 : 1,
                                                            boxShadow: "0 4px 20px -4px rgba(99,102,241,0.4)"
                                                        }}
                                                    >
                                                        {isPending ? "Saving..." : "Save"}
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {activeTab === "api_tokens" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", margin: 0, fontWeight: 700 }}>
                                        API Token Usage
                                    </h2>
                                    <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                                        Monitor input/output token consumption across all API calls (OpenAI + Gemini TTS).
                                    </p>
                                </div>
                                <motion.button
                                    onClick={fetchTokenUsageData}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem",
                                        background: "var(--color-surface)", border: "1px solid var(--color-border)",
                                        borderRadius: "10px", padding: "10px 16px",
                                        cursor: "pointer", color: "var(--color-fg)", fontWeight: 500
                                    }}
                                >
                                    <RefreshCw size={14} className={tokenDataLoading ? "animate-spin" : ""} /> Refresh
                                </motion.button>
                            </div>

                            {tokenDataLoading && !tokenStats ? (
                                <div style={{ padding: "60px", display: "flex", justifyContent: "center" }}>
                                    <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-fg-muted)" }} />
                                </div>
                            ) : (
                                <>
                                    {/* Stats Cards - Row 1: Tokens */}
                                    <div className="admin-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                                        <div style={{
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Total Tokens</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                {(tokenStats?.total_tokens || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                {(tokenStats?.total_requests || 0).toLocaleString()} requests
                                            </div>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #10b981, #059669)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Avg Input/Request</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                {(tokenStats?.avg_input_per_request || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                Total: {(tokenStats?.total_input_tokens || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Avg Output/Request</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                {(tokenStats?.avg_output_per_request || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                Total: {(tokenStats?.total_output_tokens || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #64748b, #475569)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Avg Tokens/Request</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                {(tokenStats?.avg_tokens_per_request || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                Today: {(tokenStats?.today_tokens || 0).toLocaleString()} ({tokenStats?.today_requests || 0} req)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Cards - Row 2: Cost */}
                                    <div className="admin-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                                        <div style={{
                                            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Total Cost (Est.)</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                ${(tokenStats?.total_estimated_cost || 0).toFixed(4)}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                Per-model pricing applied
                                            </div>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #ea580c, #c2410c)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Today's Cost (Est.)</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                ${(tokenStats?.today_estimated_cost || 0).toFixed(4)}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                {tokenStats?.today_requests || 0} requests today
                                            </div>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #0891b2, #0e7490)",
                                            borderRadius: "16px", padding: "20px", color: "white"
                                        }}>
                                            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "8px" }}>Avg Cost/Request</div>
                                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                                                ${(tokenStats?.avg_cost_per_request || 0).toFixed(6)}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                                                Per API call average
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage by Feature - Categorized */}
                                    {(() => {
                                        const FEATURE_LABELS: Record<string, string> = {
                                            tokenize: 'Word Tokenizer',
                                            furigana: 'Furigana Reading',
                                            explanation: 'Phrase Explanation',
                                            explorer: 'Related Phrases',
                                            etymology: 'Etymology Lookup',
                                            correction: 'Stream Quick Correction',
                                            correction_v2: 'Page Correction',
                                            nuance_refinement: 'Nuance Refinement',
                                            vocab_generator: 'Vocab Set Generator',
                                            grammar_diagnostic: 'Grammar Diagnostic',
                                            expression_translate: 'Expression Translation',
                                            expression_examples: 'Expression Examples',
                                            chat: 'AI Chat (Reply + Correction)',
                                            chat_translate: 'Chat Message Translation',
                                            chat_summarize: 'Chat Summary',
                                            tts: 'Text to Speech',
                                            extension_translate: 'Ext: Page Translation',
                                            extension_smart_save: 'Ext: Smart Save',
                                            image_extract: 'Image Text Extract',
                                        };
                                        const FEATURE_CATEGORIES: Record<string, string[]> = {
                                            'Core Learning': ['tokenize', 'furigana', 'explanation', 'explorer', 'etymology'],
                                            'Correction': ['correction', 'correction_v2', 'nuance_refinement'],
                                            'Generation': ['vocab_generator', 'grammar_diagnostic', 'expression_translate', 'expression_examples'],
                                            'Chat': ['chat', 'chat_translate', 'chat_summarize'],
                                            'TTS': ['tts'],
                                            'Extension': ['extension_translate', 'extension_smart_save'],
                                        };
                                        const CATEGORY_COLORS: Record<string, string> = {
                                            'Core Learning': 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                            'Correction': 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            'Generation': 'linear-gradient(135deg, #10b981, #059669)',
                                            'Chat': 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            'TTS': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                            'Extension': 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                            'Other': 'linear-gradient(135deg, #64748b, #475569)',
                                        };
                                        const allKnown = Object.values(FEATURE_CATEGORIES).flat();
                                        const otherFeatures = tokenSummary.filter(s => !allKnown.includes(s.feature));

                                        const categories = Object.entries(FEATURE_CATEGORIES).map(([name, features]) => {
                                            const items = tokenSummary.filter(s => features.includes(s.feature));
                                            return { name, items };
                                        });
                                        if (otherFeatures.length > 0) {
                                            categories.push({ name: 'Other', items: otherFeatures });
                                        }
                                        const activeCategories = categories.filter(c => c.items.length > 0);
                                        const allNames = activeCategories.map(c => c.name);

                                        const toggleCategory = (name: string) => {
                                            setExpandedCategories(prev => {
                                                const next = new Set(prev);
                                                if (next.has(name)) next.delete(name); else next.add(name);
                                                return next;
                                            });
                                        };

                                        return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {/* Header */}
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Usage by Feature</h3>
                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <button
                                                            onClick={() => {
                                                                if (expandedCategories.size >= allNames.length) setExpandedCategories(new Set());
                                                                else setExpandedCategories(new Set(allNames));
                                                            }}
                                                            style={{
                                                                padding: "4px 10px", borderRadius: "6px",
                                                                border: "1px solid var(--color-border)", background: "var(--color-surface)",
                                                                cursor: "pointer", fontSize: "0.75rem", color: "var(--color-fg-muted)"
                                                            }}
                                                        >
                                                            {expandedCategories.size >= allNames.length ? "Collapse All" : "Expand All"}
                                                        </button>
                                                        <div style={{
                                                            display: "flex", background: "var(--color-border)",
                                                            borderRadius: "8px", padding: "2px", gap: "2px"
                                                        }}>
                                                            {(["avg", "total"] as const).map(mode => (
                                                                <button key={mode} onClick={() => setTokenDisplayMode(mode)} style={{
                                                                    padding: "4px 12px", borderRadius: "6px", border: "none", cursor: "pointer",
                                                                    fontSize: "0.8rem", fontWeight: 600,
                                                                    background: tokenDisplayMode === mode ? "var(--color-surface)" : "transparent",
                                                                    color: tokenDisplayMode === mode ? "var(--color-fg)" : "var(--color-fg-muted)",
                                                                    boxShadow: tokenDisplayMode === mode ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                                                                    transition: "all 0.15s ease"
                                                                }}>
                                                                    {mode === "avg" ? "Avg" : "Total"}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {tokenSummary.length === 0 ? (
                                                    <div style={{
                                                        padding: "40px", textAlign: "center", color: "var(--color-fg-muted)",
                                                        background: "var(--color-surface)", borderRadius: "12px",
                                                        border: "1px solid var(--color-border)"
                                                    }}>
                                                        No token usage data yet.
                                                    </div>
                                                ) : activeCategories.map(({ name, items }) => {
                                                    const isExpanded = expandedCategories.has(name);
                                                    const totalCost = items.reduce((s, i) => s + i.estimated_cost, 0);
                                                    const totalReqs = items.reduce((s, i) => s + i.request_count, 0);
                                                    const bg = CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'];

                                                    return (
                                                        <div key={name} style={{
                                                            borderRadius: "12px", border: "1px solid var(--color-border)",
                                                            overflow: "hidden", background: "var(--color-surface)"
                                                        }}>
                                                            {/* Category header */}
                                                            <button onClick={() => toggleCategory(name)} style={{
                                                                width: "100%", padding: "14px 20px", border: "none", cursor: "pointer",
                                                                background: isExpanded ? bg : "var(--color-bg-sub)",
                                                                color: isExpanded ? "white" : "var(--color-fg)",
                                                                display: "flex", alignItems: "center", gap: "16px",
                                                                transition: "all 0.2s ease"
                                                            }}>
                                                                <div style={{ flex: 1, textAlign: "left" }}>
                                                                    <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{name}</div>
                                                                    <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "2px" }}>
                                                                        {items.length} feature{items.length > 1 ? "s" : ""}
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: "right", minWidth: "90px" }}>
                                                                    <div style={{ fontSize: "0.65rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cost</div>
                                                                    <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>${totalCost.toFixed(4)}</div>
                                                                </div>
                                                                <div style={{ textAlign: "right", minWidth: "70px" }}>
                                                                    <div style={{ fontSize: "0.65rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reqs</div>
                                                                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{totalReqs.toLocaleString()}</div>
                                                                </div>
                                                                <div style={{
                                                                    fontSize: "0.75rem", transition: "transform 0.2s ease",
                                                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                                                    opacity: 0.7
                                                                }}>
                                                                    &#9660;
                                                                </div>
                                                            </button>

                                                            {/* Expanded detail */}
                                                            {isExpanded && (
                                                                <div style={{ borderTop: "1px solid var(--color-border)" }}>
                                                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                                        <thead>
                                                                            <tr style={{ background: "var(--color-bg-sub)" }}>
                                                                                {["Feature", "Reqs", `${tokenDisplayMode === "avg" ? "Avg" : "Total"} In`, `${tokenDisplayMode === "avg" ? "Avg" : "Total"} Out`, "Cost", "Avg/Req"].map((h, i) => (
                                                                                    <th key={h} style={{
                                                                                        padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600,
                                                                                        color: "var(--color-fg-muted)",
                                                                                        textAlign: i === 0 ? "left" : "right"
                                                                                    }}>{h}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {items.map((item, idx) => (
                                                                                <tr key={`${item.feature}-${item.model}`} style={{
                                                                                    borderTop: "1px solid var(--color-border)",
                                                                                    background: idx % 2 === 0 ? "transparent" : "var(--color-bg-sub)"
                                                                                }}>
                                                                                    <td style={{ padding: "10px 12px" }}>
                                                                                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{FEATURE_LABELS[item.feature] || item.feature}</div>
                                                                                        <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)", marginTop: "1px" }}>{item.model}</div>
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                                                                                        {item.request_count.toLocaleString()}
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "#10b981" }}>
                                                                                        {(tokenDisplayMode === "avg" ? item.avg_input_tokens : item.total_input_tokens).toLocaleString()}
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "#f59e0b" }}>
                                                                                        {(tokenDisplayMode === "avg" ? item.avg_output_tokens : item.total_output_tokens).toLocaleString()}
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.9rem", fontWeight: 700, color: "#dc2626" }}>
                                                                                        ${item.estimated_cost.toFixed(4)}
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", fontWeight: 600, color: "#ea580c" }}>
                                                                                        ${item.avg_cost_per_request.toFixed(6)}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* Daily Usage Chart (Simple Bar) */}
                                    <div style={{
                                        background: "var(--color-surface)",
                                        borderRadius: "12px",
                                        border: "1px solid var(--color-border)",
                                        padding: "20px"
                                    }}>
                                        <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600 }}>Daily Token Usage (Last 30 Days)</h3>
                                        {dailyTokenUsage.length === 0 ? (
                                            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                                                No daily data available.
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "150px", paddingTop: "20px" }}>
                                                {dailyTokenUsage.map((day) => {
                                                    const maxTokens = Math.max(...dailyTokenUsage.map(d => d.total_tokens), 1);
                                                    const height = Math.max((day.total_tokens / maxTokens) * 120, 4);
                                                    return (
                                                        <div
                                                            key={day.date}
                                                            style={{
                                                                flex: 1,
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                alignItems: "center",
                                                                gap: "4px"
                                                            }}
                                                            title={`${day.date}: ${day.total_tokens.toLocaleString()} tokens (${day.request_count} requests)`}
                                                        >
                                                            <div style={{
                                                                width: "100%",
                                                                height: `${height}px`,
                                                                background: "linear-gradient(to top, #6366f1, #a5b4fc)",
                                                                borderRadius: "4px 4px 0 0",
                                                                minHeight: "4px"
                                                            }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginTop: "8px",
                                            fontSize: "0.75rem",
                                            color: "var(--color-fg-muted)"
                                        }}>
                                            <span>{dailyTokenUsage[0]?.date || ''}</span>
                                            <span>{dailyTokenUsage[dailyTokenUsage.length - 1]?.date || ''}</span>
                                        </div>
                                    </div>

                                    {/* Recent Logs */}
                                    <div style={{
                                        background: "var(--color-surface)",
                                        borderRadius: "12px",
                                        border: "1px solid var(--color-border)",
                                        overflow: "hidden"
                                    }}>
                                        <div style={{
                                            padding: "16px 20px",
                                            borderBottom: "1px solid var(--color-border)",
                                            background: "var(--color-bg-sub)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}>
                                            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Recent API Calls</h3>
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                                                {tokenLogsCount !== null ? `${tokenLogsCount} total` : ''}
                                            </span>
                                        </div>
                                        {recentTokenLogs.length === 0 ? (
                                            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                                                No API calls logged yet.
                                            </div>
                                        ) : (
                                            <>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                        <tr style={{ background: "var(--color-bg-sub)" }}>
                                                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Time</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Feature</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Model</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Input</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Output</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-fg-muted)" }}>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {recentTokenLogs.map((log, idx) => (
                                                            <tr key={log.id} style={{
                                                                borderTop: "1px solid var(--color-border)",
                                                                background: idx % 2 === 0 ? "transparent" : "var(--color-bg-sub)"
                                                            }}>
                                                                <td style={{ padding: "10px 16px", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                                                                    {new Date(log.created_at || '').toLocaleString('ja-JP')}
                                                                </td>
                                                                <td style={{ padding: "10px 16px" }}>
                                                                    <span style={{
                                                                        background: "#dbeafe", color: "#1e40af",
                                                                        padding: "3px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 500
                                                                    }}>
                                                                        {log.feature}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: "10px 16px", fontSize: "0.85rem" }}>
                                                                    <code style={{ background: "var(--color-bg-sub)", padding: "2px 6px", borderRadius: "4px" }}>
                                                                        {log.model}
                                                                    </code>
                                                                </td>
                                                                <td style={{ padding: "10px 16px", textAlign: "right", fontSize: "0.9rem", color: "#10b981", fontWeight: 500 }}>
                                                                    {log.input_tokens.toLocaleString()}
                                                                </td>
                                                                <td style={{ padding: "10px 16px", textAlign: "right", fontSize: "0.9rem", color: "#f59e0b", fontWeight: 500 }}>
                                                                    {log.output_tokens.toLocaleString()}
                                                                </td>
                                                                <td style={{ padding: "10px 16px", textAlign: "right", fontSize: "0.9rem", fontWeight: 600, color: "#6366f1" }}>
                                                                    {log.total_tokens.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {/* Pagination */}
                                                <div style={{
                                                    padding: "16px",
                                                    borderTop: "1px solid var(--color-border)",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    gap: "12px"
                                                }}>
                                                    <motion.button
                                                        onClick={() => setTokenLogsPage(p => Math.max(1, p - 1))}
                                                        disabled={tokenLogsPage === 1}
                                                        whileHover={{ scale: tokenLogsPage === 1 ? 1 : 1.05 }}
                                                        whileTap={{ scale: tokenLogsPage === 1 ? 1 : 0.95 }}
                                                        style={{
                                                            padding: "8px 16px", border: "1px solid var(--color-border)",
                                                            borderRadius: "8px", background: "var(--color-surface)",
                                                            opacity: tokenLogsPage === 1 ? 0.5 : 1,
                                                            cursor: tokenLogsPage === 1 ? "not-allowed" : "pointer",
                                                            fontWeight: 500, fontSize: "0.9rem"
                                                        }}
                                                    >
                                                        Previous
                                                    </motion.button>
                                                    <span style={{ padding: "8px 12px", fontSize: "0.9rem", fontWeight: 500, color: "var(--color-fg-muted)" }}>
                                                        Page {tokenLogsPage}
                                                    </span>
                                                    <motion.button
                                                        onClick={() => setTokenLogsPage(p => p + 1)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        style={{
                                                            padding: "8px 16px", border: "1px solid var(--color-border)",
                                                            borderRadius: "8px", background: "var(--color-surface)",
                                                            cursor: "pointer", fontWeight: 500, fontSize: "0.9rem"
                                                        }}
                                                    >
                                                        Next
                                                    </motion.button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main >
            {/* Toast */}
            {
                toast && (
                    <motion.div
                        className="admin-toast"
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
                )
            }
            {/* Admin responsive styles */}
            <style>{`
                /* Force scrollable layout on mobile admin pages */
                @media (max-width: 768px) {
                    html, body {
                        overflow: visible !important;
                        height: auto !important;
                        min-height: 100vh !important;
                        overscroll-behavior: auto !important;
                    }
                    .admin-root {
                        display: block !important;
                        overflow: visible !important;
                        height: auto !important;
                        min-height: 100vh !important;
                        position: relative !important;
                    }
                    .admin-main-content {
                        height: auto !important;
                        min-height: 100vh !important;
                        overflow-y: visible !important;
                        position: relative !important;
                    }
                    .admin-header {
                        padding: 64px 16px 12px !important;
                    }
                    .admin-header h1 {
                        font-size: 1.4rem !important;
                    }
                    .admin-content-area {
                        padding: 12px 16px 100px !important;
                    }
                    /* Grid layouts - stack on mobile */
                    .admin-grid-5 {
                        grid-template-columns: 1fr !important;
                    }
                    .admin-grid-4 {
                        grid-template-columns: 1fr !important;
                    }
                    .admin-grid-3 {
                        grid-template-columns: 1fr !important;
                    }
                    .admin-grid-2 {
                        grid-template-columns: 1fr !important;
                    }
                    /* Modal containers - handle small screens */
                    .admin-modal-content {
                        max-height: 85vh !important;
                        overflow-y: auto !important;
                        width: calc(100% - 32px) !important;
                        margin: 16px !important;
                    }
                    /* Toast positioning - center on mobile */
                    .admin-toast {
                        bottom: 16px !important;
                        right: 16px !important;
                        left: 16px !important;
                        font-size: 0.9rem !important;
                        max-width: calc(100% - 32px) !important;
                    }
                }
            `}</style>
        </div >
    );
}
