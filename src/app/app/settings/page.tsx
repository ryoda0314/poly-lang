"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useSettingsStore } from "@/store/settings-store";
import { createClient } from "@/lib/supa-client";
import { LANGUAGES } from "@/lib/data";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsItem from "@/components/settings/SettingsItem";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { user, profile, refreshProfile, logout } = useAppStore();
    const router = useRouter();
    const supabase = createClient();

    const settings = useSettingsStore();

    // Local state for profile fields to handle editing
    // Initialize with profile data when available
    const [username, setUsername] = useState(profile?.username || "");
    const [gender, setGender] = useState(profile?.gender || "unspecified");
    const [learningLang, setLearningLang] = useState(profile?.learning_language || "en");
    const [nativeLang, setNativeLang] = useState(profile?.native_language || "ja");

    // Sync local state when profile loads
    useEffect(() => {
        if (profile) {
            setUsername(profile.username || "");
            setGender(profile.gender || "unspecified");
            setLearningLang(profile.learning_language || "en");
            setNativeLang(profile.native_language || "ja");

            // Sync settings from DB if they exist
            const dbSettings = (profile as any).settings;
            if (dbSettings) {
                settings.syncFromDB(dbSettings);
            }
        }
    }, [profile, settings]);

    // Update DB with profile fields
    const updateProfile = async (updates: { username?: string, gender?: string, learning_language?: string, native_language?: string }) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id);
            if (error) throw error;
            await refreshProfile();
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    // Separate function to persist SETTINGS to DB
    const persistSettings = async (newSettings: Partial<typeof settings>) => {
        if (!user) return;

        // Merge with current state to ensure valid json
        const snapshot = {
            baseSetCount: newSettings.baseSetCount ?? settings.baseSetCount,
            compareSetCount: newSettings.compareSetCount ?? settings.compareSetCount,
            reminderEnabled: newSettings.reminderEnabled ?? settings.reminderEnabled,
            reminderTime: newSettings.reminderTime ?? settings.reminderTime,
            weeklySummaryEnabled: newSettings.weeklySummaryEnabled ?? settings.weeklySummaryEnabled,
        };

        try {
            await supabase
                .from("profiles")
                .update({ settings: snapshot } as any) // Type cast for new column
                .eq("id", user.id);
            // No need to refresh profile immediately for this, as local store is source of truth for UI
        } catch (err) {
            console.error("Failed to persist settings", err);
        }
    };

    const handleUsernameBlur = () => {
        if (username !== profile?.username) {
            updateProfile({ username });
        }
    };

    // Manual Save Handler
    const handleManualSave = async () => {
        if (!user) return;

        // 1. Save Profile Fields
        await updateProfile({
            username,
            gender,
            learning_language: learningLang,
            native_language: nativeLang
        });

        // 2. Save Settings Store
        await persistSettings({});

        alert("Settings saved successfully!");
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-6) var(--space-4)", paddingBottom: "100px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
                <Link href="/app/phrases" style={{
                    padding: "8px", borderRadius: "50%", background: "var(--color-surface)", color: "var(--color-fg)", display: "flex"
                }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Settings</h1>
            </div>

            {/* 1. Profile Section */}
            <SettingsSection title="Profile">
                <SettingsItem label="Username">
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={handleUsernameBlur}
                        style={{
                            background: "transparent",
                            border: "none",
                            textAlign: "right",
                            color: "var(--color-fg-muted)",
                            fontSize: "1rem",
                            width: "150px",
                        }}
                        placeholder="Set username"
                    />
                </SettingsItem>
                <SettingsItem label="Gender">
                    <select
                        value={gender}
                        onChange={(e) => {
                            setGender(e.target.value);
                            updateProfile({ gender: e.target.value });
                        }}
                        style={{
                            background: "transparent",
                            border: "none",
                            textAlign: "right",
                            color: "var(--color-fg-muted)",
                            fontSize: "1rem",
                            direction: "rtl"
                        }}
                    >
                        <option value="unspecified">Unspecified / No Answer</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </SettingsItem>
            </SettingsSection>

            {/* 2. Learning Section */}
            <SettingsSection title="Learning">
                <SettingsItem label="Learning Language" description="The language you are studying.">
                    <select
                        value={learningLang}
                        onChange={(e) => {
                            setLearningLang(e.target.value);
                            updateProfile({ learning_language: e.target.value });
                        }}
                        style={{
                            background: "transparent",
                            border: "none",
                            textAlign: "right",
                            color: "var(--color-fg-muted)",
                            fontSize: "1rem",
                            direction: "rtl"
                        }}
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </SettingsItem>
                <SettingsItem label="Native Language" description="Your primary language for translations.">
                    <select
                        value={nativeLang}
                        onChange={(e) => {
                            setNativeLang(e.target.value);
                            updateProfile({ native_language: e.target.value });
                        }}
                        style={{
                            background: "transparent",
                            border: "none",
                            textAlign: "right",
                            color: "var(--color-fg-muted)",
                            fontSize: "1rem",
                            direction: "rtl"
                        }}
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </SettingsItem>

                <SettingsItem label="Base Set Count" description="Number of context sentences to show.">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={() => {
                                const val = Math.max(1, settings.baseSetCount - 1);
                                settings.setBaseSetCount(val);
                                persistSettings({ baseSetCount: val });
                            }}
                            style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer" }}
                        >-</button>
                        <span style={{ minWidth: "20px", textAlign: "center", color: "var(--color-fg-muted)" }}>{settings.baseSetCount}</span>
                        <button
                            onClick={() => {
                                const val = settings.baseSetCount + 1;
                                settings.setBaseSetCount(val);
                                persistSettings({ baseSetCount: val });
                            }}
                            style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer" }}
                        >+</button>
                    </div>
                </SettingsItem>

                <SettingsItem label="Compare Set Count" description="Number of comparison sentences. Higher values may increase generation time.">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={() => {
                                const val = Math.max(1, settings.compareSetCount - 1);
                                settings.setCompareSetCount(val);
                                persistSettings({ compareSetCount: val });
                            }}
                            style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer" }}
                        >-</button>
                        <span style={{ minWidth: "20px", textAlign: "center", color: "var(--color-fg-muted)" }}>{settings.compareSetCount}</span>
                        <button
                            onClick={() => {
                                const val = settings.compareSetCount + 1;
                                settings.setCompareSetCount(val);
                                persistSettings({ compareSetCount: val });
                            }}
                            style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer" }}
                        >+</button>
                    </div>
                </SettingsItem>
            </SettingsSection>

            {/* 3. Notification Section (Mock) */}
            <SettingsSection title="Notifications">
                <SettingsItem label="Study Reminders" description="Receive a daily notification to study.">
                    <input
                        type="checkbox"
                        checked={settings.reminderEnabled}
                        onChange={(e) => {
                            if (e.target.checked) {
                                // Mock permission request
                                const allow = confirm("Poly-lang would like to send you notifications.");
                                if (allow) {
                                    settings.setReminderEnabled(true);
                                    persistSettings({ reminderEnabled: true });
                                }
                            } else {
                                settings.setReminderEnabled(false);
                                persistSettings({ reminderEnabled: false });
                            }
                        }}
                        style={{ transform: "scale(1.2)", cursor: "pointer" }}
                    />
                </SettingsItem>
                {settings.reminderEnabled && (
                    <SettingsItem label="Reminder Time">
                        <input
                            type="time"
                            value={settings.reminderTime}
                            onChange={(e) => {
                                settings.setReminderTime(e.target.value)
                                persistSettings({ reminderTime: e.target.value });
                            }}
                            style={{
                                background: "var(--color-bg-subtle)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                color: "var(--color-fg)"
                            }}
                        />
                    </SettingsItem>
                )}
                <SettingsItem label="Weekly Summary" description="Get a weekly report of your progress.">
                    <input
                        type="checkbox"
                        checked={settings.weeklySummaryEnabled}
                        onChange={(e) => {
                            settings.setWeeklySummaryEnabled(e.target.checked)
                            persistSettings({ weeklySummaryEnabled: e.target.checked });
                        }}
                        style={{ transform: "scale(1.2)", cursor: "pointer" }}
                    />
                </SettingsItem>
            </SettingsSection>

            {/* 4. Support & Legal */}
            <SettingsSection title="Support & Legal">
                <SettingsItem label="Privacy Policy" onClick={() => window.open("#", "_blank")}>
                    <ExternalLink size={16} color="var(--color-fg-muted)" />
                </SettingsItem>
                <SettingsItem label="Terms of Service" onClick={() => window.open("#", "_blank")}>
                    <ExternalLink size={16} color="var(--color-fg-muted)" />
                </SettingsItem>
                <SettingsItem label="Contact Support" onClick={() => window.open("#", "_blank")}>
                    <ExternalLink size={16} color="var(--color-fg-muted)" />
                </SettingsItem>
                <SettingsItem label="Report Safety Issue" onClick={() => window.open("#", "_blank")} description="Report inappropriate content or output.">
                    <ExternalLink size={16} color="var(--color-fg-muted)" />
                </SettingsItem>
            </SettingsSection>

            {/* Save Button */}
            <div style={{ marginBottom: "var(--space-8)" }}>
                <button
                    onClick={handleManualSave}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        background: "var(--color-fg)",
                        color: "var(--color-bg)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "var(--shadow-md)"
                    }}
                >
                    Save Settings
                </button>
            </div>

            {/* 5. Account Actions */}
            <SettingsSection title="Account">
                <SettingsItem label="Log Out" destructive onClick={logout} />
            </SettingsSection>

            <div style={{ textAlign: "center", marginTop: "var(--space-8)", color: "var(--color-fg-muted)", fontSize: "0.8rem" }}>
                Poly-lang v0.1.0 (MVP)
            </div>
        </div>
    );
}
