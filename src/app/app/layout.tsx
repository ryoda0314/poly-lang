"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { useAppStore } from "@/store/app-context";
import { ExplorerProvider } from "@/hooks/use-explorer";
import { redirect, useRouter } from "next/navigation";
import ExplorerDrawer from "@/components/ExplorerDrawer";
import { AnimatePresence, motion } from "framer-motion";
import LanguageBar from "@/components/LanguageBar";

function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useAppStore();
    const router = useRouter();

    React.useEffect(() => {
        // Quick client-side check. In real app, Middleware is better.
        if (!isLoggedIn) {
            router.push("/login");
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn) return null; // Or loading spinner

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: "260px", padding: "2rem", position: "relative" }}>
                <LanguageBar />
                {children}
                <ExplorerDrawer />
            </main>
        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <ExplorerProvider>
            <AppContent>{children}</AppContent>
        </ExplorerProvider>
    );
}
