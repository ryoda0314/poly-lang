
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DashboardResponse, Badge, Level, Quest } from "@/lib/gamification";

import OpenAI from 'openai';

const openai = new OpenAI();

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    console.log("[DashboardAPI] Starting request, lang:", lang);

    try {
        // 1. Fetch Profile and XP (Existing logic)
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        const { data: xpEvents } = await (supabase as any)
            .from("learning_events")
            .select("xp_earned")
            .eq("user_id", user.id);

        const totalXp = xpEvents?.reduce((sum: number, e: any) => sum + (e.xp_earned || 0), 0) || 0;

        // 2. Fetch Levels (Existing logic)
        const { data: levelsData } = await (supabase as any)
            .from("levels")
            .select("*")
            .order("xp_threshold", { ascending: true });

        const levels = (levelsData || []) as Level[];
        if (levels.length === 0) {
            levels.push({ id: 'default', level: 1, title: 'Novice', xp_threshold: 0, created_at: new Date().toISOString() });
        }

        let currentLevel = levels[0];
        let nextLevel = levels[1] || null;

        for (let i = 0; i < levels.length; i++) {
            if (totalXp >= levels[i].xp_threshold) {
                currentLevel = levels[i];
                nextLevel = levels[i + 1] || null;
            } else {
                break;
            }
        }

        const currentLevelXp = currentLevel?.xp_threshold || 0;
        const nextLevelXp = nextLevel?.xp_threshold || (currentLevelXp + 100);
        const progressRaw = totalXp - currentLevelXp;
        const range = nextLevelXp - currentLevelXp;
        const progressPercent = Math.min(100, Math.max(0, (progressRaw / range) * 100));

        // 3. Fetch Badges (Existing logic with keys)
        const { data: allBadges } = await (supabase as any).from("badges").select("*");
        const { data: userBadges } = await (supabase as any)
            .from("user_badges")
            .select("badge_id, created_at")
            .eq("user_id", user.id);

        const earnedBadgeIds = new Set(userBadges?.map((ub: any) => ub.badge_id));

        const badges: Badge[] = (allBadges || []).map((b: any) => ({
            id: b.id,
            key: b.badge_key,
            title: b.title,
            description: b.description,
            icon: b.icon,
            condition_type: 'event',
            condition_value: 0,
            created_at: b.created_at,
            earned: earnedBadgeIds.has(b.id),
            earned_at: userBadges?.find((ub: any) => ub.badge_id === b.id)?.created_at
        }));

        // 4. Generate AI Quests
        let quests: Quest[] = [];

        // Check if quests are already cached/generated for today (TODO: Implementation)
        // For now, generate on fly or use fallback if AI fails

        try {
            // Context for AI
            const targetLanguage = profile?.learning_language === 'ja' ? 'Japanese' : (profile?.learning_language === 'ko' ? 'Korean' : 'English');
            const userNativeLang = lang === 'ja' ? 'Japanese' : (lang === 'ko' ? 'Korean' : 'English');

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a quest generator for a language learning app.
                        Generate 3 daily quests for a user learning ${targetLanguage}.
                        The titles MUST be in the user's native language: ${userNativeLang}.
                        
                        Return a JSON object with a "quests" array. Each quest should have:
                        - id: string (unique)
                        - title: string (in ${userNativeLang})
                        - xp_reward: number (e.g. 50, 100)
                        - category: "daily"
                        - completed: false
                        
                        Make the quests actionable (e.g., "Review 5 words", "Practice pronunciation").`
                    },
                    { role: "user", content: "Generate 3 quests." }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            if (content) {
                const result = JSON.parse(content);
                quests = result.quests.map((q: any) => ({
                    ...q,
                    created_at: new Date().toISOString(),
                    progress: 0
                }));
            }
        } catch (aiError) {
            console.error("AI Quest Gen Error, parsing fallback templates:", aiError);

            // Fallback to static templates if AI fails
            const { data: templates } = await (supabase as any)
                .from("daily_quest_templates")
                .select("*")
                .limit(3);

            quests = (templates || []).map((t: any) => ({
                id: t.id,
                key: t.quest_key, // Keep key for localization lookup if using templates
                title: t.title, // This might be in English, but frontend will localize if key exists
                xp_reward: 50,
                category: 'daily',
                created_at: t.created_at,
                progress: 0,
                completed: false
            }));
        }

        // 5. Streak Calculation & Quest Progress
        const { data: events } = await (supabase as any)
            .from("learning_events")
            .select("*")
            .eq("user_id", user.id)
            .order("occurred_at", { ascending: false })
            .limit(1000);

        let currentStreak = 0;
        const streakDays: number[] = [];
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        // Quest Progress Logic (MVP)
        // We iterate generated quests and check event counts for today
        const todayStr = formatDate(new Date());
        const todayEvents = (events || []).filter((e: any) => formatDate(new Date(e.occurred_at)) === todayStr);

        quests = quests.map(q => {
            // Heuristic matching based on Title or ID keywords
            // Real implementation would have 'condition_type' and 'target_value' from AI JSON
            // But for now AI returns just strings. Let's infer.
            let progress = 0;
            let target = 5; // Default target

            const lowerTitle = q.title.toLowerCase();
            const lowerId = q.id.toLowerCase();

            if (lowerId.includes('phrase') || lowerTitle.includes('phrase') || lowerTitle.includes('word') || lowerTitle.includes('語') || lowerTitle.includes('단어')) {
                // Count phrase_view
                progress = todayEvents.filter((e: any) => e.event_type === 'phrase_view').length;
                // Extract target number if possible? e.g. "5 words"
                const match = q.title.match(/(\d+)/);
                if (match) target = parseInt(match[1], 10);
            } else if (lowerId.includes('pronunciation') || lowerTitle.includes('pronunciation') || lowerTitle.includes('speak') || lowerTitle.includes('発音') || lowerTitle.includes('발음')) {
                progress = todayEvents.filter((e: any) => e.event_type === 'pronunciation_check').length;
                const match = q.title.match(/(\d+)/);
                if (match) target = parseInt(match[1], 10);
            } else if (lowerId.includes('review') || lowerTitle.includes('review') || lowerTitle.includes('card') || lowerTitle.includes('復習') || lowerTitle.includes('복습')) {
                progress = todayEvents.filter((e: any) => e.event_type === 'review_complete' || e.event_type === 'saved_phrase').length; // Fallback to saved_phrase
                const match = q.title.match(/(\d+)/);
                if (match) target = parseInt(match[1], 10);
            }

            return {
                ...q,
                progress: progress,
                // We should probably include 'target' in the Quest interface to render progress bar correctly
                // For now, if progress >= target, it's completed. 
                // Using hardcoded targets from heuristics for checking completion.
                completed: progress >= target
            };
        });

        if (events && events.length > 0) {
            const today = new Date();
            const todayStr = formatDate(today);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = formatDate(yesterday);
            const uniqueDays = new Set<string>();
            events.forEach((e: any) => {
                const d = new Date(e.occurred_at);
                uniqueDays.add(formatDate(d));
            });
            const currentMonth = today.getMonth();
            events.forEach((e: any) => {
                const d = new Date(e.occurred_at);
                if (d.getMonth() === currentMonth) streakDays.push(d.getDate());
            });

            let cursorDate = new Date(today);
            let consecutive = 0;
            if (uniqueDays.has(todayStr)) {
                consecutive++;
                cursorDate.setDate(cursorDate.getDate() - 1);
                while (uniqueDays.has(formatDate(cursorDate))) {
                    consecutive++;
                    cursorDate.setDate(cursorDate.getDate() - 1);
                }
            } else if (uniqueDays.has(yesterdayStr)) {
                consecutive++;
                cursorDate = new Date(yesterday);
                cursorDate.setDate(cursorDate.getDate() - 1);
                while (uniqueDays.has(formatDate(cursorDate))) {
                    consecutive++;
                    cursorDate.setDate(cursorDate.getDate() - 1);
                }
            }
            currentStreak = consecutive;
        }

        const response: DashboardResponse = {
            profile: {
                displayName: profile?.username || user.email?.split('@')[0] || "User",
                avatarUrl: null
            },
            level: {
                current: currentLevel,
                next: nextLevel,
                currentXp: totalXp,
                nextLevelXp: nextLevelXp,
                progressPercent
            },
            quests: quests,
            badges: badges,
            streak: {
                current: currentStreak,
                days: [...new Set(streakDays)].sort((a, b) => a - b)
            },
            stats: {
                totalWords: 0,
                learningDays: streakDays.length > 0 ? streakDays.length : 12 // mockup/stat
            }
        };

        return NextResponse.json(response);

    } catch (e: any) {
        console.error("Dashboard API Error:", e);
        return NextResponse.json({ error: "Internal Server Error", details: e.message }, { status: 500 });
    }
}
