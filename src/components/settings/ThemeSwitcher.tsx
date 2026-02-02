"use client";

import { ThemeType } from "@/store/settings-store";

interface ThemeOption {
    value: ThemeType;
    label: string;
    color: string;
    bgPreview: string;
}

const THEMES: ThemeOption[] = [
    { value: "default", label: "Default", color: "#D94528", bgPreview: "#F9F8F4" },
    { value: "ocean", label: "Ocean", color: "#0077B6", bgPreview: "#F0F7FA" },
    { value: "forest", label: "Forest", color: "#2D6A4F", bgPreview: "#F4F7F4" },
    { value: "lavender", label: "Lavender", color: "#7C3AED", bgPreview: "#F8F6FB" },
    { value: "rose", label: "Rose", color: "#E11D48", bgPreview: "#FDF7F8" },
    { value: "amber", label: "Amber", color: "#B45309", bgPreview: "#FFFBF5" },
    { value: "mint", label: "Mint", color: "#0D9488", bgPreview: "#F0FDFA" },
    { value: "mocha", label: "Mocha", color: "#8D6E63", bgPreview: "#FAF8F5" },
];

interface Props {
    value: ThemeType;
    onChange: (theme: ThemeType) => void;
    labels?: Record<ThemeType, string>;
}

export default function ThemeSwitcher({ value, onChange, labels }: Props) {
    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
        }}>
            {THEMES.map((theme) => {
                const isSelected = value === theme.value;
                return (
                    <button
                        key={theme.value}
                        onClick={() => onChange(theme.value)}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 16px",
                            borderRadius: "16px",
                            border: isSelected
                                ? `2px solid ${theme.color}`
                                : "1.5px solid var(--color-border)",
                            background: isSelected ? theme.bgPreview : "var(--color-surface)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            flex: "1 1 60px",
                            maxWidth: "80px",
                        }}
                    >
                        {/* Color preview - mini app mockup */}
                        <div style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: theme.bgPreview,
                            border: "1px solid rgba(0,0,0,0.08)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "6px",
                            boxShadow: isSelected ? `0 2px 8px ${theme.color}25` : "none",
                        }}>
                            {/* Mini header bar */}
                            <div style={{
                                width: "100%",
                                height: "4px",
                                borderRadius: "2px",
                                background: theme.color,
                            }} />
                            {/* Mini content lines */}
                            <div style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                            }}>
                                <div style={{
                                    width: "80%",
                                    height: "3px",
                                    borderRadius: "1.5px",
                                    background: `${theme.color}40`,
                                }} />
                                <div style={{
                                    width: "60%",
                                    height: "3px",
                                    borderRadius: "1.5px",
                                    background: `${theme.color}25`,
                                }} />
                            </div>
                        </div>
                        {/* Label */}
                        <span style={{
                            fontSize: "0.75rem",
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? theme.color : "var(--color-fg-muted)",
                            textAlign: "center",
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                        }}>
                            {labels?.[theme.value] || theme.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
