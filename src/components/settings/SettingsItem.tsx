import React from "react";

interface Props {
    label: string;
    children?: React.ReactNode;
    description?: string;
    onClick?: () => void;
    destructive?: boolean;
}

export default function SettingsItem({ label, children, description, onClick, destructive }: Props) {
    return (
        <div
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-4)",
                background: "var(--color-surface)",
                cursor: onClick ? "pointer" : "default",
                minHeight: "64px"
            }}
        >
            <div style={{ flex: 1, paddingRight: "var(--space-4)" }}>
                <div style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: destructive ? "var(--color-critical)" : "var(--color-fg)"
                }}>
                    {label}
                </div>
                {description && (
                    <div style={{
                        fontSize: "0.85rem",
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
