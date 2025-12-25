"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { useAppStore } from "@/store/app-context";
import { ExplorerProvider } from "@/hooks/use-explorer";
import { redirect, useRouter, usePathname } from "next/navigation";
import ExplorerDrawer from "@/components/ExplorerDrawer";
import { AnimatePresence, motion } from "framer-motion";
import LanguageBar from "@/components/LanguageBar";

function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, isLoading } = useAppStore();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        // Wait for auth check to complete before redirecting
        if (!isLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [isLoggedIn, isLoading, router]);

    // Show nothing while loading or not logged in
    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
                <div>Loading...</div>
            </div>
        );
    }

    if (!isLoggedIn) return null;

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: "260px", padding: "2rem", position: "relative" }}>
                {/* LanguageBar Removed per user request */}
                {children}
                {pathname !== "/app/phrases" && <ExplorerDrawer />}
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
