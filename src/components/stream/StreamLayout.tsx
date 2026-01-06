import React, { useState } from "react";
import styles from "./StreamLayout.module.css";
import clsx from "clsx";
import { PanelLeft } from "lucide-react";

export default function StreamLayout({ children, leftSidebar }: { children: React.ReactNode, leftSidebar?: React.ReactNode }) {
    const hasSidebar = !!leftSidebar;
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className={clsx(styles.container, hasSidebar && styles.containerWithSidebar)}>
            {/* Mobile Toggle Button */}
            {hasSidebar && (
                <button
                    className={styles.mobileToggleBtn}
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    title="Toggle Sidebar"
                >
                    <PanelLeft size={24} />
                </button>
            )}

            {/* Overlay */}
            {isMobileSidebarOpen && hasSidebar && (
                <div className={styles.overlay} onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            <div className={clsx(styles.sidebarArea, isMobileSidebarOpen && styles.sidebarMobileOpen)}>
                {leftSidebar && (
                    <div className={styles.sidebarContent}>
                        {leftSidebar}
                    </div>
                )}
            </div>

            <div className={clsx(styles.mainArea, !hasSidebar && styles.containerWithoutSidebar)}>
                {children}
            </div>
        </div>
    );
}
