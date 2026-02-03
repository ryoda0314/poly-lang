"use client";

import React from "react";
import { Settings, MessageSquareText } from "lucide-react";
import { useChatStore, SidebarTab } from "@/store/chat-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import ChatSettings from "./ChatSettings";
import ChatCorrections from "./ChatCorrections";
import styles from "./ChatSidebar.module.css";
import clsx from "clsx";

interface TabProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: number;
}

function Tab({ icon, label, active, onClick, badge }: TabProps) {
    return (
        <button
            className={clsx(styles.tab, active && styles.tabActive)}
            onClick={onClick}
        >
            {icon}
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className={styles.badge}>{badge}</span>
            )}
        </button>
    );
}

export default function ChatSidebar() {
    const { sidebarTab, setSidebarTab, corrections } = useChatStore();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const tabs: { id: SidebarTab; icon: React.ReactNode; labelKey: string; badge?: number }[] = [
        { id: 'settings', icon: <Settings size={18} />, labelKey: 'chatTabSettings' },
        { id: 'corrections', icon: <MessageSquareText size={18} />, labelKey: 'chatTabCorrections', badge: corrections.length },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.tabHeader}>
                {tabs.map((tab) => (
                    <Tab
                        key={tab.id}
                        icon={tab.icon}
                        label={(t as Record<string, string>)[tab.labelKey] || (tab.id === 'settings' ? '設定' : '添削')}
                        active={sidebarTab === tab.id}
                        onClick={() => setSidebarTab(tab.id)}
                        badge={tab.badge}
                    />
                ))}
            </div>
            <div className={styles.content}>
                {sidebarTab === 'settings' && <ChatSettings />}
                {sidebarTab === 'corrections' && <ChatCorrections />}
            </div>
        </div>
    );
}
