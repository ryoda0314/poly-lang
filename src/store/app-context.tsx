"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { LANGUAGES, Language } from "@/lib/data";
import { createClient } from "@/lib/supa-client";
import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

const ACTIVE_LANGUAGE_STORAGE_KEY = "poly.activeLanguageCode";

function isValidLanguageCode(code: string): boolean {
    return LANGUAGES.some(l => l.code === code);
}

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface AppState {
    isLoggedIn: boolean;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    activeLanguageCode: string;
    activeLanguage: Language | undefined;
    login: () => void; // Redirects to auth page
    logout: () => Promise<void>;
    setActiveLanguage: (code: string) => void;
    refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
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

    // 1. Listen for Auth State Changes
    useEffect(() => {
        let isMounted = true;

        // Set a fallback timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (isMounted) {
                console.log("Auth loading timeout - setting isLoading to false");
                setIsLoading(false);
            }
        }, 3000);

        // Subscribe to auth state changes - this also fires with initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.id);

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

    // 2. Fetch Profile Data
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
            // Sync active language if saved in profile (optional future enhancement)
            if (profileData.learning_language && isValidLanguageCode(profileData.learning_language)) {
                setActiveLanguageCode(profileData.learning_language);
            }
        }
    };

    const login = () => {
        router.push("/auth");
    };

    const logout = async () => {
        // Clear local state immediately
        setIsLoggedIn(false);
        setUser(null);
        setProfile(null);

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
                if (cookieName.startsWith('sb-') || cookieName.includes('supabase') || cookieName.includes('auth-token')) {
                    // Clear cookie by setting expiry to past
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                }
            });
        } catch (e) {
            console.error("Failed to clear cookies:", e);
        }

        // Fire signOut in background (don't wait for it)
        supabase.auth.signOut().catch(console.error);

        // Redirect immediately
        window.location.href = "/login";
    };

    const setActiveLanguage = (code: string) => {
        if (!isValidLanguageCode(code)) return;
        setActiveLanguageCode(code);
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

    // Redirect logic for onboarding
    useEffect(() => {
        if (!isLoading && isLoggedIn && profile && !profile.username && pathname !== "/onboarding") {
            // If logged in but no profile (incomplete onboarding), allow redirect
            // router.push("/onboarding"); 
            // Commented out to prevent loops during dev, relying on manual nav for now or strict checks later
        }
    }, [isLoading, isLoggedIn, profile, pathname]);


    return (
        <AppContext.Provider
            value={{
                isLoggedIn,
                user,
                profile,
                isLoading,
                activeLanguageCode,
                activeLanguage,
                login,
                logout,
                setActiveLanguage,
                refreshProfile: async () => {
                    if (user) await fetchProfile(user.id);
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
