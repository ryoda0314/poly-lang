
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DashboardResponse, Badge, Level, Quest } from "@/lib/gamification";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const langParam = searchParams.get('lang') || 'en';
    const learningLangParam = searchParams.get('learning_lang');

    // Security: Validate language codes (allow only known patterns)
    const validLangPattern = /^[a-z]{2,5}$/;
    const lang = validLangPattern.test(langParam) ? langParam : 'en';
    const learningLang = learningLangParam && validLangPattern.test(learningLangParam) ? learningLangParam : null;


    try {
        // Run independent queries in parallel for better performance
        const todayStr = new Date().toISOString().split('T')[0];
        const [
            profileResult,
            levelsResult,
            allBadgesResult,
            userBadgesResult,
            questTemplatesResult,
            eventsResult,
            streakResult,
            loginDaysResult,
            dailyUsageResult,
            userProgressResult,
            memoCountResult
        ] = await Promise.all([
            // 1. Profile
            supabase.from("profiles").select("*").eq("id", user.id).single(),
            // 2. Levels
            (supabase as any).from("levels").select("*").order("xp_threshold", { ascending: true }),
            // 3. All badges
            (supabase as any).from("badges").select("*"),
            // 4. User badges
            (supabase as any).from("user_badges").select("badge_id, created_at").eq("user_id", user.id),
            // 5. Quest templates (used instead of waiting for OpenAI)
            (supabase as any).from("daily_quest_templates").select("*").limit(3),
            // 6. Learning events - today only (for quest progress)
            (supabase as any).from("learning_events").select("*").eq("user_id", user.id).gte("occurred_at", todayStr).order("occurred_at", { ascending: false }).limit(100),
            // 7. User streaks (single row cache)
            (supabase as any).from("user_streaks").select("*").eq("user_id", user.id).single(),
            // 8. Login days for calendar (last 400 days max)
            (supabase as any).from("user_login_days").select("login_date").eq("user_id", user.id).order("login_date", { ascending: false }).limit(400),
            // 9. Today's usage
            (supabase as any).from("daily_usage").select("*").eq("user_id", user.id).eq("date", todayStr).single(),
            // 10. User progress (XP) - only if learningLang is provided
            learningLang
                ? (supabase as any).from("user_progress").select("xp_total").eq("user_id", user.id).eq("language_code", learningLang).single()
                : Promise.resolve({ data: null }),
            // 11. Awareness memos count
            learningLang
                ? (supabase as any).from("awareness_memos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("language_code", learningLang)
                : Promise.resolve({ count: 0 })
        ]);

        const profile = profileResult.data;
        const events = eventsResult.data;
        const dailyUsage = dailyUsageResult.data;

        // Plan-based daily limits (must match src/lib/limits.ts)
        const planLimits: Record<string, { audio: number; explorer: number; correction: number; extraction: number; explanation: number; etymology: number; sentence: number }> = {
            free: { audio: 7, explorer: 7, correction: 3, extraction: 0, explanation: 1, etymology: 3, sentence: 3 },
            standard: { audio: 30, explorer: 30, correction: 10, extraction: 10, explanation: 30, etymology: 15, sentence: 15 },
            pro: { audio: 100, explorer: 100, correction: 30, extraction: 30, explanation: 100, etymology: 50, sentence: 50 }
        };

        const currentPlan = (profile as any)?.subscription_plan || "free";
        const limits = planLimits[currentPlan] || planLimits.free;

        // Today's usage (default to 0 if no record)
        const todayUsage = {
            audio: dailyUsage?.audio_count || 0,
            explorer: dailyUsage?.explorer_count || 0,
            correction: dailyUsage?.correction_count || 0,
            extraction: dailyUsage?.extraction_count || 0,
            explanation: dailyUsage?.explanation_count || 0,
            etymology: dailyUsage?.etymology_count || 0,
            sentence: dailyUsage?.sentence_count || 0
        };

        // Calculate remaining
        const todayRemaining = {
            audio: Math.max(0, limits.audio - todayUsage.audio),
            explorer: Math.max(0, limits.explorer - todayUsage.explorer),
            correction: Math.max(0, limits.correction - todayUsage.correction),
            extraction: Math.max(0, limits.extraction - todayUsage.extraction),
            explanation: Math.max(0, limits.explanation - todayUsage.explanation),
            etymology: Math.max(0, limits.etymology - todayUsage.etymology),
            sentence: Math.max(0, limits.sentence - todayUsage.sentence)
        };

        // Calculate XP from user_progress (already fetched in parallel)
        const totalXp = userProgressResult.data?.xp_total || 0;

        // Process levels
        const levels = (levelsResult.data || []) as Level[];
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

        // Process badges
        const earnedBadgeIds = new Set(userBadgesResult.data?.map((ub: any) => ub.badge_id));

        const badges: Badge[] = (allBadgesResult.data || []).map((b: any) => ({
            id: b.id,
            key: b.badge_key,
            title: b.title,
            description: b.description,
            icon: b.icon,
            condition_type: 'event',
            condition_value: 0,
            created_at: b.created_at,
            earned: earnedBadgeIds.has(b.id),
            earned_at: userBadgesResult.data?.find((ub: any) => ub.badge_id === b.id)?.created_at
        }));

        // Quests: Use templates immediately (no OpenAI wait)
        let quests: Quest[] = [];
        const isBeginner = totalXp < 50;

        if (isBeginner) {
            // Static Tutorial Quests
            quests = [
                { id: 'tutorial-listen', key: 'tutorial_listen', title: 'Listen to a phrase', xp_reward: 100, category: 'tutorial', created_at: new Date().toISOString(), progress: 0, completed: false },
                { id: 'tutorial-speak', key: 'tutorial_speak', title: 'Try a pronunciation check', xp_reward: 100, category: 'tutorial', created_at: new Date().toISOString(), progress: 0, completed: false },
                { id: 'tutorial-save', key: 'tutorial_save', title: 'Save a phrase', xp_reward: 100, category: 'tutorial', created_at: new Date().toISOString(), progress: 0, completed: false },
            ];
        } else {
            // Use pre-fetched templates (no OpenAI in critical path)
            quests = (questTemplatesResult.data || []).map((t: any) => ({
                id: t.id,
                key: t.quest_key,
                title: t.title,
                xp_reward: 50,
                category: 'daily',
                created_at: t.created_at,
                progress: 0,
                completed: false
            }));

            // Fallback if no templates
            if (quests.length === 0) {
                quests = [
                    { id: 'daily-1', key: 'review_words', title: 'Review 5 words', xp_reward: 50, category: 'daily', created_at: new Date().toISOString(), progress: 0, completed: false },
                    { id: 'daily-2', key: 'practice_pronunciation', title: 'Practice pronunciation', xp_reward: 50, category: 'daily', created_at: new Date().toISOString(), progress: 0, completed: false },
                    { id: 'daily-3', key: 'learn_phrases', title: 'Learn 3 new phrases', xp_reward: 50, category: 'daily', created_at: new Date().toISOString(), progress: 0, completed: false },
                ];
            }
        }

        // Quest Progress Logic (MVP)
        // We iterate generated quests and check event counts for today
        const todayEvents = events || [];

        quests = quests.map(q => {
            // Heuristic matching based on Title or ID keywords
            // Real implementation would have 'condition_type' and 'target_value' from AI JSON
            // But for now AI returns just strings. Let's infer.
            let progress = 0;
            let target = 5; // Default target

            const lowerTitle = q.title.toLowerCase();
            const lowerId = q.id.toLowerCase();
            const lowerKey = q.key?.toLowerCase() || '';


            if (lowerId === 'tutorial-listen' || lowerKey === 'tutorial_listen') {
                progress = todayEvents.filter((e: any) => e.event_type === 'phrase_view').length;
                target = 1;
            } else if (lowerId === 'tutorial-speak' || lowerKey === 'tutorial_speak') {
                progress = todayEvents.filter((e: any) => e.event_type === 'pronunciation_check').length;
                target = 1;
            } else if (lowerId === 'tutorial-save' || lowerKey === 'tutorial_save') {
                progress = todayEvents.filter((e: any) => e.event_type === 'saved_phrase').length;
                target = 1;
            } else if (lowerId.includes('phrase') || lowerTitle.includes('phrase') || lowerTitle.includes('word') || lowerTitle.includes('語') || lowerTitle.includes('단어')) {
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

        // Streak & login days from dedicated tables
        const streakData = streakResult.data;
        const loginDays: string[] = (loginDaysResult.data || []).map(
            (row: any) => row.login_date
        );

        const response: DashboardResponse = {
            profile: {
                displayName: profile?.username || user.email?.split('@')[0] || "User",
                avatarUrl: profile?.avatar_url || null
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
                current: streakData?.current_streak || 0,
                longest: streakData?.longest_streak || 0,
                lastActiveDate: streakData?.last_active_date || null,
            },
            stats: {
                totalWords: memoCountResult.count || 0,
                learningDays: loginDays.length,
            },
            loginDays,
            usage: {
                plan: currentPlan,
                limits,
                today: todayUsage,
                remaining: todayRemaining
            }
        };

        return NextResponse.json(response);

    } catch (e: any) {
        console.error("Dashboard API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
