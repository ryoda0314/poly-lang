"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
    const { login } = useAppStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock network
        setTimeout(() => {
            login();
            router.push("/app/dashboard");
        }, 800);
    };

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-bg)",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Decorative BG */}
            <div style={{
                position: "absolute",
                top: "-20%",
                right: "-10%",
                width: "60vw",
                height: "60vw",
                background: "radial-gradient(circle, var(--color-accent-subtle) 0%, transparent 70%)",
                opacity: 0.5,
                borderRadius: "50%",
                pointerEvents: "none"
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "var(--space-8)",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 1
                }}
            >
                <h1 style={{
                    marginBottom: "var(--space-2)",
                    fontSize: "2rem",
                    color: "var(--color-accent)"
                }}>
                    Poly.
                </h1>
                <p style={{
                    marginBottom: "var(--space-8)",
                    color: "var(--color-fg-muted)",
                    lineHeight: "1.5"
                }}>
                    A reimagined language learning workspace.
                </p>

                <form onSubmit={handleLogin}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "var(--space-3)",
                            background: "var(--color-fg)",
                            color: "var(--color-surface)",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "600",
                            opacity: loading ? 0.7 : 1,
                            transition: "transform 0.1s"
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        {loading ? "Entering..." : "Enter Studio"}
                    </button>
                </form>

                <div style={{ marginTop: "var(--space-4)", fontSize: "0.8rem", color: "var(--color-fg-muted)", textAlign: "center" }}>
                    Demo Build • No password required
                </div>
            </motion.div>
        </div>
    );
}
