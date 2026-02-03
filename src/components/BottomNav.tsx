"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Map, Brain, Clock, BookOpen, FolderHeart, MessageCircle, Languages } from "lucide-react";
import clsx from "clsx";
import styles from "./BottomNav.module.css";
import { useSettingsStore } from "@/store/settings-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { defaultPhraseView } = useSettingsStore();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const [showFloating, setShowFloating] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    const phraseViewItem = defaultPhraseView === 'my-phrases'
        ? { label: (t as any).myPhrases || "Saved", href: "/app/my-phrases", icon: FolderHeart }
        : { label: t.history, href: "/app/history", icon: Clock };

    const NAV_ITEMS = [
        { label: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard },
        { label: t.phrases, href: "/app/phrases", icon: Map },
        { label: t.corrections, href: "/app/corrections", icon: BookOpen, hasFloating: true },
        { label: t.awareness, href: "/app/awareness", icon: Brain },
        phraseViewItem,
    ];

    const floatingItems = [
        { label: (t as any).chat || "チャット", href: "/app/chat", icon: MessageCircle },
        { label: (t as any).expressionPageTitle || "翻訳", href: "/app/expressions", icon: Languages },
    ];

    const startLongPress = useCallback(() => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setShowFloating(true);
        }, 400);
    }, []);

    const cancelLongPress = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleClick = useCallback((e: React.MouseEvent, href: string) => {
        if (isLongPress.current) {
            e.preventDefault();
            isLongPress.current = false;
            return;
        }
        router.push(href);
    }, [router]);

    const handleFloatingClick = (href: string) => {
        setShowFloating(false);
        router.push(href);
    };

    const handleOverlayClick = () => {
        setShowFloating(false);
    };

    return (
        <>
            {/* Overlay */}
            {showFloating && (
                <div className={styles.overlay} onClick={handleOverlayClick} />
            )}

            {/* Floating Menu */}
            {showFloating && (
                <div className={styles.floatingMenu}>
                    {floatingItems.map((item) => (
                        <button
                            key={item.href}
                            className={styles.floatingItem}
                            onClick={() => handleFloatingClick(item.href)}
                        >
                            <item.icon size={22} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <nav className={styles.bottomNav}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
                    const hasFloating = 'hasFloating' in item && item.hasFloating;

                    if (hasFloating) {
                        return (
                            <button
                                key={item.href}
                                className={clsx(styles.navItem, isActive && styles.navItemActive)}
                                onTouchStart={startLongPress}
                                onTouchEnd={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                onTouchMove={cancelLongPress}
                                onMouseDown={startLongPress}
                                onMouseUp={cancelLongPress}
                                onMouseLeave={cancelLongPress}
                                onClick={(e) => handleClick(e, item.href)}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <item.icon size={24} />
                                <span>{item.label}</span>
                            </button>
                        );
                    }

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
        </>
    );
}
