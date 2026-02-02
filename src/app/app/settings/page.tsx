"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useSettingsStore } from "@/store/settings-store";
import { createClient } from "@/lib/supa-client";
import { LANGUAGES, TTS_VOICES } from "@/lib/data";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsItem from "@/components/settings/SettingsItem";
import { ArrowLeft, ChevronRight, Lock, X, User, GraduationCap, Volume2, BookOpen, HelpCircle, LogOut, Palette } from "lucide-react";
import ThemeSwitcher from "@/components/settings/ThemeSwitcher";
import { ThemeType } from "@/store/settings-store";
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
    const [isMobile, setIsMobile] = useState(false);
    const [voiceGenderFilter, setVoiceGenderFilter] = useState<"all" | "female" | "male">("all");
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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
            if (updates.native_language) {
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

        // Preserve existing DB settings (including inventory from shop purchases)
        const existingDbSettings = (profile?.settings as Record<string, unknown>) || {};

        // Merge with current state to ensure valid json
        const snapshot = {
            ...existingDbSettings,
            hideHighConfidenceColors: newSettings.hideHighConfidenceColors ?? settings.hideHighConfidenceColors,
            hideMediumConfidenceColors: (newSettings as any).hideMediumConfidenceColors ?? settings.hideMediumConfidenceColors,
            hideLowConfidenceColors: (newSettings as any).hideLowConfidenceColors ?? settings.hideLowConfidenceColors,
            defaultPhraseView: (newSettings as any).defaultPhraseView ?? settings.defaultPhraseView,
            ttsVoice: (newSettings as any).ttsVoice ?? settings.ttsVoice,
            playbackSpeed: (newSettings as any).playbackSpeed ?? settings.playbackSpeed,
            ttsLearnerMode: (newSettings as any).ttsLearnerMode ?? settings.ttsLearnerMode,
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

    return (
        <div style={{ height: "100%", overflowY: "auto", width: "100%", overscrollBehavior: "contain" }}>
            <div style={{ maxWidth: "640px", margin: "0 auto", padding: isMobile ? "var(--space-4) var(--space-3)" : "var(--space-6) var(--space-4)", paddingBottom: "120px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
                    <Link href="/app" style={{
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
                <SettingsSection title={t.account} icon={User}>
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

                {/* Theme Section */}
                <SettingsSection title={(t as any).themeSettings || "Theme"} icon={Palette}>
                    <SettingsItem label={(t as any).themeDescription || "Change app appearance"}>
                        <div style={{ width: "100%" }} />
                    </SettingsItem>
                    <div style={{ padding: "0 var(--space-4) var(--space-4)" }}>
                        <ThemeSwitcher
                            value={settings.theme}
                            onChange={(theme: ThemeType) => {
                                settings.setTheme(theme);
                                persistSettings({ theme } as any);
                            }}
                            labels={{
                                default: (t as any).themeDefault || "Default",
                                ocean: (t as any).themeOcean || "Ocean",
                                forest: (t as any).themeForest || "Forest",
                                lavender: (t as any).themeLavender || "Lavender",
                                rose: (t as any).themeRose || "Rose",
                            }}
                        />
                    </div>
                </SettingsSection>

                {/* Learning Profile Section */}
                <SettingsSection title={t.learningProfile} icon={GraduationCap}>
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
                                // Update global native language
                                setGlobalNativeLang(val as any);
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

                    <SettingsItem label={(t as any).tokenHighlight || "Token Highlight"} description={(t as any).tokenHighlightDesc || "Toggle highlight colors based on confidence level"}>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {([
                                { key: "high", color: "#22c55e", bg: "#dcfce7", label: (t as any).confidenceHigh || "高" },
                                { key: "medium", color: "#f97316", bg: "#ffedd5", label: (t as any).confidenceMedium || "中" },
                                { key: "low", color: "#ef4444", bg: "#fee2e2", label: (t as any).confidenceLow || "低" },
                            ] as const).map(({ key, color, bg, label }) => {
                                const isHidden = key === "high" ? settings.hideHighConfidenceColors
                                    : key === "medium" ? settings.hideMediumConfidenceColors
                                    : settings.hideLowConfidenceColors;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            const newVal = !isHidden;
                                            if (key === "high") {
                                                settings.setHideHighConfidenceColors(newVal);
                                                persistSettings({ hideHighConfidenceColors: newVal });
                                            } else if (key === "medium") {
                                                settings.setHideMediumConfidenceColors(newVal);
                                                persistSettings({ hideMediumConfidenceColors: newVal } as any);
                                            } else {
                                                settings.setHideLowConfidenceColors(newVal);
                                                persistSettings({ hideLowConfidenceColors: newVal } as any);
                                            }
                                        }}
                                        style={{
                                            padding: "4px 12px",
                                            borderRadius: "16px",
                                            border: isHidden ? "1px solid var(--color-border)" : `1.5px solid ${color}`,
                                            background: isHidden ? "transparent" : bg,
                                            color: isHidden ? "var(--color-fg-muted)" : color,
                                            fontSize: "0.82rem",
                                            fontWeight: isHidden ? 400 : 700,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            textDecoration: isHidden ? "line-through" : "none",
                                            opacity: isHidden ? 0.5 : 1,
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
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

                {/* Voice Settings */}
                <SettingsSection title={(t as any).voiceSettings || "音声設定"} icon={Volume2}>
                    {(() => {
                        const inventory = (profile?.settings as any)?.inventory || [];
                        const hasAudioPremium = inventory.includes("audio_premium");
                        const currentVoice = TTS_VOICES.find(v => v.name === settings.ttsVoice) || TTS_VOICES.find(v => v.name === "Kore")!;
                        const voiceLabelKey = `voiceLabel_${currentVoice.label.split(/[-\s]/).map(w => w[0].toUpperCase() + w.slice(1)).join("")}`;
                        const localizedLabel = (t as any)[voiceLabelKey] || currentVoice.label;

                        if (!hasAudioPremium) {
                            return (
                                <SettingsItem
                                    label={(t as any).voiceSelect || "ボイス選択"}
                                    description={`Kore (${localizedLabel})`}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Lock size={14} color="var(--color-fg-muted)" />
                                        <Link
                                            href="/app/shop"
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#06b6d4",
                                                fontWeight: 600,
                                                textDecoration: "none",
                                            }}
                                        >
                                            {(t as any).goToShop || "ショップへ"}
                                        </Link>
                                    </div>
                                </SettingsItem>
                            );
                        }

                        return (
                            <SettingsItem
                                label={(t as any).voiceSelect || "ボイス選択"}
                                description={`${currentVoice.name} (${localizedLabel})`}
                                onClick={() => setShowVoiceModal(true)}
                            >
                                <ChevronRight size={16} color="var(--color-fg-muted)" />
                            </SettingsItem>
                        );
                    })()}

                    {/* Playback Speed */}
                    {(() => {
                        const inventory = (profile?.settings as any)?.inventory || [];
                        const hasAudioPremium = inventory.includes("audio_premium");

                        if (!hasAudioPremium) {
                            return (
                                <SettingsItem
                                    label={(t as any).playbackSpeed || "再生スピード"}
                                    description="1.0x"
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Lock size={14} color="var(--color-fg-muted)" />
                                        <Link
                                            href="/app/shop"
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#06b6d4",
                                                fontWeight: 600,
                                                textDecoration: "none",
                                            }}
                                        >
                                            {(t as any).goToShop || "ショップへ"}
                                        </Link>
                                    </div>
                                </SettingsItem>
                            );
                        }

                        return (
                            <SettingsItem
                                label={(t as any).playbackSpeed || "再生スピード"}
                                description={(t as any).playbackSpeedDesc || "音声の再生速度を変更"}
                            >
                                <div style={{ display: "flex", gap: "6px" }}>
                                    {[0.75, 1.0, 1.25].map((speed) => {
                                        const isActive = settings.playbackSpeed === speed;
                                        return (
                                            <button
                                                key={speed}
                                                onClick={() => {
                                                    settings.setPlaybackSpeed(speed);
                                                    persistSettings({ playbackSpeed: speed } as any);
                                                }}
                                                style={{
                                                    padding: "4px 12px",
                                                    borderRadius: "16px",
                                                    border: isActive ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                                                    background: isActive ? "var(--color-primary)" : "transparent",
                                                    color: isActive ? "#fff" : "var(--color-fg-muted)",
                                                    fontSize: "0.82rem",
                                                    fontWeight: isActive ? 600 : 400,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                {speed}x
                                            </button>
                                        );
                                    })}
                                </div>
                            </SettingsItem>
                        );
                    })()}

                    {/* Learner Reading Mode */}
                    {(() => {
                        const inventory = (profile?.settings as any)?.inventory || [];
                        const hasAudioPremium = inventory.includes("audio_premium");

                        if (!hasAudioPremium) {
                            return (
                                <SettingsItem
                                    label={(t as any).ttsLearnerMode || "はっきり読み上げ"}
                                    description={(t as any).ttsLearnerModeDesc || "ゆっくり・はっきり発音するよう指示します"}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Lock size={14} color="var(--color-fg-muted)" />
                                        <Link
                                            href="/app/shop"
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#06b6d4",
                                                fontWeight: 600,
                                                textDecoration: "none",
                                            }}
                                        >
                                            {(t as any).goToShop || "ショップへ"}
                                        </Link>
                                    </div>
                                </SettingsItem>
                            );
                        }

                        return (
                            <SettingsItem
                                label={(t as any).ttsLearnerMode || "はっきり読み上げ"}
                                description={(t as any).ttsLearnerModeDesc || "ゆっくり・はっきり発音するよう指示します"}
                            >
                                <input
                                    type="checkbox"
                                    checked={settings.ttsLearnerMode}
                                    onChange={(e) => {
                                        settings.setTtsLearnerMode(e.target.checked);
                                        persistSettings({ ttsLearnerMode: e.target.checked } as any);
                                    }}
                                />
                            </SettingsItem>
                        );
                    })()}
                </SettingsSection>

                {/* Tutorials Section */}
                <SettingsSection title={(t as any).tutorials || "チュートリアル"} icon={BookOpen}>
                    <SettingsItem
                        label={(t as any).tutorialCorrections || "AI添削の使い方"}
                        description={(t as any).tutorialCorrectionsDesc || "文章添削機能のチュートリアル"}
                        onClick={() => {
                            localStorage.removeItem('poly-lang-page-tutorial-corrections-v1');
                            router.push('/app/corrections');
                        }}
                    >
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem
                        label={(t as any).tutorialAwareness || "気付きメモの使い方"}
                        description={(t as any).tutorialAwarenessDesc || "単語管理機能のチュートリアル"}
                        onClick={() => {
                            localStorage.removeItem('poly-lang-page-tutorial-awareness-v1');
                            router.push('/app/awareness');
                        }}
                    >
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem
                        label={(t as any).tutorialPhrases || "フレーズの使い方"}
                        description={(t as any).tutorialPhrasesDesc || "フレーズ学習機能のチュートリアル"}
                        onClick={() => {
                            // モバイルの場合はモバイル版のチュートリアルキーをクリア
                            if (isMobile) {
                                localStorage.removeItem('poly-lang-page-tutorial-phrases-mobile-v1');
                            } else {
                                localStorage.removeItem('poly-lang-page-tutorial-phrases-v1');
                            }
                            router.push('/app/phrases');
                        }}
                    >
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                </SettingsSection>

                {/* Support & Legal */}
                <SettingsSection title={t.supportLegal} icon={HelpCircle}>
                    <SettingsItem label={t.privacyPolicy} onClick={() => router.push("/app/privacy")}>
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem label={t.termsOfService} onClick={() => router.push("/app/terms")}>
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem label={t.contactSupport} onClick={() => router.push("/app/contact")}>
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                    <SettingsItem label={t.reportSafety} onClick={() => router.push("/app/report-safety")} description={t.reportSafetyDesc}>
                        <ChevronRight size={16} color="var(--color-fg-muted)" />
                    </SettingsItem>
                </SettingsSection>

                {/* Logout Button */}
                <div style={{ marginTop: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <button
                        onClick={logout}
                        style={{
                            width: "100%",
                            padding: "var(--space-4)",
                            background: "var(--color-surface)",
                            color: "var(--color-destructive)",
                            borderRadius: "var(--radius-lg)",
                            fontSize: "1rem",
                            fontWeight: 600,
                            border: "1px solid var(--color-border)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "var(--space-2)",
                        }}
                    >
                        <LogOut size={16} />
                        {t.logoutButton}
                    </button>
                </div>

                <div style={{ textAlign: "center", marginTop: "var(--space-4)", color: "var(--color-fg-muted)", fontSize: "0.75rem", paddingBottom: "var(--space-8)" }}>
                    {t.version}
                </div>
            </div>

            {/* Voice Selection Modal */}
            {showVoiceModal && (
                <>
                    <div
                        onClick={() => setShowVoiceModal(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            zIndex: 1000,
                        }}
                    />
                    <div style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "var(--color-surface, #fff)",
                        borderRadius: "20px",
                        width: "min(480px, 92vw)",
                        maxHeight: "80vh",
                        display: "flex",
                        flexDirection: "column",
                        zIndex: 1001,
                        overflow: "hidden",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "20px 24px 16px",
                            borderBottom: "1px solid var(--color-border)",
                        }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                                {(t as any).voiceSelect || "ボイス選択"}
                            </h2>
                            <button
                                onClick={() => setShowVoiceModal(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--color-fg-muted)",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Gender Filter Tabs */}
                        <div style={{
                            display: "flex",
                            gap: "8px",
                            padding: "16px 24px 12px",
                        }}>
                            {(["all", "female", "male"] as const).map((g) => {
                                const label = g === "all"
                                    ? ((t as any).voiceAll || "すべて")
                                    : g === "female"
                                        ? ((t as any).voiceFemale || "女性")
                                        : ((t as any).voiceMale || "男性");
                                const isActive = voiceGenderFilter === g;
                                return (
                                    <button
                                        key={g}
                                        onClick={() => setVoiceGenderFilter(g)}
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: "20px",
                                            border: isActive ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                                            background: isActive ? "var(--color-primary)" : "transparent",
                                            color: isActive ? "#fff" : "var(--color-fg-muted)",
                                            fontSize: "0.85rem",
                                            fontWeight: isActive ? 600 : 400,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Voice Grid (scrollable) */}
                        <div style={{
                            overflowY: "auto",
                            padding: "8px 24px 24px",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                            gap: "10px",
                        }}>
                            {TTS_VOICES
                                .filter(v => voiceGenderFilter === "all" || v.gender === voiceGenderFilter)
                                .map((voice) => {
                                    const isSelected = settings.ttsVoice === voice.name;
                                    const labelKey = `voiceLabel_${voice.label.split(/[-\s]/).map(w => w[0].toUpperCase() + w.slice(1)).join("")}`;
                                    return (
                                        <button
                                            key={voice.name}
                                            onClick={() => {
                                                settings.setTtsVoice(voice.name);
                                                persistSettings({ ttsVoice: voice.name } as any);
                                            }}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-start",
                                                gap: "4px",
                                                padding: "12px",
                                                borderRadius: "12px",
                                                border: isSelected
                                                    ? "2px solid var(--color-primary)"
                                                    : "1px solid var(--color-border)",
                                                background: isSelected
                                                    ? "var(--color-bg-sub, rgba(var(--color-primary-rgb, 99, 102, 241), 0.08))"
                                                    : "var(--color-surface)",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                textAlign: "left",
                                                position: "relative",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <span style={{
                                                fontSize: "0.9rem",
                                                fontWeight: isSelected ? 700 : 500,
                                                color: isSelected ? "var(--color-primary)" : "var(--color-fg)",
                                            }}>
                                                {voice.name}
                                            </span>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                flexWrap: "wrap",
                                            }}>
                                                <span style={{
                                                    fontSize: "0.75rem",
                                                    color: "var(--color-fg-muted)",
                                                    background: "var(--color-bg-sub, var(--color-bg))",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                }}>
                                                    {(t as any)[labelKey] || voice.label}
                                                </span>
                                                <span style={{
                                                    fontSize: "0.7rem",
                                                    color: voice.gender === "female" ? "#ec4899" : "#3b82f6",
                                                }}>
                                                    {voice.gender === "female" ? "♀" : "♂"}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div style={{
                                                    position: "absolute",
                                                    top: "8px",
                                                    right: "8px",
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    background: "var(--color-primary)",
                                                }} />
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
