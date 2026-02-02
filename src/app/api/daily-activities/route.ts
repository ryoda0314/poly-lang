import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const langParam = searchParams.get('lang');

    // Validate date format (YYYY-MM-DD)
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // Validate language code
    const validLangPattern = /^[a-z]{2,5}$/;
    const languageCode = langParam && validLangPattern.test(langParam) ? langParam : null;

    try {
        // Calculate date range for the selected day
        const startOfDay = `${dateParam}T00:00:00.000Z`;
        const endOfDay = `${dateParam}T23:59:59.999Z`;

        // Fetch learning events for the selected date
        let eventsQuery = supabase
            .from('learning_events')
            .select('*')
            .eq('user_id', user.id)
            .gte('occurred_at', startOfDay)
            .lte('occurred_at', endOfDay)
            .order('occurred_at', { ascending: false });

        if (languageCode) {
            eventsQuery = eventsQuery.eq('language_code', languageCode);
        }

        const { data: events, error: eventsError } = await eventsQuery;

        if (eventsError) {
            console.error("Events fetch error:", eventsError);
            return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
        }

        // Fetch awareness memos created on the selected date
        let memosQuery = supabase
            .from('awareness_memos')
            .select('id, token_text, status, created_at, memo')
            .eq('user_id', user.id)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)
            .order('created_at', { ascending: false });

        if (languageCode) {
            memosQuery = memosQuery.eq('language_code', languageCode);
        }

        const { data: memos, error: memosError } = await memosQuery;

        if (memosError) {
            console.error("Memos fetch error:", memosError);
            return NextResponse.json({ error: "Failed to fetch memos" }, { status: 500 });
        }

        // Calculate summary counts
        const eventList = events || [];
        const summary = {
            phraseViews: eventList.filter(e => e.event_type === 'phrase_view').length,
            audioPlays: eventList.filter(e => e.event_type === 'audio_play').length,
            pronunciationChecks: eventList.filter(e => e.event_type === 'pronunciation_check').length,
            corrections: eventList.filter(e => e.event_type === 'correction_request').length,
            savedPhrases: eventList.filter(e => e.event_type === 'saved_phrase').length,
            memosCreated: (memos || []).length,
            totalXp: eventList.reduce((sum, e) => sum + (e.xp_delta || 0), 0)
        };

        // Extract correction details
        const corrections = eventList
            .filter(e => e.event_type === 'correction_request')
            .map(e => {
                const meta = e.meta as { original?: string; corrected?: string; explanation?: string } | null;
                return {
                    original: meta?.original || '',
                    corrected: meta?.corrected || '',
                    explanation: meta?.explanation || '',
                    occurred_at: e.occurred_at
                };
            });

        return NextResponse.json({
            date: dateParam,
            events: eventList,
            memos: memos || [],
            corrections,
            summary
        });

    } catch (e: any) {
        console.error("Daily Activities API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
