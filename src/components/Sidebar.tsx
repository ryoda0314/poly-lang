"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, BookOpen, Clock, Settings, LogOut, LayoutDashboard, Sparkles } from "lucide-react";
import clsx from "clsx";
import styles from "./Sidebar.module.css";
import { useAppStore } from "@/store/app-context";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Introduction", href: "/app/intro", icon: Sparkles },
    { label: "Phrases", href: "/app/phrases", icon: Map },
    { label: "Corrections", href: "/app/corrections", icon: BookOpen },
    { label: "History", href: "/app/history", icon: Clock },
    { label: "Settings", href: "/app/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAppStore();

    const handleLogout = async () => {
        console.log("handleLogout called");
        await logout();
        console.log("logout completed");
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                Poly.
            </div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item) => {
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
            </nav>

            <div className={styles.footer}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    );
}
