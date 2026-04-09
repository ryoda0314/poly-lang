"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { createClient } from "@/lib/supa-client";
import { translations, NativeLanguage } from "@/lib/translations";

interface UsernamePromptModalProps {
    userId: string;
    nativeLanguage: NativeLanguage;
    onComplete: () => void;
}

export function UsernamePromptModal({ userId, nativeLanguage, onComplete }: UsernamePromptModalProps) {
    const [username, setUsername] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const t = translations[nativeLanguage] || translations.en;
    const supabase = createClient();

    const handleSave = async () => {
        const trimmed = username.trim();
        if (!trimmed || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await supabase
                .from("profiles")
                .update({ username: trimmed })
                .eq("id", userId);
            onComplete();
        } catch {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "1rem",
            }}
        >
            <div
                style={{
                    background: "var(--color-bg)",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "360px",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                }}>
                    <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--color-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        flexShrink: 0,
                    }}>
                        <User size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                        {(t as any).setUsername}
                    </h3>
                </div>

                {/* Content */}
                <div style={{ padding: "1.5rem" }}>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={(t as any).enterUsername}
                        maxLength={30}
                        style={{
                            width: "100%",
                            padding: "0.875rem 1rem",
                            border: "2px solid var(--color-border)",
                            borderRadius: "12px",
                            background: "var(--color-bg)",
                            color: "var(--color-fg)",
                            fontSize: "1rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                        }}
                    />
                </div>

                {/* Footer */}
                <div style={{ padding: "0 1.5rem 1.5rem" }}>
                    <button
                        onClick={handleSave}
                        disabled={!username.trim() || isSubmitting}
                        style={{
                            width: "100%",
                            padding: "0.875rem",
                            background: username.trim() ? "var(--color-accent)" : "var(--color-border)",
                            border: "none",
                            borderRadius: "12px",
                            cursor: username.trim() ? "pointer" : "not-allowed",
                            color: "white",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            transition: "all 0.2s",
                        }}
                    >
                        {isSubmitting ? "..." : (t as any).save}
                    </button>
                </div>
            </div>
        </div>
    );
}
