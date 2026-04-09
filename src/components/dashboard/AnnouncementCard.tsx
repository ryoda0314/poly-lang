"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Info, AlertTriangle, CheckCircle, Sparkles, Circle } from "lucide-react";
import styles from "./AnnouncementCard.module.css";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
    is_read: boolean;
}

interface AnnouncementCardProps {
    lang?: string;
}

const typeConfig = {
    info: { icon: Info, className: "info" },
    warning: { icon: AlertTriangle, className: "warning" },
    success: { icon: CheckCircle, className: "success" },
    update: { icon: Sparkles, className: "update" },
};

export default function AnnouncementCard({ lang = "ja" }: AnnouncementCardProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const res = await fetch("/api/announcements");
                if (res.ok) {
                    const data = await res.json();
                    // Show only unread announcements on dashboard
                    const unreadAnnouncements = (data.announcements || []).filter(
                        (a: Announcement) => !a.is_read
                    );
                    setAnnouncements(unreadAnnouncements);
                }
            } catch (e) {
                console.error("Failed to fetch announcements:", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAnnouncements();
    }, []);

    if (isLoading || announcements.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            {announcements.map((announcement) => {
                const config = typeConfig[announcement.type] || typeConfig.info;
                const Icon = config.icon;

                return (
                    <Link
                        key={announcement.id}
                        href="/app/notifications"
                        className={`${styles.card} ${styles[config.className]}`}
                    >
                        <div className={styles.iconWrapper}>
                            <Icon size={18} />
                        </div>
                        <div className={styles.content}>
                            <div className={styles.title}>{announcement.title}</div>
                            <div className={styles.body}>{announcement.content}</div>
                        </div>
                        <div className={styles.unreadIndicator}>
                            <Circle size={8} fill="currentColor" />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
