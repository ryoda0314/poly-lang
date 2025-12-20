"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { searchExamples } from "@/lib/data";
import { useAppStore } from "@/store/app-context";

export type DrawerState = "UNOPENED" | "COLLAPSED" | "EXPANDED";

export interface ExampleResult {
    id: string;
    text: string;
    translation: string;
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
    openExplorer: (token: string) => void;
    closeExplorer: () => void; // Sets to COLLAPSED
    toggleExpand: () => void;
    popTrail: () => void;
    jumpToTrail: (index: number) => void;
    clearTrail: () => void;
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

export function ExplorerProvider({ children }: { children: ReactNode }) {
    const { activeLanguageCode } = useAppStore();
    const [drawerState, setDrawerState] = useState<DrawerState>("UNOPENED");
    const [trail, setTrail] = useState<TrailNode[]>([]);
    const [cache, setCache] = useState<Record<string, ExampleResult[]>>({});
    const [inflight, setInflight] = useState<Record<string, boolean>>({});

    const fetchExamplesForToken = useCallback(async (token: string, lang: string) => {
        const key = `${lang}::${token.toLowerCase().trim()}`;

        // Check cache
        if (cache[key]) return cache[key];

        // Check inflight collision (basic prevention)
        if (inflight[key]) return null; // Or wait? For MVP, just return null or ignore

        setInflight(prev => ({ ...prev, [key]: true }));

        try {
            const results = await searchExamples(lang, token);
            setCache(prev => ({ ...prev, [key]: results }));
            return results;
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            setInflight(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [cache, inflight]);

    const openExplorer = useCallback(async (token: string) => {
        if (drawerState === "UNOPENED") {
            setDrawerState("COLLAPSED");
        }

        // Prevent duplicate trail nodes if the last one is the same
        setTrail(prev => {
            const last = prev[prev.length - 1];
            if (last && last.token === token) {
                return prev;
            }
            // Add new node with loading state
            const newNode: TrailNode = { token, examples: null, loading: true, error: null };
            return [...prev, newNode];
        });

        // If we just added a node (or it was already there but we want to re-fetch/ensure loaded),
        // we need to actually fetch. However, the setTrail above might have bailed out.
        // To be safe, let's check if we need to fetch.
        // Actually, the simplest fix for duplicate UI is just preventing the `setTrail` append.
        // But we still want to fetch if it's new.

        // Let's rely on the setTrail state update to know if we proceed, 
        // BUT we can't easily read the result of setTrail immediately.
        // So we check the current state (trail) assuming it hasn't updated yet in this closure? 
        // React state updates are batched. 
        // Better: Check trail ref or just checking `trail` from closure.

        // Check if last node is same token (using closure `trail`)
        const lastNode = trail[trail.length - 1];
        if (lastNode && lastNode.token === token) {
            return; // Already open/opening
        }

        try {
            const cached = cache[`${activeLanguageCode}::${token.toLowerCase().trim()}`];
            if (cached) {
                setTrail(prev => {
                    const newTrail = [...prev];
                    const lastIdx = newTrail.findIndex(n => n.token === token && n.loading);
                    if (lastIdx !== -1) {
                        newTrail[lastIdx] = { ...newTrail[lastIdx], examples: cached, loading: false };
                    }
                    return newTrail;
                });
            } else {
                // Use Server Action instead of mock searchExamples
                const { getRelatedPhrases } = await import("@/actions/openai");
                const results = await getRelatedPhrases(activeLanguageCode, token);

                // Cache it
                if (results && results.length > 0) {
                    setCache(prev => ({ ...prev, [`${activeLanguageCode}::${token.toLowerCase().trim()}`]: results }));
                }

                setTrail(prev => {
                    const newTrail = [...prev];
                    const lastIdx = newTrail.findIndex(n => n.token === token && n.loading);
                    if (lastIdx !== -1) {
                        newTrail[lastIdx] = {
                            ...newTrail[lastIdx],
                            examples: results || [],
                            loading: false
                        };
                    }
                    return newTrail;
                });
            }
        } catch (e) {
            console.error(e);
            setTrail(prev => {
                const newTrail = [...prev];
                const lastIdx = newTrail.findIndex(n => n.token === token && n.loading);
                if (lastIdx !== -1) {
                    newTrail[lastIdx] = { ...newTrail[lastIdx], loading: false, error: "Failed to load examples." };
                }
                return newTrail;
            });
        }

    }, [activeLanguageCode, drawerState, cache, trail]);

    const closeExplorer = useCallback(() => {
        setDrawerState("UNOPENED");
    }, []);

    const toggleExpand = useCallback(() => {
        setDrawerState(prev => prev === "EXPANDED" ? "COLLAPSED" : "EXPANDED");
    }, []);

    const popTrail = useCallback(() => {
        setTrail(prev => {
            if (prev.length <= 1) return prev;
            return prev.slice(0, -1);
        });
    }, []);

    const jumpToTrail = useCallback((index: number) => {
        setTrail(prev => prev.slice(0, index + 1));
    }, []);

    const clearTrail = useCallback(() => {
        setTrail([]);
        // Keep drawer open (COLLAPSED)
    }, []);

    // Effect: Clear trail when active language changes
    React.useEffect(() => {
        setTrail([]);
    }, [activeLanguageCode]);

    return (
        <ExplorerContext.Provider
            value={{
                drawerState,
                trail,
                openExplorer,
                closeExplorer,
                toggleExpand,
                popTrail,
                jumpToTrail,
                clearTrail
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
