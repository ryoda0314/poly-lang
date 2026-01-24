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
import { translations } from "@/lib/translations";

export default function SettingsPage() {
    const { user, profile, refreshProfile, logout, setNativeLanguage: setGlobalNativeLang, nativeLanguage: currentNativeLang } = useAppStore();
    const router = useRouter();
    const supabase = createClient();

    const t = translations[currentNativeLang] || translations.ja;

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
            console.log("SettingsPage: Syncing from profile", profile);

            setUsername(profile.username || "");
            setGender(profile.gender || "unspecified");
            setLearningLang(profile.learning_language || "en");
            setNativeLang(profile.native_language || "ja");

            // Sync settings from DB if they exist.
            const dbSettings = profile.settings;
            console.log("SettingsPage: Found dbSettings", dbSettings);

            if (dbSettings && typeof dbSettings === 'object') {
                // Get the syncFromDB function directly to avoid dependency issues
                useSettingsStore.getState().syncFromDB(dbSettings as any);
            }
        }
    }, [profile]); // Removed 'settings' to prevent infinite loop

    // Update DB with profile fields
    const updateProfile = async (updates: { username?: string, gender?: string, learning_language?: string, native_language?: string }) => {
        console.log("updateProfile: Starting with updates:", updates);
        if (!user) {
            console.log("updateProfile: No user, returning early");
            return;
        }
        try {
            console.log("updateProfile: Calling supabase update...");
            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id);
            console.log("updateProfile: Supabase update completed, error:", error);
            if (error) throw error;

            // If native language changed, update global state immediately
            if (updates.native_language && updates.native_language !== currentNativeLang) {
                setGlobalNativeLang(updates.native_language as any);
            }

            console.log("updateProfile: Calling refreshProfile...");
            await refreshProfile();
            console.log("updateProfile: Done");
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    // Separate function to persist SETTINGS to DB
    const persistSettings = async (newSettings: Partial<typeof settings>) => {
        if (!user) return null;

        // Merge with current state to ensure valid json
        const snapshot = {
            baseSetCount: newSettings.baseSetCount ?? settings.baseSetCount,
            compareSetCount: newSettings.compareSetCount ?? settings.compareSetCount,
            reminderEnabled: newSettings.reminderEnabled ?? settings.reminderEnabled,
            reminderTime: newSettings.reminderTime ?? settings.reminderTime,
            weeklySummaryEnabled: newSettings.weeklySummaryEnabled ?? settings.weeklySummaryEnabled,
            hideHighConfidenceColors: newSettings.hideHighConfidenceColors ?? settings.hideHighConfidenceColors,
            defaultPhraseView: (newSettings as any).defaultPhraseView ?? settings.defaultPhraseView,
        };

        console.log("Persisting settings snapshot:", snapshot);

        try {
            const { data, error } = await supabase
                .from("profiles")
                .update({ settings: snapshot })
                .eq("id", user.id)
                .select(); // Return modified rows to verify

            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }
            console.log("Supabase update success, returned:", data);
            return data;
        } catch (err) {
            console.error("Failed to persist settings", err);
            return null; // Signal failure
        }
    };

    const handleUsernameBlur = () => {
        if (username !== profile?.username) {
            updateProfile({ username });
        }
    };

    // Manual Save Handler
    const handleManualSave = async () => {
        console.log("Step 1: Manual Save triggered");
        if (!user) {
            alert("Error: No user found. Please log in again.");
            return;
        }

        try {
            // SKIP profile update for now - go directly to settings
            console.log("Step 2: Skipping updateProfile, going directly to persistSettings...");

            // 2. Save Settings Store ONLY
            const savedData = await persistSettings({});
            console.log("Step 3: persistSettings completed, data:", savedData);

            if (savedData && savedData.length > 0) {
                alert(t.saveSuccess);
                await refreshProfile(); // Refresh after success
            } else if (savedData && savedData.length === 0) {
                alert(t.saveFailed + " : DB returned 0 updated rows.");
            } else {
                alert(t.saveFailed);
            }

        } catch (e) {
            console.error("Manual save failed", e);
            alert(t.saveFailed);
        }
    };

    return (
        <div style={{ height: "100%", overflowY: "auto", width: "100%" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-6) var(--space-4)", paddingBottom: "100px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
                    <Link href="/app/phrases" style={{
                        color: "var(--color-fg-muted)",
                        padding: "8px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)"
                    }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{t.settings}</h1>
                </div>

                {/* Account Section */}
                <SettingsSection title={t.account}>
                    <SettingsItem label={t.username}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onBlur={handleUsernameBlur}
                            style={{
                                background: "transparent",
                                border: "none",
                                textAlign: "right",
                                fontFamily: "inherit",
                                fontSize: "1rem",
                                color: "var(--color-fg-muted)",
                                width: "150px"
                            }}
                            placeholder={t.setUsername}
                        />
                    </SettingsItem>
                    <SettingsItem label={t.gender}>
                        <select
                            value={gender}
                            onChange={(e) => {
                                const newGender = e.target.value;
                                setGender(newGender);
                                updateProfile({ gender: newGender });
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                textAlign: "right",
                                fontFamily: "inherit",
                                color: "var(--color-fg-muted)",
                                fontSize: "1rem",
                                cursor: "pointer"
                            }}
                        >
                            <option value="unspecified">{t.genderUnspecified}</option>
                            <option value="male">{t.genderMale}</option>
                            <option value="female">{t.genderFemale}</option>
                            <option value="other">{t.genderOther}</option>
                        </select>
                    </SettingsItem>
                </SettingsSection>

                {/* Learning Profile Section */}
                <SettingsSection title={t.learningProfile}>
                    <SettingsItem label={t.learningLanguage} description={t.learningLanguageDescription}>
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
                                fontFamily: "inherit",
                                color: "var(--color-fg-muted)",
                                fontSize: "1rem",
                                cursor: "pointer"
                            }}
                        >
                            {LANGUAGES.filter(l => l.code !== nativeLang).map(l => (
                                <option key={l.code} value={l.code}>
                                    {(t as any)[`language_${l.code}`] || l.name}
                                </option>
                            ))}
                        </select>
                    </SettingsItem>
                    <SettingsItem label={t.nativeLanguage} description={t.nativeLanguageDescription}>
                        <select
                            value={nativeLang}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNativeLang(val);
                                updateProfile({ native_language: val });
                                if (val === 'ja' || val === 'ko' || val === 'en') {
                                    setGlobalNativeLang(val as "ja" | "ko" | "en");
                                }
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                textAlign: "right",
                                fontFamily: "inherit",
                                color: "var(--color-fg-muted)",
                                fontSize: "1rem",
                                cursor: "pointer"
                            }}
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>
                                    {l.nativeName}
                                </option>
                            ))}
                        </select>
                    </SettingsItem>

                    <SettingsItem label={t.dailyGoal}>
                        <select
                            value={settings.baseSetCount}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                settings.setBaseSetCount(val);
                                persistSettings({ baseSetCount: val });
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                textAlign: "right",
                                fontFamily: "inherit",
                                fontSize: "1rem",
                                color: "var(--color-fg-muted)",
                                cursor: "pointer"
                            }}
                        >
                            <option value={3}>3 {t.words}</option>
                            <option value={5}>5 {t.words}</option>
                            <option value={10}>10 {t.words}</option>
                        </select>
                    </SettingsItem>

                    <SettingsItem label={(t as any).hideHighConfidenceColors || "習得済みの色を非表示"} description={(t as any).hideHighConfidenceColorsDesc || "「理解済み」の単語の緑色ハイライトを非表示にします"}>
                        <input
                            type="checkbox"
                            checked={settings.hideHighConfidenceColors}
                            onChange={(e) => {
                                settings.setHideHighConfidenceColors(e.target.checked);
                                persistSettings({ hideHighConfidenceColors: e.target.checked });
                            }}
                            style={{ transform: "scale(1.2)", cursor: "pointer" }}
                        />
                    </SettingsItem>

                    <SettingsItem label={(t as any).defaultPhraseView || "フレーズ表示"} description={(t as any).defaultPhraseViewDesc || "ナビゲーションに表示するページを選択"}>
                        <select
                            value={settings.defaultPhraseView}
                            onChange={(e) => {
                                const val = e.target.value as 'history' | 'my-phrases';
                                settings.setDefaultPhraseView(val);
                                persistSettings({ defaultPhraseView: val } as any);
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                textAlign: "right",
                                fontFamily: "inherit",
                                fontSize: "1rem",
                                color: "var(--color-fg-muted)",
                                cursor: "pointer"
                            }}
                        >
                            <option value="history">{(t as any).history || "履歴"}</option>
                            <option value="my-phrases">{(t as any).myPhrases || "保存済み"}</option>
                        </select>
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
                <SettingsSection title={t.supportLegal}>
                    <SettingsItem label={t.privacyPolicy} onClick={() => window.open("#", "_blank")}>
                        <ExternalLink size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem label={t.termsOfService} onClick={() => window.open("#", "_blank")}>
                        <ExternalLink size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem label={t.contactSupport} onClick={() => window.open("#", "_blank")}>
                        <ExternalLink size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem label={t.reportSafety} onClick={() => window.open("#", "_blank")} description={t.reportSafetyDesc}>
                        <ExternalLink size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                </SettingsSection>

                {/* Tutorial Button */}
                <div style={{ marginBottom: "var(--space-4)" }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('poly_onboarding_completed');
                            router.push('/app/dashboard');
                        }}
                        style={{
                            width: "100%",
                            padding: "1rem",
                            background: "var(--color-surface)",
                            color: "var(--color-fg)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                            fontWeight: 600,
                            border: "1px solid var(--color-border)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "var(--space-2)"
                        }}
                    >
                        {(t as any).showTutorial || "チュートリアルを見る"}
                    </button>
                </div>

                {/* Save Button */}
                <div style={{ marginBottom: "var(--space-8)", position: "relative", zIndex: 10 }}>
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
                        {t.saveSettings}
                    </button>
                </div>

                {/* 5. Account Actions */}
                <SettingsSection title={t.account}>
                    <SettingsItem label={t.logoutButton} destructive onClick={logout} />
                </SettingsSection>



                <div style={{ textAlign: "center", marginTop: "var(--space-8)", color: "var(--color-fg-muted)", fontSize: "0.8rem" }}>
                    {t.version}
                </div>
            </div>
        </div>
    );
}
