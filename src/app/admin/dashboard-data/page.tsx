import React from "react";
import { redirect } from "next/navigation";
import { checkAdmin, getLevels, getQuests, getBadges } from "./actions";
import AdminConsole from "./AdminConsole";

export default async function AdminPage() {
    // 1. Security Check
    const auth = await checkAdmin();
    if (!auth.success) {
        redirect("/"); // Or /auth/login, but simpler to just bounce non-admins home
    }

    // 2. Fetch Initial Data
    // We run these in parallel for speed
    const [levels, quests, badges] = await Promise.all([
        getLevels().catch(() => []),
        getQuests().catch(() => []),
        getBadges().catch(() => [])
    ]);

    // 3. Render Client Component
    return (
        <AdminConsole
            levels={levels || []}
            quests={quests || []}
            badges={badges || []}
        />
    );
}
