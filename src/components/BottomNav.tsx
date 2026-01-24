"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Brain, Clock, Settings, BookOpen, FolderHeart } from "lucide-react";
import clsx from "clsx";
import styles from "./BottomNav.module.css";
import { useSettingsStore } from "@/store/settings-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

export default function BottomNav() {
    const pathname = usePathname();
    const { defaultPhraseView } = useSettingsStore();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const phraseViewItem = defaultPhraseView === 'my-phrases'
        ? { label: (t as any).myPhrases || "保存済み", href: "/app/my-phrases", icon: FolderHeart }
        : { label: t.history, href: "/app/history", icon: Clock };

    const NAV_ITEMS = [
        { label: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard },
        { label: t.phrases, href: "/app/phrases", icon: Map },
        { label: t.corrections, href: "/app/corrections", icon: BookOpen },
        { label: t.awareness, href: "/app/awareness", icon: Brain },
        phraseViewItem,
    ];

    return (
        <nav className={styles.bottomNav}>
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(styles.navItem, isActive && styles.navItemActive)}
                    >
                        <item.icon size={24} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
