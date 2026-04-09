"use client";

import React from "react";
import { useAppStore } from "@/store/app-context";
import { LANGUAGES } from "@/lib/data";
import { ChevronDown } from "lucide-react";

import { translations } from "@/lib/translations";

export default function LanguageBar() {
    const { activeLanguageCode, setActiveLanguage, nativeLanguage, speakingGender, setSpeakingGender } = useAppStore();
    const t = translations[nativeLanguage];

    // Simple select for MVP or a custom dropdown
    // "Dashboard includes a language select bar"

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-6)",
            paddingBottom: "var(--space-4)",
            borderBottom: "1px solid var(--color-border)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ color: "var(--color-fg-muted)", fontSize: "0.9rem" }}>{t.learningLabel}</span>
                    <div style={{ position: "relative" }}>
                        <select
                            value={activeLanguageCode}
                            onChange={(e) => setActiveLanguage(e.target.value)}
                            style={{
                                appearance: "none",
                                background: "transparent",
                                border: "none",
                                fontSize: "1.2rem",
                                fontFamily: "var(--font-display)",
                                fontWeight: "700",
                                color: "var(--color-fg)",
                                cursor: "pointer",
                                paddingRight: "1.5rem"
                            }}
                        >
                            {LANGUAGES.filter(lang => lang.code !== nativeLanguage).map(lang => (
                                <option key={lang.code} value={lang.code}>{(t as any)[`language_${lang.code}`] || lang.name}</option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            style={{
                                position: "absolute",
                                right: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                color: "var(--color-accent)"
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Level & XP Display */}
            <UserLevelDisplay />
        </div>
    );
}

function UserLevelDisplay() {
    const { userProgress } = useAppStore();

    if (!userProgress) {
        return (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-surface-hover)" }} />
                <div style={{ width: 80, height: 8, borderRadius: 4, background: "var(--color-surface-hover)" }} />
            </div>
        );
    }

    const { xp_total, current_level, next_level_xp } = userProgress;

    // Calculate progress percentage
    // Assuming levels are linear or we have previous level threshold.
    // For simplicity, let's just show progress to next_level_xp from 0 (or improved later)
    // Ideally we need: current_level_start_xp to calculate strict progress bar within the level.
    // For now: (xp_total / next_level_xp) * 100 might be incorrect if thresholds are cumulative.

    // But since next_level_xp from our fetcher is the TOTAL threshold for next level:
    // We need the previous level threshold to normalize the progress bar.
    // Let's assume a simple calculation or fetch it in fetchUserProgress.
    // For now, let's just make it visually simple: XP Total / Next Goal

    // Better approximation if we assume thresholds increase.
    // Let's just use xp_total / next_level_xp as a rough gauge if we don't have prev threshold.
    // Or just display "XP: 1200 / 2000" text.

    const progressPercent = next_level_xp ? Math.min(100, (xp_total / next_level_xp) * 100) : 0;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Level {current_level}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)", fontFamily: "var(--font-mono)" }}>
                        {xp_total} <span style={{ opacity: 0.5 }}>/ {next_level_xp} XP</span>
                    </div>
                </div>
            </div>

            <div style={{ position: "relative", width: "42px", height: "42px" }}>
                <svg width="42" height="42" viewBox="0 0 42 42">
                    <circle
                        cx="21" cy="21" r="18"
                        fill="none"
                        stroke="var(--color-surface-hover)"
                        strokeWidth="4"
                    />
                    <circle
                        cx="21" cy="21" r="18"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                        strokeDasharray="113"
                        strokeDashoffset={113 - (113 * progressPercent) / 100}
                        transform="rotate(-90 21 21)"
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                </svg>
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "0.9rem", color: "var(--color-fg)"
                }}>
                    {current_level}
                </div>
            </div>
        </div>
    );
}
