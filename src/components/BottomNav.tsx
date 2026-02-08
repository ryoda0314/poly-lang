"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Map, Brain, Clock, BookOpen, FolderHeart, MessageCircle, Languages, Layers, FileText, Sparkles, BookMarked, FolderOpen, GitBranch, PenTool } from "lucide-react";
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

    const [showFloating, setShowFloating] = useState<string | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);
    const longPressTarget = useRef<string | null>(null);

    const phraseViewItem = defaultPhraseView === 'my-phrases'
        ? { label: (t as any).myPhrases || "Saved", href: "/app/my-phrases", icon: FolderHeart }
        : { label: t.history, href: "/app/history", icon: Clock };

    const NAV_ITEMS = [
        { label: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard },
        { label: t.phrases, href: "/app/phrases", icon: Map, floatingKey: "phrases" },
        { label: t.corrections, href: "/app/corrections", icon: BookOpen, floatingKey: "corrections" },
        { label: t.awareness, href: "/app/awareness", icon: Brain, floatingKey: "awareness" },
        phraseViewItem,
    ];

    // Different floating menus for different buttons
    const floatingMenus: Record<string, { label: string; href: string; icon: any }[]> = {
        phrases: [
            { label: (t as any).swipeLearning || "スワイプ学習", href: "/app/swipe-deck", icon: Layers },
            { label: (t as any).scriptLearning || "文字学習", href: "/app/script-learning", icon: PenTool },
            { label: (t as any).longTextExplorer || "長文探索", href: "/app/long-text", icon: FileText },
        ],
        corrections: [
            { label: (t as any).chat || "チャット", href: "/app/chat", icon: MessageCircle },
            { label: (t as any).expressionPageTitle || "翻訳", href: "/app/expressions", icon: Languages },
        ],
        awareness: [
            { label: (t as any).vocabularySets || "単語集", href: "/app/vocabulary-sets", icon: FolderOpen },
            { label: (t as any).etymology || "語源辞典", href: "/app/etymology", icon: GitBranch },
        ],
    };

    const startLongPress = useCallback((floatingKey: string) => {
        isLongPress.current = false;
        longPressTarget.current = floatingKey;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setShowFloating(floatingKey);
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
        setShowFloating(null);
        router.push(href);
    };

    const handleOverlayClick = () => {
        setShowFloating(null);
    };

    return (
        <>
            {/* Overlay */}
            {showFloating && (
                <div className={styles.overlay} onClick={handleOverlayClick} />
            )}

            {/* Floating Menu */}
            {showFloating && floatingMenus[showFloating] && (
                <div className={clsx(
                    styles.floatingMenu,
                    showFloating === "phrases" && styles.floatingMenuPhrases,
                    showFloating === "corrections" && styles.floatingMenuCorrections,
                    showFloating === "awareness" && styles.floatingMenuAwareness
                )}>
                    {floatingMenus[showFloating].map((item) => (
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
                    const floatingKey = 'floatingKey' in item ? item.floatingKey : null;

                    if (floatingKey) {
                        return (
                            <button
                                key={item.href}
                                className={clsx(styles.navItem, isActive && styles.navItemActive)}
                                onTouchStart={() => startLongPress(floatingKey)}
                                onTouchEnd={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                onTouchMove={cancelLongPress}
                                onMouseDown={() => startLongPress(floatingKey)}
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
