import React from "react";
import { Brain, CheckCircle2, CircleDashed } from "lucide-react";

interface AwarenessStatsProps {
    counts: {
        unverified: number;
        attempted: number;
        verified: number;
    };
}

export default function AwarenessStats({ counts }: AwarenessStatsProps) {
    const stats = [
        {
            label: "Unverified",
            value: counts.unverified,
            icon: CircleDashed,
            color: "var(--color-fg-muted)",
            bg: "var(--color-surface)",
            desc: "New items found"
        },
        {
            label: "Verified",
            value: counts.attempted + counts.verified,
            icon: CheckCircle2,
            color: "var(--color-success)",
            bg: "var(--color-surface)",
            desc: "Mastered items"
        }
    ];

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-4)",
            marginBottom: "var(--space-8)"
        }}>
            {stats.map((stat) => (
                <div key={stat.label} style={{
                    background: stat.bg,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <div style={{
                        padding: "12px",
                        borderRadius: "50%",
                        background: `color-mix(in srgb, ${stat.color} 10%, transparent)`,
                        color: stat.color,
                        display: "flex"
                    }}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)", fontWeight: 500 }}>
                            {stat.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
