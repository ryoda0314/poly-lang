"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import styles from "./AnnouncementBell.module.css";

export default function AnnouncementBell() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        async function fetchCount() {
            try {
                const res = await fetch("/api/announcements");
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.announcements?.length || 0);
                }
            } catch (e) {
                console.error("Failed to fetch announcements:", e);
            }
        }
        fetchCount();
    }, []);

    return (
        <Link href="/app/notifications" className={styles.bellButton}>
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
        </Link>
    );
}