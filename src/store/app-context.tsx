"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { LANGUAGES, Language } from "@/lib/data";

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
    const [activeLanguageCode, setActiveLanguageCode] = useState<string>("ko");

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
        setActiveLanguageCode(code);
    };

    const activeLanguage = LANGUAGES.find(l => l.code === activeLanguageCode);

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
