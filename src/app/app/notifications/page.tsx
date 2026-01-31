"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Bell, Info, AlertTriangle, CheckCircle, Sparkles, ArrowLeft, Circle, X, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
    is_read: boolean;
}

export default function NotificationsPage() {
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as any;

    const typeConfig = useMemo(() => ({
        info: { icon: Info, className: "info", label: t.notificationTypeInfo || "お知らせ" },
        warning: { icon: AlertTriangle, className: "warning", label: t.notificationTypeWarning || "注意" },
        success: { icon: CheckCircle, className: "success", label: t.notificationTypeSuccess || "完了" },
        update: { icon: Sparkles, className: "update", label: t.notificationTypeUpdate || "アップデート" },
    }), [t]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const res = await fetch("/api/announcements");
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data.announcements || []);
                }
            } catch (e) {
                console.error("Failed to fetch announcements:", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAnnouncements();
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ announcementId: id }),
            });
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
            );
        } catch (e) {
            console.error("Failed to mark announcement as read:", e);
        }
    }, []);

    const openModal = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        if (!announcement.is_read) {
            markAsRead(announcement.id);
        }
    };

    const closeModal = () => {
        setSelectedAnnouncement(null);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const localeMap: Record<string, string> = {
            ja: "ja-JP", ko: "ko-KR", en: "en-US", zh: "zh-CN",
            fr: "fr-FR", es: "es-ES", de: "de-DE", ru: "ru-RU", vi: "vi-VN"
        };
        return date.toLocaleDateString(localeMap[nativeLanguage] || "ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className={styles.container}>
            <Link href="/app/dashboard" className={styles.backButton}>
                <ArrowLeft size={18} />
                {t.back || "戻る"}
            </Link>

            <header className={styles.header}>
                <Bell size={28} className={styles.headerIcon} />
                <h1 className={styles.title}>{t.notifications || "お知らせ"}</h1>
            </header>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>{t.loading || "読み込み中..."}</div>
                ) : announcements.length === 0 ? (
                    <div className={styles.empty}>
                        <Bell size={48} className={styles.emptyIcon} />
                        <p>{t.noNotifications || "お知らせはありません"}</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {announcements.map((announcement) => {
                            const config = typeConfig[announcement.type] || typeConfig.info;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={announcement.id}
                                    className={`${styles.card} ${styles[config.className]} ${announcement.is_read ? styles.read : styles.unread}`}
                                    onClick={() => openModal(announcement)}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardType}>
                                            <Icon size={16} />
                                            <span>{config.label}</span>
                                        </div>
                                        <div className={styles.cardActions}>
                                            {!announcement.is_read && (
                                                <span className={styles.unreadBadge}>
                                                    <Circle size={8} fill="currentColor" />
                                                    {t.unread || "未読"}
                                                </span>
                                            )}
                                            <ChevronRight size={18} className={styles.chevronIcon} />
                                        </div>
                                    </div>
                                    <h2 className={styles.cardTitle}>{announcement.title}</h2>
                                    <div className={styles.cardDate}>
                                        {formatDate(announcement.created_at)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedAnnouncement && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={closeModal}>
                            <X size={24} />
                        </button>
                        <div className={styles.modalHeader}>
                            {(() => {
                                const config = typeConfig[selectedAnnouncement.type] || typeConfig.info;
                                const Icon = config.icon;
                                return (
                                    <div className={`${styles.modalType} ${styles[config.className]}`}>
                                        <Icon size={20} />
                                        <span>{config.label}</span>
                                    </div>
                                );
                            })()}
                            <div className={styles.modalDate}>
                                {formatDate(selectedAnnouncement.created_at)}
                            </div>
                        </div>
                        <h2 className={styles.modalTitle}>{selectedAnnouncement.title}</h2>
                        <p className={styles.modalContent}>{selectedAnnouncement.content}</p>
                        <button className={styles.modalButton} onClick={closeModal}>
                            {t.close || "閉じる"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}