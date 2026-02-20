"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";

export type DrawerState = "UNOPENED" | "COLLAPSED" | "EXPANDED";

export interface ExampleResult {
    id: string;
    text: string;
    tokens?: string[];
    translation: string;
    translation_ko?: string;
    gender_variants?: {
        male: { targetText: string };
        female: { targetText: string };
    };
}

interface TrailNode {
    token: string;
    examples: ExampleResult[] | null;
    loading: boolean;
    error: string | null;
}

interface ExplorerContextType {
    drawerState: DrawerState;
    trail: TrailNode[];
    activeIndex: number;
    openExplorer: (token: string) => void;
    closeExplorer: () => void; // Sets to COLLAPSED
    toggleExpand: () => void;
    popTrail: () => void;
    jumpToTrail: (index: number) => void;
    clearTrail: () => void;
    deleteCurrent: () => void;
    refreshCurrentToken: () => void; // Force re-fetch current token with new settings
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

export function ExplorerProvider({ children }: { children: ReactNode }) {
    // We need profile to check credits
    const { activeLanguageCode, speakingGender, nativeLanguage, profile, refreshProfile } = useAppStore();
    const { logEvent } = useHistoryStore();
    const [drawerState, setDrawerState] = useState<DrawerState>("UNOPENED");
    const [trail, setTrail] = useState<TrailNode[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [cache, setCache] = useState<Record<string, ExampleResult[]>>({});

    // Refs to avoid stale closures in async callbacks
    const trailRef = React.useRef<TrailNode[]>(trail);
    const activeIndexRef = React.useRef<number>(activeIndex);
    const cacheRef = React.useRef<Record<string, ExampleResult[]>>(cache);
    const profileRef = React.useRef(profile);

    useEffect(() => {
        trailRef.current = trail;
    }, [trail]);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        cacheRef.current = cache;
    }, [cache]);

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    const openExplorer = useCallback(async (rawToken: string) => {
        const token = rawToken.trim();
        if (!token) return;

        setDrawerState(prev => (prev === "UNOPENED" ? "COLLAPSED" : prev));

        const currentTrail = trailRef.current;
        const currentIndex = activeIndexRef.current;
        const current = currentTrail[currentIndex];

        // If the token matches the current one, just return
        if (current && current.token === token) return;

        // If the token already exists in history, jump to it
        let targetIndex = -1;
        for (let i = currentTrail.length - 1; i >= 0; i--) {
            if (currentTrail[i]?.token === token) {
                targetIndex = i;
                break;
            }
        }

        const markLoadingAtIndex = (index: number) => {
            setTrail(prev => {
                const node = prev[index];
                if (!node || node.token !== token) return prev;
                if (node.loading) return prev;
                const next = [...prev];
                next[index] = { ...node, loading: true, error: null };
                return next;
            });
        };

        const resolveAtIndex = (index: number, examples: ExampleResult[]) => {
            setTrail(prev => {
                const node = prev[index];
                if (!node || node.token !== token) return prev;
                const next = [...prev];
                next[index] = { ...node, examples, loading: false, error: null };
                return next;
            });
        };

        const rejectAtIndex = (index: number, errorMessage?: string) => {
            setTrail(prev => {
                const node = prev[index];
                if (!node || node.token !== token) return prev;
                const next = [...prev];
                next[index] = { ...node, loading: false, error: errorMessage || "Failed to load examples." };
                return next;
            });
        };

        if (targetIndex !== -1) {
            setActiveIndex(targetIndex);
            // Reuse if already loaded
            const node = currentTrail[targetIndex];
            if (node?.examples) return;
            // If failed before, we stop here (cache behavior for failure)
            return;
        } else {
            // New Item
            const newNode: TrailNode = { token, examples: null, loading: true, error: null };
            targetIndex = currentTrail.length;
            setTrail([...currentTrail, newNode]);
            setActiveIndex(targetIndex);
        }

        // Cache Check First (Client-side cache reuse)
        const cacheKey = `${activeLanguageCode}::${token.toLowerCase()}::${speakingGender}`;
        const cached = cacheRef.current[cacheKey];
        if (cached) {
            resolveAtIndex(targetIndex, cached);
            return;
        }

        // Credit Check (Client-side)
        // Server checks BOTH plan daily limit AND purchased credits.
        // Client only has purchased credits, so only block if profile isn't loaded.
        const currentProfile = profileRef.current;
        if (!currentProfile) {
            rejectAtIndex(targetIndex, "Explorerクレジットが不足しています (Insufficient Credits)");
            return;
        }

        try {
            const { getRelatedPhrases } = await import("@/actions/openai");
            const result = await getRelatedPhrases(activeLanguageCode, token, speakingGender, nativeLanguage);

            if (!result.ok) {
                const msg = result.error.includes("credit")
                    ? "Explorerクレジットが不足しています (Insufficient Credits)"
                    : `例文の取得に失敗しました: ${result.error}`;
                rejectAtIndex(targetIndex, msg);
                refreshProfile().catch(console.error);
                logEvent(TRACKING_EVENTS.WORD_EXPLORE, 0, {
                    word: token,
                    success: false,
                    error: result.error
                });
                return;
            }

            const examples = result.data;
            if (examples.length > 0) {
                setCache(prev => ({ ...prev, [cacheKey]: examples }));
            }
            resolveAtIndex(targetIndex, examples);

            // Refresh profile to sync credits
            refreshProfile().catch(console.error);

            // Log Word Explore Event
            logEvent(TRACKING_EVENTS.WORD_EXPLORE, 0, {
                word: token,
                success: true,
                example_count: examples.length
            });
        } catch (e: any) {
            console.error("Explorer error:", e);
            rejectAtIndex(targetIndex, `例文の取得に失敗しました: ${e.message || "Unknown error"}`);
            refreshProfile().catch(console.error);
            logEvent(TRACKING_EVENTS.WORD_EXPLORE, 0, {
                word: token,
                success: false,
                error: String(e)
            });
        }
    }, [activeLanguageCode, speakingGender, nativeLanguage, refreshProfile, logEvent]);

    const closeExplorer = useCallback(() => {
        setDrawerState("UNOPENED");
    }, []);

    const toggleExpand = useCallback(() => {
        setDrawerState(prev => prev === "EXPANDED" ? "COLLAPSED" : "EXPANDED");
    }, []);

    const popTrail = useCallback(() => {
        setActiveIndex(prev => Math.max(0, prev - 1));
    }, []);

    const jumpToTrail = useCallback((index: number) => {
        setActiveIndex(prev => {
            const safeIndex = Math.max(0, Math.min(index, trail.length - 1));
            return Number.isFinite(safeIndex) ? safeIndex : prev;
        });
    }, [trail.length]);

    const clearTrail = useCallback(() => {
        setTrail([]);
        setActiveIndex(0);
        // Keep drawer open (COLLAPSED)
    }, []);

    const deleteCurrent = useCallback(() => {
        setTrail(prev => {
            if (prev.length === 0) {
                setActiveIndex(0);
                return prev;
            }

            const safeIndex = Math.max(0, Math.min(activeIndex, prev.length - 1));
            const next = prev.filter((_, i) => i !== safeIndex);
            const nextActiveIndex = next.length === 0 ? 0 : Math.min(safeIndex, next.length - 1);
            setActiveIndex(nextActiveIndex);
            return next;
        });
    }, [activeIndex]);

    // Effect: Clear trail when active language changes
    React.useEffect(() => {
        setTrail([]);
        setActiveIndex(0);
    }, [activeLanguageCode]);

    // Force re-fetch current token (used when gender changes)
    const refreshCurrentToken = useCallback(async () => {
        const currentTrail = trailRef.current;
        const currentIdx = activeIndexRef.current;
        const current = currentTrail[currentIdx];
        if (!current || !current.token) return;

        const token = current.token;

        // Mark as loading
        setTrail(prev => {
            const next = [...prev];
            if (next[currentIdx]) {
                next[currentIdx] = { ...next[currentIdx], loading: true, error: null };
            }
            return next;
        });

        try {
            const cacheKey = `${activeLanguageCode}::${token.toLowerCase()}::${speakingGender}`;
            const cached = cacheRef.current[cacheKey];
            if (cached) {
                setTrail(prev => {
                    const next = [...prev];
                    if (next[currentIdx]) {
                        next[currentIdx] = { ...next[currentIdx], examples: cached, loading: false, error: null };
                    }
                    return next;
                });
                return;
            }

            const { getRelatedPhrases } = await import("@/actions/openai");
            const result = await getRelatedPhrases(activeLanguageCode, token, speakingGender, nativeLanguage);

            if (!result.ok) {
                setTrail(prev => {
                    const next = [...prev];
                    if (next[currentIdx]) {
                        next[currentIdx] = { ...next[currentIdx], loading: false, error: result.error };
                    }
                    return next;
                });
                return;
            }

            const examples = result.data;
            if (examples.length > 0) {
                setCache(prev => ({ ...prev, [cacheKey]: examples }));
            }
            setTrail(prev => {
                const next = [...prev];
                if (next[currentIdx]) {
                    next[currentIdx] = { ...next[currentIdx], examples, loading: false, error: null };
                }
                return next;
            });
        } catch (e: any) {
            console.error(e);
            setTrail(prev => {
                const next = [...prev];
                if (next[currentIdx]) {
                    next[currentIdx] = { ...next[currentIdx], loading: false, error: e.message || "Failed to load examples." };
                }
                return next;
            });
        }
    }, [activeLanguageCode, speakingGender, nativeLanguage]);

    return (
        <ExplorerContext.Provider
            value={{
                drawerState,
                trail,
                activeIndex,
                openExplorer,
                closeExplorer,
                toggleExpand,
                popTrail,
                jumpToTrail,
                clearTrail,
                deleteCurrent,
                refreshCurrentToken
            }}
        >
            {children}
        </ExplorerContext.Provider>
    );
}

export function useExplorer() {
    const context = useContext(ExplorerContext);
    if (!context) {
        throw new Error("useExplorer must be used within ExplorerProvider");
    }
    return context;
}
