
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Users,
    Gamepad2,
    Trophy,
    Activity,
    Wrench,
    Layers,
    LogOut,
    LayoutDashboard,
    Zap,
    Gauge,
    BookOpen,
    Cpu,
    Gift,
    MessageSquare,
    Megaphone
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
    const router = useRouter();

    const menuItems = [
        { id: "users", label: "Users", icon: Users },
        { id: "levels", label: "Levels", icon: Layers },
        { id: "quests", label: "Quests", icon: Gamepad2 },
        { id: "badges", label: "Badges", icon: Trophy },
        { id: "events", label: "Events", icon: Activity },
        { id: "distributions", label: "Distributions", icon: Gift },
        { id: "usage", label: "Daily Usage", icon: Gauge },
        { id: "api_tokens", label: "API Tokens", icon: Cpu },
        { id: "xp_settings", label: "XP Settings", icon: Zap },
        { id: "tutorials", label: "Tutorials", icon: BookOpen },
        { id: "tools", label: "Tools", icon: Wrench },
    ];

    return (
        <div style={{
            width: "260px",
            height: "100vh",
            background: "var(--color-surface)", // Deep dark or white depending on theme
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            flexShrink: 0,
            zIndex: 50
        }}>
            {/* Brand / Logo */}
            <div style={{
                padding: "24px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", gap: "12px"
            }}>
                <div style={{
                    width: "32px", height: "32px",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                    borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "bold"
                }}>
                    P
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-fg)" }}>PolyLang</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)", letterSpacing: "0.05em" }}>ADMIN CONSOLE</div>
                </div>
            </div>

            {/* Navigation */}
            <div style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ padding: "0 12px 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-fg-muted)", textTransform: "uppercase" }}>
                    Management
                </div>
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "none",
                                background: isActive ? "var(--color-bg-sub)" : "transparent",
                                color: isActive ? "var(--color-primary)" : "var(--color-fg-muted)",
                                fontSize: "0.95rem",
                                fontWeight: isActive ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                position: "relative"
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = "var(--color-surface-hover)";
                                    e.currentTarget.style.color = "var(--color-fg)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "var(--color-fg-muted)";
                                }
                            }}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: "10%",
                                        bottom: "10%",
                                        width: "4px",
                                        borderRadius: "0 4px 4px 0",
                                        background: "var(--color-primary)"
                                    }}
                                />
                            )}
                        </button>
                    );
                })}

                {/* External Pages Section */}
                <div style={{ padding: "16px 12px 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-fg-muted)", textTransform: "uppercase", marginTop: "8px" }}>
                    Pages
                </div>
                {[
                    { href: "/admin/support", label: "Support Tickets", icon: MessageSquare },
                    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "none",
                                background: "transparent",
                                color: "var(--color-fg-muted)",
                                fontSize: "0.95rem",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--color-surface-hover)";
                                e.currentTarget.style.color = "var(--color-fg)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--color-fg-muted)";
                            }}
                        >
                            <Icon size={18} strokeWidth={2} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Footer / Exit */}
            <div style={{ padding: "16px", borderTop: "1px solid var(--color-border)" }}>
                <button
                    onClick={() => router.push("/app/dashboard")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "transparent",
                        color: "var(--color-fg)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg-sub)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                    <LogOut size={16} />
                    <span>Back to App</span>
                </button>
            </div>
        </div>
    );
}
