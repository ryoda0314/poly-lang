"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { LANGUAGES, Language } from "@/lib/data";

const ACTIVE_LANGUAGE_STORAGE_KEY = "poly.activeLanguageCode";

function isValidLanguageCode(code: string): boolean {
    return LANGUAGES.some(l => l.code === code);
}

interface UserProfile {
    name: string;
    learningLanguages: Language[];
}

interface AppState {
    isLoggedIn: boolean;
    user: UserProfile | null;
    activeLanguageCode: string;
    activeLanguage: Language | undefined;
    login: () => void;
    logout: () => void;
    setActiveLanguage: (code: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeLanguageCode, setActiveLanguageCode] = useState<string>(() => {
        if (typeof window === "undefined") return "ko";

        try {
            const stored = window.localStorage.getItem(ACTIVE_LANGUAGE_STORAGE_KEY);
            if (stored && isValidLanguageCode(stored)) return stored;
        } catch {
            // Ignore storage errors (e.g. privacy mode)
        }

        return "ko";
    });

    // Mock User
    const mockUser: UserProfile = {
        name: "Poly User",
        learningLanguages: LANGUAGES.filter(l => l.code === "ko" || l.code === "en"),
    };

    const login = () => {
        setIsLoggedIn(true);
        // Reset to first language on login if needed, or keep default
    };

    const logout = () => {
        setIsLoggedIn(false);
    };

    const setActiveLanguage = (code: string) => {
        if (!isValidLanguageCode(code)) return;
        setActiveLanguageCode(code);
    };

    useEffect(() => {
        try {
            window.localStorage.setItem(ACTIVE_LANGUAGE_STORAGE_KEY, activeLanguageCode);
        } catch {
            // Ignore storage errors
        }
    }, [activeLanguageCode]);

    const activeLanguage = useMemo(
        () => LANGUAGES.find(l => l.code === activeLanguageCode),
        [activeLanguageCode]
    );

    return (
        <AppContext.Provider
            value={{
                isLoggedIn,
                user: isLoggedIn ? mockUser : null,
                activeLanguageCode,
                activeLanguage,
                login,
                logout,
                setActiveLanguage,
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
