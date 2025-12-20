"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supa-client";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";
import { LANGUAGES } from "@/lib/data";

export default function OnboardingPage() {
    const supabase = createClient();
    const router = useRouter();
    const { user, refreshProfile } = useAppStore();

    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("other");
    const [nativeLang, setNativeLang] = useState("ja");
    const [learningLang, setLearningLang] = useState("en");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                username,
                gender,
                native_language: nativeLang,
                learning_language: learningLang,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error(error);
            alert("Failed to save profile");
            setLoading(false);
        } else {
            await refreshProfile();
            router.push("/app/dashboard");
        }
    };

    return (
        <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "2rem" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", marginBottom: "2rem" }}>Welcome to Poly.</h1>
            <p style={{ marginBottom: "2rem", color: "var(--color-fg-muted)" }}>Tell us a bit about yourself to personalize your experience.</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Username</label>
                    <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Gender</label>
                    <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)" }}
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other / Prefer not to say</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Native Language</label>
                    <select
                        value={nativeLang}
                        onChange={e => setNativeLang(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)" }}
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Learning Language</label>
                    <select
                        value={learningLang}
                        onChange={e => setLearningLang(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)" }}
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        background: "var(--color-accent)",
                        color: "white",
                        borderRadius: "0.5rem",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        border: "none"
                    }}
                >
                    {loading ? "Saving..." : "Start Learning"}
                </button>
            </form>
        </div>
    );
}
