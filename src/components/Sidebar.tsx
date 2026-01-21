"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, BookOpen, Clock, Settings, LogOut, LayoutDashboard, Sparkles, Shield, Brain, Database, Plus, ShoppingBag } from "lucide-react";
import clsx from "clsx";
import styles from "./Sidebar.module.css";
import { useAppStore } from "@/store/app-context";

import { translations } from "@/lib/translations";

// Use a function or map inside usage instead of constant
// Removed static NAV_ITEMS

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, profile, nativeLanguage } = useAppStore();
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

    const t = translations[nativeLanguage];

    const NAV_ITEMS = [
        { label: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard },
        { label: t.phrases, href: "/app/phrases", icon: Map },
        { label: t.corrections, href: "/app/corrections", icon: BookOpen },
        { label: t.awareness, href: "/app/awareness", icon: Brain },
        { label: t.history, href: "/app/history", icon: Clock },
        { label: t.shop, href: "/app/shop", icon: ShoppingBag },
        { label: t.settings, href: "/app/settings", icon: Settings },
    ];

    // Filter or extend nav items based on role
    // Filter or extend nav items based on role
    const navItems = [...NAV_ITEMS];
    // Admin items are now rendered separately

    const extraItems = [
        { label: t.slangDatabase, href: "/app/slang", icon: Sparkles },
        { label: t.basicPhrases, href: "/app/basic-phrases", icon: BookOpen },
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

                    {/* Admin Section */}
                    {profile?.role === 'admin' && (
                        <>
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
                                Admin
                            </div>
                            <Link
                                href="/admin/dashboard-data"
                                className={clsx(styles.navItem, pathname === "/admin/dashboard-data" && styles.navItemActive)}
                            >
                                <Shield size={20} />
                                <span>{t.admin}</span>
                            </Link>
                            <Link
                                href="/admin/slang"
                                className={clsx(styles.navItem, pathname === "/admin/slang" && styles.navItemActive)}
                            >
                                <Database size={20} />
                                <span>{t.manageSlang}</span>
                            </Link>
                        </>
                    )}

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
                        {t.extras}
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
                        <span>{t.logout}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
