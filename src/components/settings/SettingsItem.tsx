"use client";

import React, { useState } from "react";

interface Props {
    label: string;
    children?: React.ReactNode;
    description?: string;
    onClick?: () => void;
    destructive?: boolean;
}

export default function SettingsItem({ label, children, description, onClick, destructive }: Props) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => onClick && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-3) var(--space-4)",
                gap: "var(--space-3)",
                background: (onClick && hovered) ? "var(--color-surface-hover)" : "var(--color-surface)",
                cursor: onClick ? "pointer" : "default",
                minHeight: "56px",
                transition: "background 0.15s ease",
            }}
        >
            <div style={{ flex: 1, paddingRight: "var(--space-3)" }}>
                <div style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: destructive ? "var(--color-destructive)" : "var(--color-fg)"
                }}>
                    {label}
                </div>
                {description && (
                    <div style={{
                        fontSize: "0.82rem",
                        color: "var(--color-fg-muted)",
                        marginTop: "var(--space-1)",
                        lineHeight: 1.4
                    }}>
                        {description}
                    </div>
                )}
            </div>

            <div style={{ flexShrink: 0 }}>
                {children}
            </div>
        </div>
    );
}
