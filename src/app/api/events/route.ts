import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Allowed event types to prevent arbitrary data injection
const ALLOWED_EVENT_TYPES = [
    'phrase_view', 'audio_play', 'text_copy', 'saved_phrase',
    'correction_request', 'memo_created', 'memo_verified',
    'explanation_request', 'word_explore', 'tutorial_complete',
    'pronunciation_check', 'review_complete', 'category_select',
    'gender_change', 'nuance_refinement', 'pronunciation_result',
    // API tracking events
    'expression_translate', 'expression_examples', 'chat_message',
    'daily_checkin', 'reward_claimed'
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event_type, xp, meta } = body;

        // Server-side auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Security: Validate event_type
        if (!event_type || typeof event_type !== 'string') {
            return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
        }

        if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
            return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
        }

        // Security: Validate xp if provided
        if (xp !== undefined && (typeof xp !== 'number' || xp < 0 || xp > 1000)) {
            return NextResponse.json({ error: "Invalid xp value" }, { status: 400 });
        }

        // Security: Limit meta object size
        if (meta && JSON.stringify(meta).length > 5000) {
            return NextResponse.json({ error: "Meta data too large" }, { status: 400 });
        }

        // Get user's learning language from profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("learning_language")
            .eq("id", user.id)
            .single();

        const languageCode = profile?.learning_language || "en";

        // 1. Get XP setting for this event type
        const { data: xpSetting } = await (supabase as any)
            .from('xp_settings')
            .select('xp_value, is_active')
            .eq('event_type', event_type)
            .single();

        let xpDelta = 0;
        if (xpSetting && xpSetting.is_active) {
            xpDelta = xpSetting.xp_value;
        }

        // Allow manual override if specified (e.g. detailed scoring), but prefer settings
        if (xp && xp > 0 && (!xpSetting || xpSetting.xp_value === 0)) {
            xpDelta = xp;
        }

        // 2. Insert event log
        const { error: eventError } = await supabase
            .from("learning_events")
            .insert({
                user_id: user.id,
                language_code: languageCode,
                event_type,
                xp_delta: xpDelta,
                occurred_at: new Date().toISOString(),
                meta: meta || {}
            });

        if (eventError) {
            console.error("Event Insert Error:", eventError);
            return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
        }

        let newLevel = null;
        let leveledUp = false;

        // 3. Update User Progress if there is XP gain
        if (xpDelta > 0) {
            // Get current progress
            const { data: currentProgress } = await (supabase as any)
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('language_code', languageCode)
                .single();

            let totalXp = (currentProgress?.xp_total || 0) + xpDelta;
            let currentLevel = currentProgress?.current_level || 1;

            // Check for level up
            // Get all levels ordered by level
            const { data: levels } = await supabase
                .from('levels')
                .select('*')
                .order('level', { ascending: true });

            if (levels) {
                // Find highest level reachable with totalXp
                // Assuming level 1 starts at 0, level 2 is at 100, etc.
                // We want to find the max level where xp_threshold <= totalXp
                const reachableLevel = levels
                    .filter((l: any) => l.xp_threshold <= totalXp)
                    .pop(); // Last one is the highest

                if (reachableLevel && reachableLevel.level > currentLevel) {
                    newLevel = reachableLevel.level;
                    leveledUp = true;
                } else {
                    newLevel = currentLevel;
                }
            }

            // Upsert progress
            const { error: progressError } = await (supabase as any)
                .from('user_progress')
                .upsert({
                    user_id: user.id,
                    language_code: languageCode,
                    xp_total: totalXp,
                    current_level: newLevel || currentLevel,
                    last_activity_at: new Date().toISOString()
                }, { onConflict: 'user_id, language_code' });

            if (progressError) {
                console.error("Progress Update Error:", progressError);
            }
        }

        return NextResponse.json({
            success: true,
            xpAdded: xpDelta,
            leveledUp,
            newLevel
        });

    } catch (e: any) {
        console.error("API Route Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
