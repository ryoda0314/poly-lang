"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Info, AlertTriangle, CheckCircle, Sparkles, X, ArrowLeft, ChevronDown } from "lucide-react";
import styles from "./page.module.css";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
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

    const dismissAnnouncement = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ announcementId: id }),
            });
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        } catch (e) {
            console.error("Failed to dismiss announcement:", e);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
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
                                    className={`${styles.card} ${styles[config.className]} ${isExpanded ? styles.expanded : ""}`}
                                    onClick={() => toggleExpand(announcement.id)}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardType}>
                                            <Icon size={16} />
                                            <span>{config.label}</span>
                                        </div>
                                        <div className={styles.cardActions}>
                                            <ChevronDown
                                                size={18}
                                                className={`${styles.expandIcon} ${isExpanded ? styles.expandIconRotated : ""}`}
                                            />
                                            <button
                                                className={styles.dismissBtn}
                                                onClick={(e) => dismissAnnouncement(announcement.id, e)}
                                                aria-label="削除"
                                            >
                                                <X size={18} />
                                            </button>
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