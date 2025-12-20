"use client";

import React from "react";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-fg-muted)" }}>
            <SettingsIcon size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.5 }} />
            <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", color: "var(--color-fg)" }}>Settings</h2>
            <p>Manage your learning languages and preferences.</p>
        </div>
    );
}
