"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supa-client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const { login, isLoggedIn } = useAppStore(); // We still use this to update local state if needed
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    React.useEffect(() => {
        if (isLoggedIn) {
            router.push("/app");
        }
    }, [isLoggedIn, router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Success
                // login(); // AppContext listens to onAuthStateChange so this might be redundant but harmless
                router.push("/app");
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // Success
                setMessage("Check your email for the confirmation link!");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
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
                    {isLogin ? "A reimagined language learning workspace." : "Join the workspace."}
                </p>

                {error && (
                    <div style={{ padding: "0.75rem", background: "#fee2e2", color: "#ef4444", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        {error}
                    </div>
                )}
                {message && (
                    <div style={{ padding: "0.75rem", background: "#dcfce7", color: "#166534", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--color-border)",
                                fontSize: "1rem",
                                background: "var(--color-bg)",
                                color: "var(--color-fg)"
                            }}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--color-border)",
                                fontSize: "1rem",
                                background: "var(--color-bg)",
                                color: "var(--color-fg)"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: "0.5rem",
                            width: "100%",
                            padding: "var(--space-3)",
                            background: "var(--color-fg)",
                            color: "var(--color-surface)",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "600",
                            opacity: loading ? 0.7 : 1,
                            transition: "transform 0.1s",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Enter Studio" : "Sign Up")}
                    </button>
                </form>

                <div style={{ marginTop: "var(--space-6)", fontSize: "0.9rem", color: "var(--color-fg-muted)", textAlign: "center" }}>
                    New here?{" "}
                    <a
                        href="/register"
                        style={{
                            color: "var(--color-accent)",
                            fontWeight: 600,
                            textDecoration: "none"
                        }}
                    >
                        Create account
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
