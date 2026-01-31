"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Check, Calendar, TrendingUp, RefreshCw, Clock, Edit3 } from "lucide-react";
import { Database } from "@/types/supabase";
import { useAwarenessStore } from "@/store/awareness-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

type Memo = Database['public']['Tables']['awareness_memos']['Row'];

const CONFIDENCE_COLORS: Record<string, string> = {
    high: "var(--color-success)",
    medium: "var(--color-warning)",
    low: "var(--color-destructive)",
};

const CONFIDENCE_OPTIONS: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

const STATUS_LABELS: Record<string, { ja: string; en: string; color: string }> = {
    unverified: { ja: "未確認", en: "Unverified", color: "var(--color-fg-muted)" },
    attempted: { ja: "試行済み", en: "Attempted", color: "var(--color-warning)" },
    verified: { ja: "確認済み", en: "Verified", color: "var(--color-success)" },
};

interface MemoDetailModalProps {
    memo: Memo;
    isOpen: boolean;
    onClose: () => void;
}

export function MemoDetailModal({ memo, isOpen, onClose }: MemoDetailModalProps) {
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as Record<string, string>;
    const locale = nativeLanguage;
    const { updateMemo, deleteMemo, markVerified } = useAwarenessStore();

    const [isEditing, setIsEditing] = useState(false);
    const [memoText, setMemoText] = useState(memo.memo || "");
    const [confidence, setConfidence] = useState<"low" | "medium" | "high">(
        (memo.confidence as "low" | "medium" | "high") || "low"
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset state when memo changes
    useEffect(() => {
        setMemoText(memo.memo || "");
        setConfidence((memo.confidence as "low" | "medium" | "high") || "low");
        setIsEditing(false);
        setShowDeleteConfirm(false);
    }, [memo.id, memo.memo, memo.confidence]);

    if (!isOpen) return null;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatRelativeDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            const pastDays = Math.abs(diffDays);
            return locale === "ja" ? `${pastDays}日前` : `${pastDays} days ago`;
        } else if (diffDays === 0) {
            return locale === "ja" ? "今日" : "Today";
        } else if (diffDays === 1) {
            return locale === "ja" ? "明日" : "Tomorrow";
        } else {
            return locale === "ja" ? `${diffDays}日後` : `In ${diffDays} days`;
        }
    };

    const handleSave = async () => {
        await updateMemo(memo.id, {
            memo: memoText || null,
            confidence: confidence
        });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        await deleteMemo(memo.id);
        onClose();
    };

    const handleMarkVerified = async () => {
        await markVerified(memo.id);
    };

    const statusInfo = STATUS_LABELS[memo.status] || STATUS_LABELS.unverified;
    const strengthPercent = (memo.strength / 5) * 100;

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                animation: "memoModalFadeIn 0.15s ease-out",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "420px",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.2))",
                    animation: "memoModalScaleIn 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "20px",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: "var(--color-fg)",
                        }}>
                            {memo.token_text}
                        </h2>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: "0.75rem",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                background: `color-mix(in srgb, ${statusInfo.color} 15%, transparent)`,
                                color: statusInfo.color,
                                fontWeight: 600,
                            }}>
                                {locale === "ja" ? statusInfo.ja : statusInfo.en}
                            </span>
                            <span style={{
                                fontSize: "0.75rem",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                background: `color-mix(in srgb, ${CONFIDENCE_COLORS[confidence]} 15%, transparent)`,
                                color: CONFIDENCE_COLORS[confidence],
                                fontWeight: 600,
                                textTransform: "uppercase",
                            }}>
                                {confidence}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "var(--color-fg-muted)",
                            borderRadius: "8px",
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: "20px",
                    overflowY: "auto",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}>
                    {/* Memo Text Section */}
                    <div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                        }}>
                            <label style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--color-fg-muted)",
                                textTransform: "uppercase",
                            }}>
                                {t.memoDetailMemoLabel || "メモ"}
                            </label>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--color-accent)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    <Edit3 size={14} />
                                    {t.memoDetailEdit || "編集"}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <textarea
                                value={memoText}
                                onChange={(e) => setMemoText(e.target.value)}
                                placeholder={t.memoDetailMemoPlaceholder || "メモを入力..."}
                                style={{
                                    width: "100%",
                                    minHeight: "80px",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-sub)",
                                    color: "var(--color-fg)",
                                    fontSize: "0.95rem",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                }}
                            />
                        ) : (
                            <div style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "var(--color-bg-sub)",
                                color: memoText ? "var(--color-fg)" : "var(--color-fg-muted)",
                                fontSize: "0.95rem",
                                minHeight: "60px",
                                lineHeight: 1.5,
                            }}>
                                {memoText || (t.memoDetailNoMemo || "メモなし")}
                            </div>
                        )}
                    </div>

                    {/* Confidence Section */}
                    <div>
                        <label style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-fg-muted)",
                            textTransform: "uppercase",
                            display: "block",
                            marginBottom: "8px",
                        }}>
                            {t.memoDetailConfidence || "確信度"}
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {CONFIDENCE_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        setConfidence(opt);
                                        if (!isEditing) {
                                            updateMemo(memo.id, { confidence: opt });
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "10px 16px",
                                        borderRadius: "8px",
                                        border: confidence === opt
                                            ? `2px solid ${CONFIDENCE_COLORS[opt]}`
                                            : "1px solid var(--color-border)",
                                        background: confidence === opt
                                            ? `color-mix(in srgb, ${CONFIDENCE_COLORS[opt]} 10%, transparent)`
                                            : "transparent",
                                        color: confidence === opt ? CONFIDENCE_COLORS[opt] : "var(--color-fg-muted)",
                                        fontWeight: confidence === opt ? 600 : 400,
                                        fontSize: "0.85rem",
                                        cursor: "pointer",
                                        textTransform: "capitalize",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Learning Stats */}
                    <div>
                        <label style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-fg-muted)",
                            textTransform: "uppercase",
                            display: "block",
                            marginBottom: "12px",
                        }}>
                            {t.memoDetailLearningHistory || "学習履歴"}
                        </label>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                        }}>
                            {/* Strength */}
                            <div style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "var(--color-bg-sub)",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "8px",
                                }}>
                                    <TrendingUp size={14} color="var(--color-accent)" />
                                    <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)" }}>
                                        {t.memoDetailStrength || "定着度"}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    color: "var(--color-fg)",
                                }}>
                                    {memo.strength}/5
                                </div>
                                <div style={{
                                    marginTop: "6px",
                                    height: "4px",
                                    background: "var(--color-border)",
                                    borderRadius: "2px",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: `${strengthPercent}%`,
                                        height: "100%",
                                        background: "var(--color-accent)",
                                        transition: "width 0.3s ease",
                                    }} />
                                </div>
                            </div>

                            {/* Usage Count */}
                            <div style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "var(--color-bg-sub)",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "8px",
                                }}>
                                    <RefreshCw size={14} color="var(--color-success)" />
                                    <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)" }}>
                                        {t.memoDetailUsageCount || "使用回数"}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    color: "var(--color-fg)",
                                }}>
                                    {memo.usage_count}
                                </div>
                            </div>

                            {/* Created At */}
                            <div style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "var(--color-bg-sub)",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "8px",
                                }}>
                                    <Calendar size={14} color="var(--color-info)" />
                                    <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)" }}>
                                        {t.memoDetailCreatedAt || "作成日"}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    color: "var(--color-fg)",
                                }}>
                                    {formatDate(memo.created_at)}
                                </div>
                            </div>

                            {/* Next Review */}
                            <div style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "var(--color-bg-sub)",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "8px",
                                }}>
                                    <Clock size={14} color="var(--color-warning)" />
                                    <span style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)" }}>
                                        {t.memoDetailNextReview || "次の復習"}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    color: "var(--color-fg)",
                                }}>
                                    {memo.next_review_at ? formatRelativeDate(memo.next_review_at) : "-"}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(memo.last_reviewed_at || memo.verified_at || memo.attempted_at) && (
                            <div style={{
                                marginTop: "12px",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "var(--color-bg-sub)",
                                fontSize: "0.8rem",
                                color: "var(--color-fg-muted)",
                            }}>
                                {memo.last_reviewed_at && (
                                    <div style={{ marginBottom: "4px" }}>
                                        {t.memoDetailLastReviewed || "最終復習"}: {formatDate(memo.last_reviewed_at)}
                                    </div>
                                )}
                                {memo.verified_at && (
                                    <div style={{ marginBottom: "4px" }}>
                                        {t.memoDetailVerifiedAt || "確認日"}: {formatDate(memo.verified_at)}
                                    </div>
                                )}
                                {memo.attempted_at && (
                                    <div>
                                        {t.memoDetailAttemptedAt || "試行日"}: {formatDate(memo.attempted_at)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: "16px 20px",
                    borderTop: "1px solid var(--color-border)",
                    display: "flex",
                    gap: "12px",
                }}>
                    {showDeleteConfirm ? (
                        <>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "transparent",
                                    color: "var(--color-fg)",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                }}
                            >
                                {t.cancel || "キャンセル"}
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "var(--color-destructive)",
                                    color: "#fff",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                }}
                            >
                                {t.memoDetailConfirmDelete || "削除する"}
                            </button>
                        </>
                    ) : isEditing ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setMemoText(memo.memo || "");
                                    setConfidence((memo.confidence as "low" | "medium" | "high") || "low");
                                }}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "transparent",
                                    color: "var(--color-fg)",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                }}
                            >
                                {t.cancel || "キャンセル"}
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "var(--color-accent)",
                                    color: "#fff",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                }}
                            >
                                <Check size={16} />
                                {t.memoDetailSave || "保存"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    background: "transparent",
                                    color: "var(--color-destructive)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "0.9rem",
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                            {memo.status !== "verified" && (
                                <button
                                    onClick={handleMarkVerified}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "var(--color-success)",
                                        color: "#fff",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: "0.9rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <Check size={16} />
                                    {t.memoDetailMarkVerified || "確認済みにする"}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes memoModalFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes memoModalScaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
}
