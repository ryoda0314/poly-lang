"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Settings, LogOut, LayoutDashboard, Sparkles, Shield, Database, ShoppingBag, FolderHeart, Megaphone, BookOpen } from "lucide-react";
import clsx from "clsx";
import styles from "./Sidebar.module.css";
import { useAppStore } from "@/store/app-context";
import { useSettingsStore, NavItemKey } from "@/store/settings-store";
import { translations } from "@/lib/translations";
import { NAV_ITEM_REGISTRY, getMiddleNavKeys } from "@/lib/nav-items";

const ALL_NAV_KEYS: NavItemKey[] = Object.keys(NAV_ITEM_REGISTRY) as NavItemKey[];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, profile, nativeLanguage } = useAppStore();
    const { defaultPhraseView, learningGoal, customNavItems } = useSettingsStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await logout();
    };

    const t = translations[nativeLanguage];

    const phraseViewItem = defaultPhraseView === 'my-phrases'
        ? { label: (t as any).myPhrases || "保存済み", href: "/app/my-phrases", icon: FolderHeart }
        : { label: t.history, href: "/app/history", icon: Clock };

    const middleKeys = getMiddleNavKeys(learningGoal, customNavItems);

    // Primary: items in the nav bar. Secondary: everything else.
    const primaryKeys = middleKeys;
    const secondaryKeys = ALL_NAV_KEYS.filter(k => !primaryKeys.includes(k));

    const renderNavItem = (item: { label: string; href: string; icon: any }) => {
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
    };

    const renderFromKey = (key: NavItemKey) => {
        const def = NAV_ITEM_REGISTRY[key];
        if (!def) return null;
        return renderNavItem({ label: def.getLabel(t), href: def.href, icon: def.icon });
    };

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
                    {/* Dashboard */}
                    {renderNavItem({ label: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard })}

                    {/* Primary nav items (from bottom bar config) */}
                    {primaryKeys.map(renderFromKey)}

                    {/* Saved / History */}
                    {renderNavItem(phraseViewItem)}

                    {/* Shop & Settings */}
                    {renderNavItem({ label: t.shop, href: "/app/shop", icon: ShoppingBag })}
                    {renderNavItem({ label: t.settings, href: "/app/settings", icon: Settings })}

                    {/* Secondary (other features) */}
                    {secondaryKeys.length > 0 && (
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
                                {(t as any).more || "More"}
                            </div>
                            {secondaryKeys.map(renderFromKey)}
                        </>
                    )}

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
                                href="/admin/announcements"
                                className={clsx(styles.navItem, pathname === "/admin/announcements" && styles.navItemActive)}
                            >
                                <Megaphone size={20} />
                                <span>{(t as any).announcements || "お知らせ管理"}</span>
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
                    {extraItems.map(renderNavItem)}
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
