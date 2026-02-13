"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X, Save, Megaphone, Info, AlertTriangle, CheckCircle, Sparkles, Trash2, Edit2, Calendar, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supa-client";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    is_active: boolean;
    starts_at: string;
    ends_at: string | null;
    created_at: string;
    target_audience: "all" | "new_users" | "existing_users";
    new_user_days: number;
}

const typeOptions = [
    { value: "info", label: "お知らせ", icon: Info, color: "#3b82f6" },
    { value: "warning", label: "注意", icon: AlertTriangle, color: "#f59e0b" },
    { value: "success", label: "完了", icon: CheckCircle, color: "#22c55e" },
    { value: "update", label: "アップデート", icon: Sparkles, color: "#8b5cf6" },
];

const audienceOptions = [
    { value: "all", label: "全員", description: "全てのユーザーに表示" },
    { value: "new_users", label: "新規ユーザー", description: "登録から指定日数以内のユーザーに表示" },
    { value: "existing_users", label: "既存ユーザー", description: "登録から指定日数以上経過したユーザーに表示" },
];

export default function AnnouncementsAdminPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"add" | "manage">("add");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "info" as Announcement["type"],
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: "",
        target_audience: "all" as Announcement["target_audience"],
        new_user_days: 7,
    });

    const supabase = createClient();

    // Fetch announcements
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        const { data, error } = await (supabase as any)
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setAnnouncements(data);
        }
        setIsLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            title: formData.title,
            content: formData.content,
            type: formData.type,
            starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
            ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
            is_active: true,
            target_audience: formData.target_audience,
            new_user_days: formData.new_user_days,
        };

        const { error } = await (supabase as any).from("announcements").insert(payload);

        if (error) {
            alert("エラーが発生しました: " + error.message);
            return;
        }

        setFormData({
            title: "",
            content: "",
            type: "info",
            starts_at: new Date().toISOString().slice(0, 16),
            ends_at: "",
            target_audience: "all",
            new_user_days: 7,
        });

        alert("お知らせを作成しました！");
        fetchAnnouncements();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("このお知らせを削除しますか？")) return;

        const { error } = await (supabase as any).from("announcements").delete().eq("id", id);

        if (!error) {
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await (supabase as any)
            .from("announcements")
            .update({ is_active: !currentStatus })
            .eq("id", id);

        if (!error) {
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === id ? { ...a, is_active: !currentStatus } : a))
            );
        }
    };

    const handleUpdate = async (id: string, field: string, value: any) => {
        const { error } = await (supabase as any)
            .from("announcements")
            .update({ [field]: value })
            .eq("id", id);

        if (!error) {
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
            );
        }
    };

    const getTypeConfig = (type: string) => {
        return typeOptions.find((t) => t.value === type) || typeOptions[0];
    };

    return (
        <div className="announcements-admin-page" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
            {/* Back Button */}
            <Link
                href="/app/dashboard"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "16px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    color: "var(--color-fg-muted)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover, rgba(0,0,0,0.05))")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
                <ArrowLeft size={18} />
                ダッシュボードに戻る
            </Link>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <Megaphone size={32} />
                    お知らせ管理
                </h1>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "32px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
                <button
                    onClick={() => setActiveTab("add")}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: activeTab === "add" ? "var(--color-primary)" : "transparent",
                        color: activeTab === "add" ? "white" : "var(--color-fg-muted)",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Plus size={18} /> 新規作成
                </button>
                <button
                    onClick={() => setActiveTab("manage")}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: activeTab === "manage" ? "var(--color-primary)" : "transparent",
                        color: activeTab === "manage" ? "white" : "var(--color-fg-muted)",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Edit2 size={18} /> 管理 ({announcements.length})
                </button>
            </div>

            {activeTab === "add" && (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: "var(--color-surface)",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    {/* Type Selection */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>タイプ</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {typeOptions.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = formData.type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: opt.value as any })}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "8px",
                                            border: isSelected ? `2px solid ${opt.color}` : "1px solid var(--color-border)",
                                            background: isSelected ? `${opt.color}15` : "var(--color-bg)",
                                            color: isSelected ? opt.color : "var(--color-fg-muted)",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <Icon size={16} />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Target Audience Selection */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>対象ユーザー</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {audienceOptions.map((opt) => {
                                const isSelected = formData.target_audience === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, target_audience: opt.value as any })}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "8px",
                                            border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                                            background: isSelected ? "var(--color-primary)15" : "var(--color-bg)",
                                            color: isSelected ? "var(--color-primary)" : "var(--color-fg-muted)",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>
                            {audienceOptions.find(o => o.value === formData.target_audience)?.description}
                        </span>
                    </div>

                    {/* New User Days (only shown when target_audience is not "all") */}
                    {formData.target_audience !== "all" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                新規ユーザーの定義（登録からの日数）
                            </label>
                            <input
                                type="number"
                                name="new_user_days"
                                value={formData.new_user_days}
                                onChange={handleChange}
                                min={1}
                                max={365}
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg)",
                                    width: "120px",
                                }}
                            />
                            <span style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>
                                {formData.target_audience === "new_users"
                                    ? `登録から${formData.new_user_days}日以内のユーザーに表示されます`
                                    : `登録から${formData.new_user_days}日以上経過したユーザーに表示されます`}
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>タイトル</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="お知らせのタイトル"
                            required
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-bg)",
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>内容</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="お知らせの詳細内容..."
                            required
                            rows={4}
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-bg)",
                                resize: "vertical",
                            }}
                        />
                    </div>

                    {/* Date Range */}
                    <div className="announcements-date-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                <Calendar size={14} style={{ marginRight: "4px" }} />
                                開始日時
                            </label>
                            <input
                                type="datetime-local"
                                name="starts_at"
                                value={formData.starts_at}
                                onChange={handleChange}
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg)",
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                <Calendar size={14} style={{ marginRight: "4px" }} />
                                終了日時（任意）
                            </label>
                            <input
                                type="datetime-local"
                                name="ends_at"
                                value={formData.ends_at}
                                onChange={handleChange}
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg)",
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: "8px",
                            padding: "14px",
                            background: "var(--color-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        <Save size={20} />
                        お知らせを作成
                    </button>
                </form>
            )}

            {activeTab === "manage" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-fg-muted)" }}>
                            読み込み中...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-fg-muted)" }}>
                            お知らせがありません
                        </div>
                    ) : (
                        announcements.map((a) => {
                            const typeConfig = getTypeConfig(a.type);
                            const Icon = typeConfig.icon;
                            const isEditing = editingId === a.id;

                            return (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: "16px",
                                        background: a.is_active ? "var(--color-surface)" : "var(--color-bg)",
                                        borderRadius: "12px",
                                        border: `1px solid ${a.is_active ? typeConfig.color + "40" : "var(--color-border)"}`,
                                        opacity: a.is_active ? 1 : 0.6,
                                    }}
                                >
                                    <div className="announcement-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <Icon size={18} style={{ color: typeConfig.color }} />
                                            {isEditing ? (
                                                <input
                                                    value={a.title}
                                                    onChange={(e) => handleUpdate(a.id, "title", e.target.value)}
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: "1rem",
                                                        background: "var(--color-bg)",
                                                        border: "1px solid var(--color-border)",
                                                        borderRadius: "4px",
                                                        padding: "4px 8px",
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 700, fontSize: "1rem" }}>{a.title}</span>
                                            )}
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    background: a.is_active ? "#22c55e20" : "#ef444420",
                                                    color: a.is_active ? "#22c55e" : "#ef4444",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {a.is_active ? "公開中" : "非公開"}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    background: a.target_audience === "all" ? "#6b728020" : a.target_audience === "new_users" ? "#3b82f620" : "#f59e0b20",
                                                    color: a.target_audience === "all" ? "#6b7280" : a.target_audience === "new_users" ? "#3b82f6" : "#f59e0b",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {a.target_audience === "all" ? "全員" : a.target_audience === "new_users" ? `新規(${a.new_user_days}日)` : `既存(${a.new_user_days}日+)`}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => handleToggleActive(a.id, a.is_active)}
                                                style={{
                                                    padding: "4px 12px",
                                                    borderRadius: "6px",
                                                    border: "1px solid var(--color-border)",
                                                    background: "var(--color-bg)",
                                                    cursor: "pointer",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {a.is_active ? "非公開にする" : "公開する"}
                                            </button>
                                            <button
                                                onClick={() => setEditingId(isEditing ? null : a.id)}
                                                style={{
                                                    padding: "4px 12px",
                                                    borderRadius: "6px",
                                                    border: "none",
                                                    background: isEditing ? "var(--color-primary)" : "transparent",
                                                    color: isEditing ? "white" : "var(--color-fg-muted)",
                                                    cursor: "pointer",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {isEditing ? "完了" : "編集"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "#ef4444",
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <textarea
                                            value={a.content}
                                            onChange={(e) => handleUpdate(a.id, "content", e.target.value)}
                                            rows={3}
                                            style={{
                                                width: "100%",
                                                fontSize: "0.9rem",
                                                background: "var(--color-bg)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "4px",
                                                padding: "8px",
                                                resize: "vertical",
                                            }}
                                        />
                                    ) : (
                                        <p style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", margin: "8px 0" }}>
                                            {a.content}
                                        </p>
                                    )}

                                    <div style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", marginTop: "8px" }}>
                                        作成: {new Date(a.created_at).toLocaleString("ja-JP")}
                                        {a.ends_at && ` | 終了: ${new Date(a.ends_at).toLocaleString("ja-JP")}`}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            {/* Responsive styles */}
            <style>{`
                @media (max-width: 768px) {
                    .announcements-admin-page {
                        padding: 16px !important;
                        padding-bottom: 100px !important;
                    }
                    .announcements-admin-page h1 {
                        font-size: 1.4rem !important;
                    }
                    .announcements-date-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .announcement-card-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                }
            `}</style>
        </div>
    );
}