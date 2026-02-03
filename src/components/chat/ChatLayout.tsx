"use client";

import React from "react";
import { Settings2, X } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import styles from "./ChatLayout.module.css";
import clsx from "clsx";

interface ChatLayoutProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export default function ChatLayout({ sidebar, children }: ChatLayoutProps) {
    const { isSidebarOpen, setSidebarOpen } = useChatStore();

    return (
        <div className={styles.container}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    styles.sidebarArea,
                    isSidebarOpen && styles.sidebarMobileOpen
                )}
            >
                <div className={styles.sidebarHeader}>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.sidebarContent}>{sidebar}</div>
            </aside>

            {/* Main Chat Area */}
            <main className={styles.mainArea}>{children}</main>

            {/* Mobile Toggle Button */}
            <button
                className={styles.mobileToggleBtn}
                onClick={() => setSidebarOpen(true)}
                aria-label="Open settings"
            >
                <Settings2 size={24} />
            </button>
        </div>
    );
}
