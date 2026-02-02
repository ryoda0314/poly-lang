"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Theme types
export type ThemeType = 'default' | 'ocean' | 'forest' | 'lavender' | 'rose';

// User settings type definition
export interface UserSettings {
    hideHighConfidenceColors: boolean;
    hideMediumConfidenceColors: boolean;
    hideLowConfidenceColors: boolean;
    defaultPhraseView: 'history' | 'my-phrases';
    playbackSpeed: number;
    ttsVoice: string;
    ttsLearnerMode: boolean;
    theme: ThemeType;
}

// Default settings for new users
const DEFAULT_SETTINGS: UserSettings = {
    hideHighConfidenceColors: false,
    hideMediumConfidenceColors: false,
    hideLowConfidenceColors: false,
    defaultPhraseView: 'history',
    playbackSpeed: 1.0,
    ttsVoice: "Kore",
    ttsLearnerMode: false,
    theme: 'default',
};

interface SettingsState extends UserSettings {
    setHideHighConfidenceColors: (enabled: boolean) => void;
    setHideMediumConfidenceColors: (enabled: boolean) => void;
    setHideLowConfidenceColors: (enabled: boolean) => void;
    setDefaultPhraseView: (view: 'history' | 'my-phrases') => void;
    setPlaybackSpeed: (speed: number) => void;
    togglePlaybackSpeed: () => void;
    setTtsVoice: (voice: string) => void;
    setTtsLearnerMode: (enabled: boolean) => void;
    setTheme: (theme: ThemeType) => void;
    syncFromDB: (settings: Partial<UserSettings>) => void;
    clearSettings: () => void;
    getSettingsForDB: () => UserSettings;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_SETTINGS,

            setHideHighConfidenceColors: (enabled) => set({ hideHighConfidenceColors: enabled }),
            setHideMediumConfidenceColors: (enabled) => set({ hideMediumConfidenceColors: enabled }),
            setHideLowConfidenceColors: (enabled) => set({ hideLowConfidenceColors: enabled }),
            setDefaultPhraseView: (view) => set({ defaultPhraseView: view }),
            setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
            togglePlaybackSpeed: () => set((state) => {
                const next = state.playbackSpeed === 0.75 ? 1.0 : state.playbackSpeed === 1.0 ? 1.25 : 0.75;
                return { playbackSpeed: next };
            }),
            setTtsVoice: (voice) => set({ ttsVoice: voice }),
            setTtsLearnerMode: (enabled) => set({ ttsLearnerMode: enabled }),
            setTheme: (theme) => {
                set({ theme });
                // Apply theme to document
                if (typeof document !== 'undefined') {
                    if (theme === 'default') {
                        document.documentElement.removeAttribute('data-theme');
                    } else {
                        document.documentElement.setAttribute('data-theme', theme);
                    }
                }
            },
            syncFromDB: (incoming) => {
                console.log("SettingsStore: Syncing from DB", incoming);
                // Merge with defaults to ensure all fields exist
                set((state) => ({ ...DEFAULT_SETTINGS, ...state, ...incoming }));
            },
            clearSettings: () => {
                console.log("SettingsStore: Clearing settings to defaults");
                set(DEFAULT_SETTINGS);
            },
            getSettingsForDB: () => {
                const state = get();
                return {
                    hideHighConfidenceColors: state.hideHighConfidenceColors,
                    hideMediumConfidenceColors: state.hideMediumConfidenceColors,
                    hideLowConfidenceColors: state.hideLowConfidenceColors,
                    defaultPhraseView: state.defaultPhraseView,
                    playbackSpeed: state.playbackSpeed,
                    ttsVoice: state.ttsVoice,
                    ttsLearnerMode: state.ttsLearnerMode,
                    theme: state.theme,
                };
            },
        }),
        {
            name: "poly-settings-storage",
        }
    )
);
