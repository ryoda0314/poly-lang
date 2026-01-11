"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useAppStore } from "@/store/app-context";

export type DrawerState = "UNOPENED" | "COLLAPSED" | "EXPANDED";

export interface ExampleResult {
    id: string;
    text: string;
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
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

export function ExplorerProvider({ children }: { children: ReactNode }) {
    const { activeLanguageCode, speakingGender } = useAppStore();
    const [drawerState, setDrawerState] = useState<DrawerState>("UNOPENED");
    const [trail, setTrail] = useState<TrailNode[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [cache, setCache] = useState<Record<string, ExampleResult[]>>({});

    const trailRef = React.useRef<TrailNode[]>(trail);
    const activeIndexRef = React.useRef<number>(activeIndex);
    const cacheRef = React.useRef<Record<string, ExampleResult[]>>(cache);

    // ... (refs update effects same) ...

    const openExplorer = useCallback(async (rawToken: string) => {
        const token = rawToken.trim();
        if (!token) return;

        setDrawerState(prev => (prev === "UNOPENED" ? "COLLAPSED" : prev));

        const currentTrail = trailRef.current;
        const currentIndex = activeIndexRef.current;
        const current = currentTrail[currentIndex];

        // If the token matches the current one, we optionally check if we want to re-load.
        // For now, if same token, just return (user can close/reopen to refresh if gender changed)
        if (current && current.token === token) return;

        // If the token already exists in history, jump to it (prefer the latest occurrence)
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

        const rejectAtIndex = (index: number) => {
            setTrail(prev => {
                const node = prev[index];
                if (!node || node.token !== token) return prev;
                const next = [...prev];
                next[index] = { ...node, loading: false, error: "Failed to load examples." };
                return next;
            });
        };

        if (targetIndex !== -1) {
            setActiveIndex(targetIndex);
            const node = currentTrail[targetIndex];
            if (node?.examples && !node.loading) return;
            if (node?.loading) return;
            markLoadingAtIndex(targetIndex);
        } else {
            const newNode: TrailNode = { token, examples: null, loading: true, error: null };
            targetIndex = currentTrail.length;
            setTrail([...currentTrail, newNode]);
            setActiveIndex(targetIndex);
        }

        try {
            const cacheKey = `${activeLanguageCode}::${token.toLowerCase()}::${speakingGender}`;
            const cached = cacheRef.current[cacheKey];
            if (cached) {
                resolveAtIndex(targetIndex, cached);
                return;
            }

            const { getRelatedPhrases } = await import("@/actions/openai");
            const results = await getRelatedPhrases(activeLanguageCode, token, speakingGender);
            const examples = results || [];
            if (examples.length > 0) {
                setCache(prev => ({ ...prev, [cacheKey]: examples }));
            }
            resolveAtIndex(targetIndex, examples);
        } catch (e) {
            console.error(e);
            rejectAtIndex(targetIndex);
        }
    }, [activeLanguageCode, speakingGender]);

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
                deleteCurrent
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
