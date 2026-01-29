"use client";

import React, { useEffect, useState } from "react";
import { Info, AlertTriangle, CheckCircle, Sparkles, X } from "lucide-react";
import styles from "./AnnouncementCard.module.css";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
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

    const dismissAnnouncement = async (id: string) => {
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

    if (isLoading || announcements.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            {announcements.map((announcement) => {
                const config = typeConfig[announcement.type] || typeConfig.info;
                const Icon = config.icon;

                return (
                    <div
                        key={announcement.id}
                        className={`${styles.card} ${styles[config.className]}`}
                    >
                        <div className={styles.iconWrapper}>
                            <Icon size={18} />
                        </div>
                        <div className={styles.content}>
                            <div className={styles.title}>{announcement.title}</div>
                            <div className={styles.body}>{announcement.content}</div>
                        </div>
                        <button
                            className={styles.dismissBtn}
                            onClick={() => dismissAnnouncement(announcement.id)}
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
