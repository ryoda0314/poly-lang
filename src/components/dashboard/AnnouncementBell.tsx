"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, Info, AlertTriangle, CheckCircle, Sparkles, X } from "lucide-react";
import styles from "./AnnouncementBell.module.css";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
}

const typeConfig = {
    info: { icon: Info, className: "info" },
    warning: { icon: AlertTriangle, className: "warning" },
    success: { icon: CheckCircle, className: "success" },
    update: { icon: Sparkles, className: "update" },
};

export default function AnnouncementBell() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    const unreadCount = announcements.length;

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={styles.bellButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Announcements"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <span className={styles.dropdownTitle}>お知らせ</span>
                    </div>

                    <div className={styles.dropdownContent}>
                        {isLoading ? (
                            <div className={styles.emptyState}>読み込み中...</div>
                        ) : announcements.length === 0 ? (
                            <div className={styles.emptyState}>お知らせはありません</div>
                        ) : (
                            announcements.map((announcement) => {
                                const config = typeConfig[announcement.type] || typeConfig.info;
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={announcement.id}
                                        className={`${styles.item} ${styles[config.className]}`}
                                    >
                                        <div className={styles.itemIcon}>
                                            <Icon size={16} />
                                        </div>
                                        <div className={styles.itemContent}>
                                            <div className={styles.itemTitle}>{announcement.title}</div>
                                            <div className={styles.itemBody}>{announcement.content}</div>
                                        </div>
                                        <button
                                            className={styles.dismissBtn}
                                            onClick={(e) => dismissAnnouncement(announcement.id, e)}
                                            aria-label="Dismiss"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}