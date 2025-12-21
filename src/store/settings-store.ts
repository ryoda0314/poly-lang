"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
    baseSetCount: number;
    compareSetCount: number;
    reminderEnabled: boolean;
    reminderTime: string;
    weeklySummaryEnabled: boolean;

    setBaseSetCount: (count: number) => void;
    setCompareSetCount: (count: number) => void;
    setReminderEnabled: (enabled: boolean) => void;
    setReminderTime: (time: string) => void;
    setWeeklySummaryEnabled: (enabled: boolean) => void;
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

            setBaseSetCount: (count) => set({ baseSetCount: count }),
            setCompareSetCount: (count) => set({ compareSetCount: count }),
            setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
            setReminderTime: (time) => set({ reminderTime: time }),
            setWeeklySummaryEnabled: (enabled) => set({ weeklySummaryEnabled: enabled }),
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
