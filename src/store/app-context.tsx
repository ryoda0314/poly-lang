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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.id);
            if (session?.user) {
                setUser(session.user);
                setIsLoggedIn(true);
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setIsLoggedIn(false);
            }
            setIsLoading(false);
        });

        // Check initial session
        /* supabase.auth.getSession().then(({ data: { session } }) => {
             if (!session) setIsLoading(false);
         });*/
        // onAuthStateChange fires initial session automatically usually, but let's be safe
        // actually onAuthStateChange is sufficient.

        return () => {
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
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUser(null);
        setProfile(null);
        router.push("/auth");
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
