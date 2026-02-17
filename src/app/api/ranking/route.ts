import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type RankingType = "xp" | "weekly" | "streak";

export interface RankingEntry {
    rank: number;
    user_id: string;
    username: string;
    avatar_url: string | null;
    level: number;
    score: number;
    is_current_user: boolean;
}

export interface RankingResponse {
    type: RankingType;
    entries: RankingEntry[];
    my_rank: number | null;
    my_score: number | null;
    total_users: number;
}

const VALID_TYPES: RankingType[] = ["xp", "weekly", "streak"];
const VALID_LANG = /^[a-z]{2,5}$/;

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "xp") as RankingType;
    const langParam = searchParams.get("lang");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 50);

    if (!VALID_TYPES.includes(type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const lang = langParam && VALID_LANG.test(langParam) ? langParam : null;

    try {
        // Use admin client to bypass RLS for reading other users' data
        const admin = await createAdminClient();

        let entries: RankingEntry[] = [];
        let myRank: number | null = null;
        let myScore: number | null = null;
        let totalUsers = 0;

        if (type === "xp") {
            if (lang) {
                // Per-language ranking
                const { data, error } = await admin
                    .from("user_progress")
                    .select("user_id, xp_total, current_level")
                    .eq("language_code", lang)
                    .order("xp_total", { ascending: false })
                    .limit(limit);
                if (error) throw error;

                const userIds = (data || []).map((r) => r.user_id);
                const { data: profiles } = await admin.from("profiles").select("id, username").in("id", userIds);
                const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

                entries = (data || []).map((row, idx) => ({
                    rank: idx + 1,
                    user_id: row.user_id,
                    username: profileMap.get(row.user_id)?.username || "User",
                    avatar_url: null,
                    level: row.current_level || 1,
                    score: row.xp_total || 0,
                    is_current_user: row.user_id === user.id,
                }));

                const { data: myData } = await admin.from("user_progress").select("xp_total").eq("user_id", user.id).eq("language_code", lang).single();
                if (myData) {
                    myScore = myData.xp_total || 0;
                    const { count } = await admin.from("user_progress").select("*", { count: "exact", head: true }).eq("language_code", lang).gt("xp_total", myScore);
                    myRank = (count || 0) + 1;
                }
            } else {
                // All-language aggregate ranking
                const { data, error } = await admin
                    .from("user_progress")
                    .select("user_id, xp_total, current_level");
                if (error) throw error;

                // Sum XP across all languages per user, keep max level
                const userMap = new Map<string, { xp: number; level: number }>();
                for (const row of data || []) {
                    const prev = userMap.get(row.user_id);
                    if (prev) {
                        prev.xp += row.xp_total || 0;
                        prev.level = Math.max(prev.level, row.current_level || 1);
                    } else {
                        userMap.set(row.user_id, { xp: row.xp_total || 0, level: row.current_level || 1 });
                    }
                }

                const sorted = Array.from(userMap.entries())
                    .sort((a, b) => b[1].xp - a[1].xp)
                    .slice(0, limit);

                const userIds = sorted.map(([uid]) => uid);
                const { data: profiles } = await admin.from("profiles").select("id, username").in("id", userIds);
                const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

                entries = sorted.map(([uid, { xp, level }], idx) => ({
                    rank: idx + 1,
                    user_id: uid,
                    username: profileMap.get(uid)?.username || "User",
                    avatar_url: null,
                    level,
                    score: xp,
                    is_current_user: uid === user.id,
                }));

                totalUsers = userMap.size;
                const myEntry = userMap.get(user.id);
                if (myEntry) {
                    myScore = myEntry.xp;
                    myRank = Array.from(userMap.entries())
                        .sort((a, b) => b[1].xp - a[1].xp)
                        .findIndex(([uid]) => uid === user.id) + 1;
                }
            }
        } else if (type === "weekly") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            let query = admin
                .from("learning_events")
                .select("user_id, xp_delta")
                .gte("occurred_at", sevenDaysAgo.toISOString());

            if (lang) query = query.eq("language_code", lang);

            const { data, error } = await query;
            if (error) throw error;

            // Aggregate in memory
            const userXpMap = new Map<string, number>();
            for (const e of data || []) {
                userXpMap.set(e.user_id, (userXpMap.get(e.user_id) || 0) + (e.xp_delta || 0));
            }

            const sorted = Array.from(userXpMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit);

            totalUsers = userXpMap.size;

            const userIds = sorted.map(([uid]) => uid);
            const [{ data: profiles }, { data: progress }] = await Promise.all([
                admin.from("profiles").select("id, username").in("id", userIds),
                admin.from("user_progress").select("user_id, current_level").in("user_id", userIds),
            ]);

            const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
            const levelMap = new Map((progress || []).map((p) => [p.user_id, p.current_level]));

            entries = sorted.map(([uid, xp], idx) => {
                const p = profileMap.get(uid);
                return {
                    rank: idx + 1,
                    user_id: uid,
                    username: p?.username || "User",
                    avatar_url: null,
                    level: levelMap.get(uid) || 1,
                    score: xp,
                    is_current_user: uid === user.id,
                };
            });

            myScore = userXpMap.get(user.id) ?? null;
            if (myScore !== null) {
                const allSorted = Array.from(userXpMap.entries()).sort((a, b) => b[1] - a[1]);
                myRank = allSorted.findIndex(([uid]) => uid === user.id) + 1;
            }
        } else if (type === "streak") {
            const { data, error } = await admin
                .from("user_streaks")
                .select("user_id, current_streak")
                .order("current_streak", { ascending: false })
                .gt("current_streak", 0)
                .limit(limit);

            if (error) throw error;

            const userIds = (data || []).map((r) => r.user_id);
            const [{ data: profiles }, { data: progress }] = await Promise.all([
                admin.from("profiles").select("id, username").in("id", userIds),
                admin.from("user_progress").select("user_id, current_level").in("user_id", userIds),
            ]);

            const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
            const levelMap = new Map((progress || []).map((p) => [p.user_id, p.current_level]));

            entries = (data || []).map((row, idx) => {
                const p = profileMap.get(row.user_id);
                return {
                    rank: idx + 1,
                    user_id: row.user_id,
                    username: p?.username || "User",
                    avatar_url: null,
                    level: levelMap.get(row.user_id) || 1,
                    score: row.current_streak || 0,
                    is_current_user: row.user_id === user.id,
                };
            });

            const { data: myStreak } = await admin
                .from("user_streaks")
                .select("current_streak")
                .eq("user_id", user.id)
                .single();

            if (myStreak) {
                myScore = myStreak.current_streak;
                const { count } = await admin
                    .from("user_streaks")
                    .select("*", { count: "exact", head: true })
                    .gt("current_streak", myScore!);
                myRank = (count || 0) + 1;
            }
        }

        return NextResponse.json({
            type,
            entries,
            my_rank: myRank,
            my_score: myScore,
            total_users: totalUsers || entries.length,
        } satisfies RankingResponse);
    } catch (e: any) {
        console.error("Ranking API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
