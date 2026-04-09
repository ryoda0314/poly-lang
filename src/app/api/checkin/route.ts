import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. Upsert today into user_login_days (idempotent)
        const { error: loginError } = await (supabase as any)
            .from("user_login_days")
            .upsert(
                { user_id: user.id, login_date: todayStr },
                { onConflict: "user_id,login_date" }
            );

        if (loginError) {
            console.error("Login day upsert error:", loginError);
            return NextResponse.json({ error: "Failed to record login" }, { status: 500 });
        }

        // 2. Read current streak record
        const { data: streakRow } = await (supabase as any)
            .from("user_streaks")
            .select("*")
            .eq("user_id", user.id)
            .single();

        let currentStreak = 1;
        let longestStreak = 1;

        if (streakRow) {
            const lastActive = streakRow.last_active_date;

            if (lastActive === todayStr) {
                // Already checked in today
                return NextResponse.json({
                    success: true,
                    streak: {
                        current: streakRow.current_streak,
                        longest: streakRow.longest_streak,
                        lastActiveDate: streakRow.last_active_date,
                    }
                });
            }

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                currentStreak = streakRow.current_streak + 1;
                longestStreak = Math.max(streakRow.longest_streak, currentStreak);
            } else {
                currentStreak = 1;
                longestStreak = Math.max(streakRow.longest_streak, 1);
            }

            const { error: updateError } = await (supabase as any)
                .from("user_streaks")
                .update({
                    current_streak: currentStreak,
                    longest_streak: longestStreak,
                    last_active_date: todayStr,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id);

            if (updateError) {
                console.error("Streak update error:", updateError);
                return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
            }
        } else {
            // First ever check-in
            const { error: insertError } = await (supabase as any)
                .from("user_streaks")
                .insert({
                    user_id: user.id,
                    current_streak: 1,
                    longest_streak: 1,
                    last_active_date: todayStr,
                });

            if (insertError) {
                console.error("Streak insert error:", insertError);
                return NextResponse.json({ error: "Failed to create streak" }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            streak: {
                current: currentStreak,
                longest: longestStreak,
                lastActiveDate: todayStr,
            }
        });
    } catch (e: any) {
        console.error("Checkin API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
