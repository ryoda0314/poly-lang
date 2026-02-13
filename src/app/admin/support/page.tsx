"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, AlertTriangle, Mail, Clock, CheckCircle, XCircle, Eye, Filter } from "lucide-react";

interface SupportTicket {
    id: string;
    user_id: string;
    user_email: string;
    type: "contact" | "safety";
    category: string;
    message: string;
    status: "new" | "in_progress" | "resolved" | "closed";
    admin_note: string | null;
    created_at: string;
}

const statusOptions = [
    { value: "new", label: "新規", color: "#3b82f6", icon: Clock },
    { value: "in_progress", label: "対応中", color: "#f59e0b", icon: Eye },
    { value: "resolved", label: "解決済み", color: "#22c55e", icon: CheckCircle },
    { value: "closed", label: "クローズ", color: "#6b7280", icon: XCircle },
];

const categoryLabels: Record<string, string> = {
    // Contact categories
    general: "一般的な質問",
    bug: "不具合の報告",
    feature: "機能のリクエスト",
    account: "アカウントについて",
    payment: "支払いについて",
    other: "その他",
    // Safety categories
    inappropriate: "不適切なAI出力",
    harmful: "有害なコンテンツ",
    incorrect: "著しく不正確な情報",
    privacy: "プライバシーの懸念",
};

export default function SupportAdminPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [adminNote, setAdminNote] = useState("");

    useEffect(() => {
        fetchTickets();
    }, [filterType, filterStatus]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== "all") params.append("type", filterType);
            if (filterStatus !== "all") params.append("status", filterStatus);

            const res = await fetch(`/api/support?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTicketStatus = async (id: string, status: string, note?: string) => {
        try {
            const res = await fetch("/api/support", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status, admin_note: note }),
            });

            if (res.ok) {
                setTickets((prev) =>
                    prev.map((t) =>
                        t.id === id ? { ...t, status: status as any, admin_note: note || t.admin_note } : t
                    )
                );
                if (selectedTicket?.id === id) {
                    setSelectedTicket({ ...selectedTicket, status: status as any, admin_note: note || selectedTicket.admin_note });
                }
            }
        } catch (error) {
            console.error("Failed to update ticket:", error);
        }
    };

    const getStatusConfig = (status: string) => {
        return statusOptions.find((s) => s.value === status) || statusOptions[0];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const newCount = tickets.filter((t) => t.status === "new").length;
    const safetyCount = tickets.filter((t) => t.type === "safety" && t.status === "new").length;

    return (
        <div className="support-admin-page" style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
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
                }}
            >
                <ArrowLeft size={18} />
                ダッシュボードに戻る
            </Link>

            {/* Header */}
            <div className="support-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <h1 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <MessageSquare size={32} />
                    お問い合わせ管理
                </h1>
                <div style={{ display: "flex", gap: "12px" }}>
                    {newCount > 0 && (
                        <span style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            background: "#3b82f6",
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                        }}>
                            新規 {newCount}件
                        </span>
                    )}
                    {safetyCount > 0 && (
                        <span style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            background: "#ef4444",
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}>
                            <AlertTriangle size={14} />
                            安全性報告 {safetyCount}件
                        </span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="support-filters" style={{
                display: "flex",
                gap: "16px",
                marginBottom: "24px",
                padding: "16px",
                background: "var(--color-surface)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                alignItems: "center",
                flexWrap: "wrap",
            }}>
                <Filter size={18} style={{ color: "var(--color-fg-muted)" }} />

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>タイプ:</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">すべて</option>
                        <option value="contact">お問い合わせ</option>
                        <option value="safety">安全性報告</option>
                    </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>ステータス:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">すべて</option>
                        {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={fetchTickets}
                    style={{
                        marginLeft: "auto",
                        padding: "6px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        cursor: "pointer",
                        fontWeight: 500,
                    }}
                >
                    更新
                </button>
            </div>

            {/* Content */}
            <div className="support-content" style={{ display: "grid", gridTemplateColumns: selectedTicket ? "1fr 400px" : "1fr", gap: "24px" }}>
                {/* Ticket List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-fg-muted)" }}>
                            読み込み中...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-fg-muted)" }}>
                            お問い合わせはありません
                        </div>
                    ) : (
                        tickets.map((ticket) => {
                            const statusConfig = getStatusConfig(ticket.status);
                            const StatusIcon = statusConfig.icon;
                            const isSelected = selectedTicket?.id === ticket.id;

                            return (
                                <div
                                    key={ticket.id}
                                    onClick={() => {
                                        setSelectedTicket(ticket);
                                        setAdminNote(ticket.admin_note || "");
                                    }}
                                    style={{
                                        padding: "16px",
                                        background: isSelected ? `${statusConfig.color}10` : "var(--color-surface)",
                                        borderRadius: "12px",
                                        border: `1px solid ${isSelected ? statusConfig.color : "var(--color-border)"}`,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {ticket.type === "safety" && (
                                                <AlertTriangle size={16} style={{ color: "#ef4444" }} />
                                            )}
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                background: ticket.type === "safety" ? "#ef444420" : "#3b82f620",
                                                color: ticket.type === "safety" ? "#ef4444" : "#3b82f6",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                            }}>
                                                {ticket.type === "safety" ? "安全性報告" : "お問い合わせ"}
                                            </span>
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                background: "var(--color-bg)",
                                                fontSize: "0.75rem",
                                                color: "var(--color-fg-muted)",
                                            }}>
                                                {categoryLabels[ticket.category] || ticket.category}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: statusConfig.color }}>
                                            <StatusIcon size={14} />
                                            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{statusConfig.label}</span>
                                        </div>
                                    </div>

                                    <p style={{
                                        margin: "8px 0",
                                        fontSize: "0.9rem",
                                        color: "var(--color-fg)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {ticket.message}
                                    </p>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Mail size={12} />
                                            {ticket.user_email}
                                        </span>
                                        <span>{formatDate(ticket.created_at)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail Panel */}
                {selectedTicket && (
                    <div style={{
                        padding: "20px",
                        background: "var(--color-surface)",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        position: "sticky",
                        top: "20px",
                        maxHeight: "calc(100vh - 200px)",
                        overflowY: "auto",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>詳細</h3>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--color-fg-muted)",
                                    padding: "4px",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Info */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>タイプ</label>
                                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
                                    {selectedTicket.type === "safety" ? "安全性報告" : "お問い合わせ"}
                                </p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>カテゴリ</label>
                                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
                                    {categoryLabels[selectedTicket.category] || selectedTicket.category}
                                </p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>ユーザー</label>
                                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{selectedTicket.user_email}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>受信日時</label>
                                <p style={{ margin: "4px 0 0" }}>{formatDate(selectedTicket.created_at)}</p>
                            </div>
                        </div>

                        {/* Message */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>メッセージ</label>
                            <div style={{
                                marginTop: "8px",
                                padding: "12px",
                                background: "var(--color-bg)",
                                borderRadius: "8px",
                                fontSize: "0.9rem",
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                            }}>
                                {selectedTicket.message}
                            </div>
                        </div>

                        {/* Status Change */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", display: "block", marginBottom: "8px" }}>
                                ステータス変更
                            </label>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {statusOptions.map((s) => {
                                    const isActive = selectedTicket.status === s.value;
                                    return (
                                        <button
                                            key={s.value}
                                            onClick={() => updateTicketStatus(selectedTicket.id, s.value)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                                border: isActive ? `2px solid ${s.color}` : "1px solid var(--color-border)",
                                                background: isActive ? `${s.color}15` : "var(--color-bg)",
                                                color: isActive ? s.color : "var(--color-fg-muted)",
                                                fontWeight: 600,
                                                fontSize: "0.8rem",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Admin Note */}
                        <div>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", display: "block", marginBottom: "8px" }}>
                                管理者メモ
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="内部用のメモ..."
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg)",
                                    resize: "vertical",
                                    fontSize: "0.9rem",
                                }}
                            />
                            <button
                                onClick={() => updateTicketStatus(selectedTicket.id, selectedTicket.status, adminNote)}
                                style={{
                                    marginTop: "8px",
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: "var(--color-primary)",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                }}
                            >
                                メモを保存
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Responsive styles */}
            <style>{`
                @media (max-width: 768px) {
                    .support-admin-page {
                        padding: 16px !important;
                        padding-bottom: 100px !important;
                    }
                    .support-header h1 {
                        font-size: 1.4rem !important;
                    }
                    .support-content {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
