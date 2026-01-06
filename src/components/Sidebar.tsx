"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, BookOpen, Clock, Settings, LogOut, LayoutDashboard, Sparkles, Shield, Brain, Database, Plus } from "lucide-react";
import clsx from "clsx";
import styles from "./Sidebar.module.css";
import { useAppStore } from "@/store/app-context";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Phrases", href: "/app/phrases", icon: Map },
    { label: "Corrections", href: "/app/corrections", icon: BookOpen },
    { label: "Awareness", href: "/app/awareness", icon: Brain },
    { label: "History", href: "/app/history", icon: Clock },
    { label: "Settings", href: "/app/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, profile } = useAppStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        console.log("handleLogout called");
        await logout();
        console.log("logout completed");
    };

    // Filter or extend nav items based on role
    const navItems = [...NAV_ITEMS];
    if (profile?.role === 'admin') {
        navItems.push({ label: "Admin", href: "/admin/dashboard-data", icon: Shield });
        navItems.push({ label: "Manage Slang", href: "/admin/slang", icon: Database });
    }

    const extraItems = [
        { label: "Slang Database", href: "/app/slang", icon: Sparkles },
    ];

    return (
        <>
            {/* Hamburger Button (Mobile Only) */}
            <button
                className={styles.hamburger}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Menu"
            >
                <div className={clsx(styles.hamburgerLine, isMobileOpen && styles.hamburgerActive)} />
                <div className={clsx(styles.hamburgerLine, isMobileOpen && styles.hamburgerActive)} />
                <div className={clsx(styles.hamburgerLine, isMobileOpen && styles.hamburgerActive)} />
            </button>

            {/* Overlay */}
            <div
                className={clsx(styles.overlay, isMobileOpen && styles.overlayVisible)}
                onClick={() => setIsMobileOpen(false)}
            />

            <aside className={clsx(styles.sidebar, isMobileOpen && styles.sidebarOpen)}>
                <div className={styles.logo}>
                    Poly.
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(styles.navItem, isActive && styles.navItemActive)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Extras Section */}
                    <div style={{
                        marginTop: "var(--space-6)",
                        marginBottom: "var(--space-2)",
                        paddingLeft: "var(--space-4)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-fg-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                    }}>
                        おまけ機能
                    </div>
                    {extraItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(styles.navItem, isActive && styles.navItemActive)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
