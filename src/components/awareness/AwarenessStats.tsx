import React from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { useAppStore } from "@/store/app-context";

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
    const { nativeLanguage } = useAppStore();
    const isJa = nativeLanguage === "ja";

    const stats: { id: Tab; label: string; value: number; icon: typeof CircleDashed; color: string }[] = [
        {
            id: "unverified",
            label: isJa ? "未使用" : "Unverified",
            value: counts.unverified,
            icon: CircleDashed,
            color: "#9ca3af"
        },
        {
            id: "verified",
            label: isJa ? "使用済み" : "Verified",
            value: counts.attempted + counts.verified,
            icon: CheckCircle2,
            color: "#22c55e"
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
                            background: isActive
                                ? `color-mix(in srgb, ${stat.color} 8%, white)`
                                : "var(--color-surface)",
                            border: isActive
                                ? `2px solid ${stat.color}`
                                : "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-4)",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-4)",
                            boxShadow: isActive ? `0 4px 12px color-mix(in srgb, ${stat.color} 25%, transparent)` : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            opacity: isActive ? 1 : 0.7
                        }}
                    >
                        <div style={{
                            padding: "12px",
                            borderRadius: "50%",
                            background: `color-mix(in srgb, ${stat.color} 15%, transparent)`,
                            color: stat.color,
                            display: "flex"
                        }}>
                            <stat.icon size={24} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                lineHeight: 1,
                                color: isActive ? stat.color : "var(--color-fg)"
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                color: isActive ? stat.color : "var(--color-fg-muted)",
                                fontWeight: 500
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}