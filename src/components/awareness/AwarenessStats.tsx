import React from "react";
import { CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

type Tab = 'unverified' | 'verified';

interface AwarenessStatsProps {
    counts: {
        unverified: number;
        attempted: number;
        verified: number;
        dueReviews: number;
    };
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export default function AwarenessStats({ counts, activeTab, onTabChange }: AwarenessStatsProps) {
    const { nativeLanguage } = useAppStore();
    const t: any = translations[nativeLanguage] || translations.en;

    const stats: { id: Tab; label: string; value: number; icon: typeof CircleDashed; color: string; badge?: number }[] = [
        {
            id: "unverified",
            label: t.unverified || "Unverified",
            value: counts.unverified,
            icon: CircleDashed,
            color: "#9ca3af"
        },
        {
            id: "verified",
            label: t.verified || "Verified",
            value: counts.attempted + counts.verified,
            icon: CheckCircle2,
            color: "#22c55e",
            badge: counts.dueReviews
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
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}>
                                {stat.label}
                                {stat.badge != null && stat.badge > 0 && (
                                    <span style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        padding: "2px 7px",
                                        borderRadius: "999px",
                                        background: "#f59e0b",
                                        color: "#fff",
                                        lineHeight: 1
                                    }}>
                                        <Clock size={10} />
                                        {stat.badge}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}