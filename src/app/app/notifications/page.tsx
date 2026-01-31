"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, Info, AlertTriangle, CheckCircle, Sparkles, ArrowLeft, ChevronDown, Circle } from "lucide-react";
import styles from "./page.module.css";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
    is_read: boolean;
}

const typeConfig = {
    info: { icon: Info, className: "info", label: "お知らせ" },
    warning: { icon: AlertTriangle, className: "warning", label: "注意" },
    success: { icon: CheckCircle, className: "success", label: "完了" },
    update: { icon: Sparkles, className: "update", label: "アップデート" },
};

export default function NotificationsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    const toggleExpand = (id: string, isRead: boolean) => {
        const newExpandedId = expandedId === id ? null : id;
        setExpandedId(newExpandedId);

        // Mark as read when expanded and not already read
        if (newExpandedId === id && !isRead) {
            markAsRead(id);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className={styles.container}>
            <Link href="/app/dashboard" className={styles.backButton}>
                <ArrowLeft size={18} />
                戻る
            </Link>

            <header className={styles.header}>
                <Bell size={28} className={styles.headerIcon} />
                <h1 className={styles.title}>お知らせ</h1>
            </header>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>読み込み中...</div>
                ) : announcements.length === 0 ? (
                    <div className={styles.empty}>
                        <Bell size={48} className={styles.emptyIcon} />
                        <p>お知らせはありません</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {announcements.map((announcement) => {
                            const config = typeConfig[announcement.type] || typeConfig.info;
                            const Icon = config.icon;
                            const isExpanded = expandedId === announcement.id;

                            return (
                                <div
                                    key={announcement.id}
                                    className={`${styles.card} ${styles[config.className]} ${isExpanded ? styles.expanded : ""} ${announcement.is_read ? styles.read : styles.unread}`}
                                    onClick={() => toggleExpand(announcement.id, announcement.is_read)}
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
                                                    未読
                                                </span>
                                            )}
                                            <ChevronDown
                                                size={18}
                                                className={`${styles.expandIcon} ${isExpanded ? styles.expandIconRotated : ""}`}
                                            />
                                        </div>
                                    </div>
                                    <h2 className={styles.cardTitle}>{announcement.title}</h2>
                                    <p className={`${styles.cardBody} ${isExpanded ? styles.cardBodyExpanded : ""}`}>
                                        {announcement.content}
                                    </p>
                                    <div className={styles.cardDate}>
                                        {formatDate(announcement.created_at)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}