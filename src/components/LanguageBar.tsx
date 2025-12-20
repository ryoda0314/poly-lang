"use client";

import React from "react";
import { useAppStore } from "@/store/app-context";
import { LANGUAGES } from "@/lib/data";
import { ChevronDown } from "lucide-react";

export default function LanguageBar() {
    const { activeLanguageCode, setActiveLanguage } = useAppStore();

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
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ color: "var(--color-fg-muted)", fontSize: "0.9rem" }}>Learning:</span>
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
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
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

            {/* Optional: User Avatar or Streak */}
            <div style={{ width: 32, height: 32, background: "var(--color-surface-hover)", borderRadius: "50%" }}></div>
        </div>
    );
}
