"use client";

import React from "react";

export default function StreamLayout({ children, leftSidebar }: { children: React.ReactNode, leftSidebar?: React.ReactNode }) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr min(600px, 100%)", // Pushes content to the right
            height: "calc(100vh - 64px)",
            background: "var(--color-bg-alt)"
        }}>
            <div style={{ height: '100%', display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>
                {leftSidebar && (
                    <div style={{ width: '100%', maxWidth: '380px', height: '100%', background: 'var(--color-bg-sub)', borderRight: '1px solid var(--color-border)' }}>
                        {leftSidebar}
                    </div>
                )}
            </div>

            <div style={{
                background: "var(--color-bg)",
                borderLeft: "1px solid var(--color-border)",
                // borderRight: "1px solid var(--color-border)", // Right border less needed if at edge, but kept if user wants card feel? Let's remove specifically right border if it hits edge, or just keep layout simple.
                // Keeping left border is good for separation.
                position: "relative",
                display: "flex",
                flexDirection: "column"
            }}>
                {children}
            </div>
        </div>
    );
}
