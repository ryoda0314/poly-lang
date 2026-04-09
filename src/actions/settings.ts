"use server";

import { createClient } from "@/lib/supabase/server";
import { UserSettings } from "@/store/settings-store";

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        // Get current settings from DB
        const { data: profile } = await supabase
            .from("profiles")
            .select("settings")
            .eq("id", user.id)
            .single();

        // Merge with existing settings
        const currentSettings = (profile?.settings as Partial<UserSettings>) || {};
        const mergedSettings = { ...currentSettings, ...settings };

        // Save to DB
        const { error } = await supabase
            .from("profiles")
            .update({ settings: mergedSettings })
            .eq("id", user.id);

        if (error) {
            console.error("Failed to save settings:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e) {
        console.error("Error saving settings:", e);
        return { success: false, error: "Failed to save settings" };
    }
}

export async function getUserSettings(): Promise<Partial<UserSettings> | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("settings")
            .eq("id", user.id)
            .single();

        return (profile?.settings as Partial<UserSettings>) || null;
    } catch (e) {
        console.error("Error getting settings:", e);
        return null;
    }
}
