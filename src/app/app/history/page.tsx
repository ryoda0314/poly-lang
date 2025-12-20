"use client";

import React from "react";
import { Clock } from "lucide-react";

export default function HistoryPage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-fg-muted)" }}>
            <Clock size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.5 }} />
            <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", color: "var(--color-fg)" }}>History</h2>
            <p>Your recent activity will be tracked here.</p>
        </div>
    );
}
