"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Brain, Clock, Settings, BookOpen } from "lucide-react";
import clsx from "clsx";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
    { label: "Home", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Phrases", href: "/app/phrases", icon: Map },
    { label: "Corrections", href: "/app/corrections", icon: BookOpen },
    { label: "Awareness", href: "/app/awareness", icon: Brain },
    { label: "History", href: "/app/history", icon: Clock },
];

export default function BottomNav() {
    const pathname = usePathname();

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
