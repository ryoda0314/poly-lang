"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { useAppStore } from "@/store/app-context";
import { ExplorerProvider } from "@/hooks/use-explorer";
import { useRouter, usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ExplorerDrawer from "@/components/ExplorerDrawer";
import ToastContainer from "@/components/Toast";
import { useExtractionPolling } from "@/hooks/use-extraction-polling";
import styles from "./layout.module.css";

// Component that handles extraction job polling
function ExtractionJobPoller() {
    useExtractionPolling({ interval: 10000, enabled: true });
    return null;
}


function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, isLoading } = useAppStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isPWA, setIsPWA] = React.useState<boolean | null>(null);

    // Explorer is only enabled on these pages
    const explorerPages = ["/app/phrases", "/app/history", "/app/saved"];
    const showExplorer = explorerPages.includes(pathname);

    React.useEffect(() => {
        // Check if running as PWA (standalone mode)
        const standalone = window.matchMedia("(display-mode: standalone)").matches
            || (window.navigator as any).standalone === true;
        setIsPWA(standalone);

        // Redirect to install page if not in PWA mode
        if (!standalone) {
            router.push("/install");
        }
    }, [router]);

    React.useEffect(() => {
        // Wait for auth check to complete before redirecting
        if (!isLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [isLoggedIn, isLoading, router]);

    // Show nothing while checking PWA status or loading auth
    if (isPWA === null || isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
                <div>Loading...</div>
            </div>
        );
    }

    // If not PWA, don't render (redirecting to /install)
    if (!isPWA) return null;

    if (!isLoggedIn) return null;

    return (
        <div className={styles.container}>
            <div className={styles.desktopSidebar}>
                <Sidebar />
            </div>
            <main className={styles.main}>
                {/* Mobile Settings Button - Dashboard Only */}


                {children}

                <BottomNav />
                {showExplorer && <ExplorerDrawer />}
            </main>
            <ExtractionJobPoller />
            <ToastContainer />
        </div >
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <ExplorerProvider>
            <AppContent>{children}</AppContent>
        </ExplorerProvider>
    );
}
