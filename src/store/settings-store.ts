"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
    baseSetCount: number;
    compareSetCount: number;
    reminderEnabled: boolean;
    reminderTime: string;
    weeklySummaryEnabled: boolean;
    hideHighConfidenceColors: boolean;
    hideMediumConfidenceColors: boolean;
    hideLowConfidenceColors: boolean;
    defaultPhraseView: 'history' | 'my-phrases';
    playbackSpeed: number;
    ttsVoice: string;
    ttsLearnerMode: boolean;

    setBaseSetCount: (count: number) => void;
    setCompareSetCount: (count: number) => void;
    setReminderEnabled: (enabled: boolean) => void;
    setReminderTime: (time: string) => void;
    setWeeklySummaryEnabled: (enabled: boolean) => void;
    setHideHighConfidenceColors: (enabled: boolean) => void;
    setHideMediumConfidenceColors: (enabled: boolean) => void;
    setHideLowConfidenceColors: (enabled: boolean) => void;
    setDefaultPhraseView: (view: 'history' | 'my-phrases') => void;
    setPlaybackSpeed: (speed: number) => void;
    togglePlaybackSpeed: () => void;
    setTtsVoice: (voice: string) => void;
    setTtsLearnerMode: (enabled: boolean) => void;
    syncFromDB: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            baseSetCount: 8,
            compareSetCount: 6,
            reminderEnabled: false,
            reminderTime: "20:00",
            weeklySummaryEnabled: false,
            hideHighConfidenceColors: false,
            hideMediumConfidenceColors: false,
            hideLowConfidenceColors: false,
            defaultPhraseView: 'history',
            playbackSpeed: 1.0,
            ttsVoice: "Kore",
            ttsLearnerMode: false,

            setBaseSetCount: (count) => set({ baseSetCount: count }),
            setCompareSetCount: (count) => set({ compareSetCount: count }),
            setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
            setReminderTime: (time) => set({ reminderTime: time }),
            setWeeklySummaryEnabled: (enabled) => set({ weeklySummaryEnabled: enabled }),
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
            syncFromDB: (incoming) => {
                console.log("SettingsStore: Syncing from DB", incoming);
                set((state) => ({ ...state, ...incoming }));
            },
        }),
        {
            name: "poly-settings-storage",
        }
    )
);
