"use client";

import React from "react";
import { useAppStore } from "@/store/app-context";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const { user, profile, activeLanguageCode } = useAppStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 style={{ fontSize: "3rem", marginBottom: "var(--space-4)", color: "var(--color-fg)" }}>
                Welcome back, {profile?.username || user?.email?.split("@")[0] || "Learner"}.
            </h1>
            <p style={{ fontSize: "1.2rem", color: "var(--color-fg-muted)", maxWidth: "600px", lineHeight: 1.6 }}>
                You are currently focusing on <strong style={{ color: "var(--color-accent)" }}>{activeLanguageCode.toUpperCase()}</strong>.
                Head over to the <a href="/app/phrases" style={{ textDecoration: "underline", color: "var(--color-fg)" }}>Phrases</a> section
                to continue your immersion.
            </p>

            <div style={{ marginTop: "var(--space-12)", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
                {/* Placeholder Stats */}
                {['Daily Goal', 'Words Seen', 'Streak'].map((label, i) => (
                    <div key={i} style={{ padding: "var(--space-4)", background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                        <div style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", marginBottom: "var(--space-2)" }}>{label}</div>
                        <div style={{ fontSize: "2rem", fontFamily: "var(--font-display)", fontWeight: "700" }}>{i === 2 ? "3 days" : "120"}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
