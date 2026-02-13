
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Gamepad2,
    Trophy,
    Activity,
    Wrench,
    Layers,
    LogOut,
    Zap,
    Gauge,
    BookOpen,
    Cpu,
    Gift,
    MessageSquare,
    Megaphone,
    Menu,
    X
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export function AdminSidebar({ activeTab, setActiveTab, isOpen, onToggle }: AdminSidebarProps) {
    const router = useRouter();

    // Close sidebar on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onToggle();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onToggle]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen && window.innerWidth <= 768) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

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

    const handleTabClick = (id: string) => {
        setActiveTab(id);
        if (window.innerWidth <= 768) onToggle();
    };

    const handleNavClick = (href: string) => {
        router.push(href);
        if (window.innerWidth <= 768) onToggle();
    };

    const sidebarContent = (
        <div style={{
            width: "260px",
            height: "100vh",
            background: "var(--color-surface)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            zIndex: 50,
            overflowY: "auto",
        }}>
            {/* Brand / Logo */}
            <div style={{
                padding: "24px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", gap: "12px",
                justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "32px", height: "32px",
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                        borderRadius: "8px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: "bold",
                        flexShrink: 0,
                    }}>
                        P
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-fg)" }}>PolyLang</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-fg-muted)", letterSpacing: "0.05em" }}>ADMIN CONSOLE</div>
                    </div>
                </div>
                {/* Close button - mobile only */}
                <button
                    onClick={onToggle}
                    className="admin-sidebar-close"
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-fg-muted)",
                        padding: "4px",
                        display: "none", // hidden by default, shown via CSS on mobile
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <div style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
                <div style={{ padding: "0 12px 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-fg-muted)", textTransform: "uppercase" }}>
                    Management
                </div>
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
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
                            onClick={() => handleNavClick(item.href)}
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
                    onClick={() => handleNavClick("/app/dashboard")}
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

    return (
        <>
            {/* Hamburger button - visible only on mobile via CSS */}
            <button
                onClick={onToggle}
                className="admin-hamburger"
                style={{
                    position: "fixed",
                    top: "16px",
                    left: "16px",
                    zIndex: 60,
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-fg)",
                    cursor: "pointer",
                    display: "none", // hidden by default, shown via CSS on mobile
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <Menu size={20} />
            </button>

            {/* Desktop: static sidebar */}
            <div className="admin-sidebar-desktop">
                {sidebarContent}
            </div>

            {/* Mobile: overlay sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="admin-sidebar-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onToggle}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.4)",
                                zIndex: 90,
                                display: "none", // shown via CSS on mobile
                            }}
                        />
                        {/* Sidebar drawer */}
                        <motion.div
                            className="admin-sidebar-mobile"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "tween", duration: 0.25 }}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                bottom: 0,
                                zIndex: 100,
                                display: "none", // shown via CSS on mobile
                            }}
                        >
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Responsive CSS */}
            <style>{`
                @media (max-width: 768px) {
                    .admin-hamburger {
                        display: flex !important;
                    }
                    .admin-sidebar-desktop {
                        display: none !important;
                    }
                    .admin-sidebar-backdrop {
                        display: block !important;
                    }
                    .admin-sidebar-mobile {
                        display: block !important;
                    }
                    .admin-sidebar-close {
                        display: block !important;
                    }
                }
            `}</style>
        </>
    );
}
