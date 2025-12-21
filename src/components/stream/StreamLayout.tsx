"use client";

import React from "react";

export default function StreamLayout({ children, leftSidebar }: { children: React.ReactNode, leftSidebar?: React.ReactNode }) {
    const hasSidebar = !!leftSidebar;

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: hasSidebar ? "380px 1fr" : "1fr min(600px, 100%)",
            height: "calc(100vh - 64px)",
            background: "var(--color-bg-alt)"
        }}>
            <div style={{
                height: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
                overflow: 'hidden',
                background: hasSidebar ? 'var(--color-bg-sub)' : 'transparent',
                borderRight: hasSidebar ? '1px solid var(--color-border)' : 'none'
            }}>
                {leftSidebar && (
                    <div style={{ width: '100%', height: '100%' }}>
                        {leftSidebar}
                    </div>
                )}
            </div>

            <div style={{
                background: "var(--color-bg)",
                borderLeft: hasSidebar ? 'none' : "1px solid var(--color-border)",
                position: "relative",
                display: "flex",
                flexDirection: "column"
            }}>
                {children}
            </div>
        </div>
    );
}
