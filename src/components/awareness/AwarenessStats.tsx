import React from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";

type Tab = 'unverified' | 'verified';

interface AwarenessStatsProps {
    counts: {
        unverified: number;
        attempted: number;
        verified: number;
    };
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export default function AwarenessStats({ counts, activeTab, onTabChange }: AwarenessStatsProps) {
    const stats: { id: Tab; label: string; value: number; icon: typeof CircleDashed; color: string }[] = [
        {
            id: "unverified",
            label: "Unverified",
            value: counts.unverified,
            icon: CircleDashed,
            color: "var(--color-fg-muted)"
        },
        {
            id: "verified",
            label: "Verified",
            value: counts.attempted + counts.verified,
            icon: CheckCircle2,
            color: "var(--color-success)"
        }
    ];

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-4)",
            marginBottom: "var(--space-6)"
        }}>
            {stats.map((stat) => {
                const isActive = activeTab === stat.id;
                return (
                    <button
                        key={stat.id}
                        onClick={() => onTabChange(stat.id)}
                        style={{
                            background: "var(--color-surface)",
                            border: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-4)",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-4)",
                            boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-sm)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            transform: isActive ? "scale(1.02)" : "scale(1)"
                        }}
                    >
                        <div style={{
                            padding: "12px",
                            borderRadius: "50%",
                            background: `color-mix(in srgb, ${stat.color} 10%, transparent)`,
                            color: stat.color,
                            display: "flex"
                        }}>
                            <stat.icon size={24} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)", fontWeight: 500 }}>
                                {stat.label}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}