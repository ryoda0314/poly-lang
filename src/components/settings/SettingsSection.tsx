import React from "react";

interface Props {
    title: string;
    children: React.ReactNode;
}

export default function SettingsSection({ title, children }: Props) {
    return (
        <div style={{ marginBottom: "var(--space-8)" }}>
            <h2 style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                marginBottom: "var(--space-4)",
                color: "var(--color-fg)"
            }}>
                {title}
            </h2>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px", // For divider effect if items have borders or bg
                background: "var(--color-border-subtle)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--color-border-subtle)"
            }}>
                {children}
            </div>
        </div>
    );
}
