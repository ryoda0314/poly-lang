"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clock, FolderHeart } from "lucide-react";
import clsx from "clsx";
import styles from "./BottomNav.module.css";
import { useSettingsStore, NavItemKey } from "@/store/settings-store";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";
import { translations } from "@/lib/translations";
import { NAV_ITEM_REGISTRY, getMiddleNavKeys, getRelatedKeys, filterByLanguage } from "@/lib/nav-items";

type RenderedNavItem = { label: string; href: string; icon: any; floatingKey?: string };

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { defaultPhraseView, learningGoal, customNavItems } = useSettingsStore();
    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const { memos } = useAwarenessStore();
    const t = translations[nativeLanguage] || translations.ja;

    // Badge count for awareness items
    const awarenessBadgeCount = useMemo(() => {
        const memoList = Object.values(memos).flat();
        const now = new Date();
        const unverified = memoList.filter(m => m.status === 'unverified').length;
        const dueReviews = memoList.filter(m =>
            m.status === 'verified' && m.next_review_at && new Date(m.next_review_at) <= now
        ).length;
        return unverified + dueReviews;
    }, [memos]);

    const [showFloating, setShowFloating] = useState<string | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);
    const longPressTarget = useRef<string | null>(null);

    const phraseViewItem: RenderedNavItem = defaultPhraseView === 'my-phrases'
        ? { label: (t as any).myPhrases || "Saved", href: "/app/my-phrases", icon: FolderHeart }
        : { label: t.history, href: "/app/history", icon: Clock };

    const middleKeys = useMemo(
        () => filterByLanguage(getMiddleNavKeys(learningGoal, customNavItems), activeLanguageCode, nativeLanguage),
        [learningGoal, customNavItems, activeLanguageCode, nativeLanguage]
    );

    // Build nav items and floating menus from the registry
    const { navItems: NAV_ITEMS, floatingMenus } = useMemo(() => {
        const items: RenderedNavItem[] = [
            { label: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard },
        ];
        const menus: Record<string, { label: string; href: string; icon: any }[]> = {};

        for (const key of middleKeys) {
            const def = NAV_ITEM_REGISTRY[key];
            if (!def) continue;

            const related = getRelatedKeys(key, learningGoal, customNavItems);
            const hasSubmenu = related && related.length > 0;
            items.push({
                label: def.getLabel(t),
                href: def.href,
                icon: def.icon,
                floatingKey: hasSubmenu ? key : undefined,
            });

            if (hasSubmenu && related) {
                // Filter out any related items that are already in the main nav or english-only
                const subItems = filterByLanguage(related, activeLanguageCode, nativeLanguage)
                    .filter((rk: NavItemKey) => !middleKeys.includes(rk))
                    .map((rk: NavItemKey) => {
                        const sub = NAV_ITEM_REGISTRY[rk];
                        return sub ? { label: sub.getLabel(t), href: sub.href, icon: sub.icon } : null;
                    })
                    .filter(Boolean) as { label: string; href: string; icon: any }[];

                if (subItems.length > 0) {
                    menus[key] = subItems;
                }
            }
        }

        items.push(phraseViewItem);
        return { navItems: items, floatingMenus: menus };
    }, [middleKeys, t, phraseViewItem.href, learningGoal, customNavItems]);

    // Calculate floating menu position based on which item triggered it
    const getFloatingPosition = useCallback((floatingKey: string) => {
        const idx = NAV_ITEMS.findIndex(item => item.floatingKey === floatingKey);
        if (idx === -1) return "50%";
        return `${((idx + 0.5) / NAV_ITEMS.length) * 100}%`;
    }, [NAV_ITEMS]);

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
                <div
                    className={styles.floatingMenu}
                    style={{ left: getFloatingPosition(showFloating), transform: "translateX(-50%)" }}
                >
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
                    const floatingKey = item.floatingKey;

                    const isAwareness = item.href === "/app/awareness";
                    const badge = isAwareness && awarenessBadgeCount > 0 ? (
                        <span className={styles.badge}>{awarenessBadgeCount}</span>
                    ) : null;

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
                                {badge}
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
                            {badge}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
