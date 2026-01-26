import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
    title: string;
    children: React.ReactNode;
    icon?: LucideIcon;
}

export default function SettingsSection({ title, children, icon: Icon }: Props) {
    return (
        <div style={{ marginBottom: "var(--space-6)" }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                marginBottom: "var(--space-3)",
            }}>
                {Icon && (
                    <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-accent-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <Icon size={15} color="var(--color-accent)" />
                    </div>
                )}
                <h2 style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--color-fg-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-body)",
                    margin: 0,
                }}>
                    {title}
                </h2>
            </div>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                background: "var(--color-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
            }}>
                {children}
            </div>
        </div>
    );
}
