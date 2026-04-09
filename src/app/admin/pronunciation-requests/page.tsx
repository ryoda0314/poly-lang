"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Mail, MessageSquare, RefreshCw, Globe } from "lucide-react";

interface PronunciationRequest {
    id: string;
    user_id: string;
    user_email: string;
    language_code: string;
    language_name: string;
    message: string | null;
    created_at: string;
}

const LANG_FLAG: Record<string, string> = {
    ja: "🇯🇵", ko: "🇰🇷", zh: "🇨🇳", fr: "🇫🇷", es: "🇪🇸",
    de: "🇩🇪", ru: "🇷🇺", vi: "🇻🇳", fi: "🇫🇮", pt: "🇧🇷",
};

function formatDate(s: string) {
    return new Date(s).toLocaleString("ja-JP", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function PronunciationRequestsPage() {
    const [requests, setRequests] = useState<PronunciationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterLang, setFilterLang] = useState("all");
    const [selected, setSelected] = useState<PronunciationRequest | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/pronunciation-requests");
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests ?? []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    // Stats per language
    const langStats = useMemo(() => {
        const map: Record<string, { name: string; count: number }> = {};
        for (const r of requests) {
            if (!map[r.language_code]) map[r.language_code] = { name: r.language_name, count: 0 };
            map[r.language_code].count++;
        }
        return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
    }, [requests]);

    const filtered = filterLang === "all" ? requests : requests.filter(r => r.language_code === filterLang);

    return (
        <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
            {/* Back */}
            <Link
                href="/admin/dashboard-data"
                style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    marginBottom: "16px", padding: "8px 12px", borderRadius: "8px",
                    color: "var(--color-fg-muted)", textDecoration: "none",
                    fontSize: "0.9rem", fontWeight: 500,
                }}
            >
                <ArrowLeft size={18} />
                管理コンソールに戻る
            </Link>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <h1 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <Mic size={32} />
                    発音練習 言語リクエスト
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                        padding: "6px 14px", borderRadius: "20px",
                        background: "var(--color-accent)", color: "#fff",
                        fontSize: "0.85rem", fontWeight: 600,
                    }}>
                        合計 {requests.length} 件
                    </span>
                    <button
                        onClick={fetchRequests}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "8px 14px", borderRadius: "8px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface)", cursor: "pointer",
                            fontSize: "0.85rem", color: "var(--color-fg-muted)",
                        }}
                    >
                        <RefreshCw size={14} />
                        更新
                    </button>
                </div>
            </div>

            {/* Language summary cards */}
            {langStats.length > 0 && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
                    <button
                        onClick={() => setFilterLang("all")}
                        style={{
                            padding: "8px 16px", borderRadius: "99px",
                            border: `2px solid ${filterLang === "all" ? "var(--color-accent)" : "var(--color-border)"}`,
                            background: filterLang === "all" ? "var(--color-accent)" : "var(--color-surface)",
                            color: filterLang === "all" ? "#fff" : "var(--color-fg-muted)",
                            fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                        }}
                    >
                        すべて ({requests.length})
                    </button>
                    {langStats.map(([code, { name, count }]) => (
                        <button
                            key={code}
                            onClick={() => setFilterLang(code)}
                            style={{
                                padding: "8px 16px", borderRadius: "99px",
                                border: `2px solid ${filterLang === code ? "var(--color-accent)" : "var(--color-border)"}`,
                                background: filterLang === code ? "var(--color-accent)" : "var(--color-surface)",
                                color: filterLang === code ? "#fff" : "var(--color-fg)",
                                fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: "6px",
                            }}
                        >
                            <span>{LANG_FLAG[code] ?? "🌐"}</span>
                            {name} ({count})
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "20px" }}>
                {/* List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--color-fg-muted)" }}>読み込み中...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--color-fg-muted)" }}>
                            <Globe size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
                            <p>リクエストはありません</p>
                        </div>
                    ) : (
                        filtered.map(req => {
                            const isSelected = selected?.id === req.id;
                            return (
                                <div
                                    key={req.id}
                                    onClick={() => setSelected(isSelected ? null : req)}
                                    style={{
                                        padding: "16px",
                                        background: isSelected ? "var(--color-accent)10" : "var(--color-surface)",
                                        borderRadius: "12px",
                                        border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "1.2rem" }}>{LANG_FLAG[req.language_code] ?? "🌐"}</span>
                                            <span style={{
                                                padding: "2px 10px", borderRadius: "99px",
                                                background: "var(--color-accent)18",
                                                color: "var(--color-accent)",
                                                fontSize: "0.8rem", fontWeight: 700,
                                            }}>
                                                {req.language_name} ({req.language_code})
                                            </span>
                                            {req.message && (
                                                <MessageSquare size={14} style={{ color: "var(--color-fg-muted)" }} />
                                            )}
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>
                                            {formatDate(req.created_at)}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>
                                        <Mail size={12} />
                                        {req.user_email}
                                    </div>
                                    {req.message && (
                                        <p style={{
                                            margin: "8px 0 0",
                                            fontSize: "0.85rem",
                                            color: "var(--color-fg)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {req.message}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail panel */}
                {selected && (
                    <div style={{
                        padding: "20px",
                        background: "var(--color-surface)",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        position: "sticky",
                        top: "20px",
                        maxHeight: "calc(100vh - 160px)",
                        overflowY: "auto",
                        alignSelf: "start",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "1rem" }}>詳細</h3>
                            <button
                                onClick={() => setSelected(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-fg-muted)", padding: "4px", fontSize: "1rem" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>言語</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                    {LANG_FLAG[selected.language_code] ?? "🌐"} {selected.language_name}
                                    <span style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)", fontWeight: 400 }}>({selected.language_code})</span>
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>ユーザー</p>
                                <p style={{ margin: 0, fontSize: "0.9rem" }}>{selected.user_email}</p>
                            </div>
                            <div>
                                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>申請日時</p>
                                <p style={{ margin: 0, fontSize: "0.9rem" }}>{formatDate(selected.created_at)}</p>
                            </div>
                            {selected.message ? (
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>メッセージ</p>
                                    <div style={{
                                        padding: "12px",
                                        background: "var(--color-bg)",
                                        borderRadius: "8px",
                                        fontSize: "0.88rem",
                                        lineHeight: 1.7,
                                        whiteSpace: "pre-wrap",
                                        color: "var(--color-fg)",
                                    }}>
                                        {selected.message}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>メッセージ</p>
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-fg-muted)", fontStyle: "italic" }}>なし</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}