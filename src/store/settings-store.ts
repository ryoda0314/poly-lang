"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
    hideHighConfidenceColors: boolean;
    hideMediumConfidenceColors: boolean;
    hideLowConfidenceColors: boolean;
    defaultPhraseView: 'history' | 'my-phrases';
    playbackSpeed: number;
    ttsVoice: string;
    ttsLearnerMode: boolean;

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
            hideHighConfidenceColors: false,
            hideMediumConfidenceColors: false,
            hideLowConfidenceColors: false,
            defaultPhraseView: 'history',
            playbackSpeed: 1.0,
            ttsVoice: "Kore",
            ttsLearnerMode: false,

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
