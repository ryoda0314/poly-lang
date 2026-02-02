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
];

interface Props {
    value: ThemeType;
    onChange: (theme: ThemeType) => void;
    labels?: Record<ThemeType, string>;
}

export default function ThemeSwitcher({ value, onChange, labels }: Props) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: "8px",
            width: "100%",
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
                            gap: "6px",
                            padding: "10px 6px",
                            borderRadius: "12px",
                            border: isSelected
                                ? `2px solid ${theme.color}`
                                : "1px solid var(--color-border)",
                            background: "var(--color-surface)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {/* Color preview circle */}
                        <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: theme.bgPreview,
                            border: "1px solid #e0e0e0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                        }}>
                            {/* Accent color indicator */}
                            <div style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background: theme.color,
                            }} />
                            {/* Selected checkmark */}
                            {isSelected && (
                                <div style={{
                                    position: "absolute",
                                    bottom: "-2px",
                                    right: "-2px",
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    background: theme.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "2px solid var(--color-surface)",
                                }}>
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {/* Label */}
                        <span style={{
                            fontSize: "0.72rem",
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? theme.color : "var(--color-fg-muted)",
                            textAlign: "center",
                            lineHeight: 1.2,
                        }}>
                            {labels?.[theme.value] || theme.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
