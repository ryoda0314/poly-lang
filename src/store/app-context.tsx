"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { LANGUAGES, Language } from "@/lib/data";
import { preloadPhrases } from "@/lib/data-loader";
import { createClient } from "@/lib/supa-client";
import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

const ACTIVE_LANGUAGE_STORAGE_KEY = "poly.activeLanguageCode";
const NATIVE_LANGUAGE_STORAGE_KEY = "poly.nativeLanguage";
const SHOW_PINYIN_STORAGE_KEY = "poly.showPinyin";
const SHOW_FURIGANA_STORAGE_KEY = "poly.showFurigana";

function isValidLanguageCode(code: string): boolean {
    return LANGUAGES.some(l => l.code === code);
}

export type UserProfile = Database['public']['Tables']['profiles']['Row'];


interface UserProgress {
    xp_total: number;
    current_level: number;
    next_level_xp?: number; // Optional, derived from levels table
    level_title?: string;
}

interface AppState {
    isLoggedIn: boolean;
    user: User | null;
    profile: UserProfile | null;
    userProgress: UserProgress | null;
    isLoading: boolean;
    activeLanguageCode: string;
    activeLanguage: Language | undefined;
    nativeLanguage: "ja" | "ko" | "en";
    speakingGender: "male" | "female";
    showPinyin: boolean;
    showFurigana: boolean;
    login: () => void; // Redirects to auth page
    logout: () => Promise<void>;
    setActiveLanguage: (code: string) => void;
    setNativeLanguage: (lang: "ja" | "ko" | "en") => void;
    setSpeakingGender: (gender: "male" | "female") => void;
    togglePinyin: () => void;
    toggleFurigana: () => void;
    refreshProfile: () => Promise<void>;
    refreshProgress: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [activeLanguageCode, setActiveLanguageCode] = useState<string>(() => {
        if (typeof window === "undefined") return "fr"; // Default to French for demo
        try {
            const stored = window.localStorage.getItem(ACTIVE_LANGUAGE_STORAGE_KEY);
            if (stored && isValidLanguageCode(stored)) return stored;
        } catch { }
        return "fr";
    });

    // ... (existing state initializers)

    const [nativeLanguage, setNativeLanguageState] = useState<"ja" | "ko" | "en">(() => {
        if (typeof window === "undefined") return "ja";
        try {
            const stored = window.localStorage.getItem(NATIVE_LANGUAGE_STORAGE_KEY);
            if (stored === "ja" || stored === "ko" || stored === "en") return stored;
        } catch { }
        return "ja";
    });

    const [speakingGender, setSpeakingGender] = useState<"male" | "female">("male");

    const [showPinyin, setShowPinyin] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        try {
            const stored = window.localStorage.getItem(SHOW_PINYIN_STORAGE_KEY);
            if (stored !== null) return stored === "true";
        } catch { }
        return true;
    });

    const togglePinyin = () => {
        setShowPinyin(prev => {
            const newValue = !prev;
            try {
                window.localStorage.setItem(SHOW_PINYIN_STORAGE_KEY, String(newValue));
            } catch { }
            return newValue;
        });
    };

    const [showFurigana, setShowFurigana] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        try {
            const stored = window.localStorage.getItem(SHOW_FURIGANA_STORAGE_KEY);
            if (stored !== null) return stored === "true";
        } catch { }
        return true;
    });

    const toggleFurigana = () => {
        setShowFurigana(prev => {
            const newValue = !prev;
            try {
                window.localStorage.setItem(SHOW_FURIGANA_STORAGE_KEY, String(newValue));
            } catch { }
            return newValue;
        });
    };

    const setNativeLanguage = (lang: "ja" | "ko" | "en") => {
        setNativeLanguageState(lang);
        try {
            window.localStorage.setItem(NATIVE_LANGUAGE_STORAGE_KEY, lang);
        } catch { }
    };

    // Helper to fetch user progress
    const fetchUserProgress = async (userId: string, langCode: string) => {
        try {
            // 1. Get Progress
            const { data: progress } = await (supabase as any)
                .from('user_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('language_code', langCode)
                .single();

            // 2. Get Level Info
            const currentLevel = progress?.current_level || 1;
            const xpTotal = progress?.xp_total || 0;

            const { data: nextLevel } = await supabase
                .from('levels')
                .select('xp_threshold, title')
                .eq('level', currentLevel + 1)
                .single();

            const { data: currentLevelInfo } = await supabase
                .from('levels')
                .select('title')
                .eq('level', currentLevel)
                .single();

            setUserProgress({
                xp_total: xpTotal,
                current_level: currentLevel,
                next_level_xp: nextLevel?.xp_threshold || 10000, // Fallback high number
                level_title: currentLevelInfo?.title || 'Beginner'
            });

        } catch (e) {
            console.error("Failed to fetch user progress:", e);
            // Fallback to defaults
            setUserProgress({
                xp_total: 0,
                current_level: 1,
                next_level_xp: 100,
                level_title: 'Novice'
            });
        }
    };

    // ... (existing helper function)

    // 2. Fetch Profile Data & Progress
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
        } else if (data) {
            const profileData = data as UserProfile;
            setProfile(profileData);

            // Determine language to load progress for
            let langToLoad = activeLanguageCode;
            if (profileData.learning_language && isValidLanguageCode(profileData.learning_language)) {
                setActiveLanguageCode(profileData.learning_language);
                langToLoad = profileData.learning_language;
            }

            // Sync native language...
            if (profileData.native_language && (profileData.native_language === 'ja' || profileData.native_language === 'ko' || profileData.native_language === 'en')) {
                const lang = profileData.native_language as "ja" | "ko" | "en";
                setNativeLanguageState(lang);
                try {
                    window.localStorage.setItem(NATIVE_LANGUAGE_STORAGE_KEY, lang);
                } catch { }
            }
            // Sync gender preference
            if (profileData.gender === "male" || profileData.gender === "female") {
                setSpeakingGender(profileData.gender);
            }

            // Fetch Progress
            await fetchUserProgress(userId, langToLoad);
        }
    };

    // 1. Listen for Auth State Changes
    useEffect(() => {
        let isMounted = true;

        // Preload phrase data in background (dynamic import)
        preloadPhrases();

        // Set a fallback timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (isMounted) {
                setIsLoading(false);
            }
        }, 3000);

        // Subscribe to auth state changes - this also fires with initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Clear timeout immediately when we get any auth event
            clearTimeout(loadingTimeout);

            if (session?.user) {
                setUser(session.user);
                setIsLoggedIn(true);
                setIsLoading(false); // Set loading false before profile fetch
                // Fetch profile in background - don't block UI
                fetchProfile(session.user.id).catch(console.error);
            } else {
                setUser(null);
                setProfile(null);
                setUserProgress(null);
                setIsLoggedIn(false);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(loadingTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = () => {
        router.push("/auth");
    };

    const logout = async () => {
        // Clear local state immediately
        setIsLoggedIn(false);
        setUser(null);
        setProfile(null);
        setUserProgress(null);

        // Clear Supabase session from localStorage
        try {
            // Remove all Supabase auth related items from localStorage
            const keysToRemove = Object.keys(localStorage).filter(key =>
                key.startsWith('sb-') || key.includes('supabase')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.error("Failed to clear localStorage:", e);
        }

        // Clear Supabase auth cookies
        try {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const cookieName = cookie.split('=')[0].trim();
                // Clear cookie by setting expiry to past
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            });
        } catch (e) {
            console.error("Failed to clear cookies:", e);
        }

        // Fire signOut in background (don't wait for it)
        supabase.auth.signOut().catch(console.error);

        // Redirect immediately
        window.location.href = "/login";
    };

    const setActiveLanguage = async (code: string) => {
        if (!isValidLanguageCode(code)) return;
        setActiveLanguageCode(code);

        // Sync with DB if user is logged in
        if (user) {
            try {
                await supabase
                    .from("profiles")
                    .update({ learning_language: code })
                    .eq("id", user.id);

                // Fetch new progress for this language
                await fetchUserProgress(user.id, code);
            } catch (e) {
                console.error("Failed to sync language to profile:", e);
            }
        }
    };

    useEffect(() => {
        try {
            window.localStorage.setItem(ACTIVE_LANGUAGE_STORAGE_KEY, activeLanguageCode);
        } catch { }
    }, [activeLanguageCode]);

    const activeLanguage = useMemo(
        () => LANGUAGES.find(l => l.code === activeLanguageCode),
        [activeLanguageCode]
    );


    // ... (existing useEffect for localStorage)

    // ... (existing simple states and providers)

    return (
        <AppContext.Provider
            value={{
                isLoggedIn,
                user,
                profile,
                userProgress,
                isLoading,
                activeLanguageCode,
                activeLanguage,
                nativeLanguage,
                speakingGender,
                showPinyin,
                showFurigana,
                login,
                logout,
                setActiveLanguage,
                setNativeLanguage,
                setSpeakingGender,
                togglePinyin,
                toggleFurigana,
                refreshProfile: async () => {
                    if (user) await fetchProfile(user.id);
                },
                refreshProgress: async () => {
                    if (user) await fetchUserProgress(user.id, activeLanguageCode);
                }
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppStore() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppStore must be used within an AppProvider");
    }
    return context;
}
