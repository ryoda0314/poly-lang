import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Helper to get localized text with fallback
function getLocalizedText(i18n: Record<string, string> | null, fallback: string, locale: string): string {
    if (!i18n) return fallback;
    if (i18n[locale]) return i18n[locale];
    if (locale !== 'ja' && i18n['ja']) return i18n['ja'];
    if (locale !== 'en' && i18n['en']) return i18n['en'];
    return fallback;
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's native language
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('native_lang')
        .eq('id', user.id)
        .single();

    const userLocale = profile?.native_lang || 'ja';

    // Fetch active events that are available (scheduled_at <= now, not expired)
    const now = new Date().toISOString();

    const { data: events, error: eventsError } = await (supabase as any)
        .from('distribution_events')
        .select('id, title, description, rewards, recurrence, scheduled_at, expires_at, title_i18n, description_i18n')
        .eq('status', 'active')
        .lte('scheduled_at', now)
        .order('created_at', { ascending: false });

    if (eventsError) {
        console.error('[distributions/available] Events query error:', eventsError);
        return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    console.log('[distributions/available] Found events:', events?.length, 'for user:', user.id);

    if (!events || events.length === 0) {
        return NextResponse.json({ events: [] });
    }

    // Filter out expired events client-side (in case cron hasn't run yet)
    const activeEvents = events.filter(e =>
        !e.expires_at || new Date(e.expires_at) > new Date()
    );

    // Get all existing claims for this user for these events
    const eventIds = activeEvents.map(e => e.id);
    const { data: claims } = await supabase
        .from('distribution_claims')
        .select('event_id, period_key')
        .eq('user_id', user.id)
        .in('event_id', eventIds);

    const claimSet = new Set(
        (claims || []).map(c => `${c.event_id}:${c.period_key}`)
    );

    // Compute current period keys and filter to unclaimed events
    const claimableEvents = activeEvents.filter(event => {
        const periodKey = computePeriodKey(event.recurrence);
        return !claimSet.has(`${event.id}:${periodKey}`);
    });

    return NextResponse.json({
        events: claimableEvents.map(e => ({
            id: e.id,
            title: getLocalizedText(e.title_i18n, e.title, userLocale),
            description: getLocalizedText(e.description_i18n, e.description || '', userLocale),
            rewards: e.rewards,
            recurrence: e.recurrence,
        }))
    });
}

function computePeriodKey(recurrence: string): string {
    const now = new Date();
    switch (recurrence) {
        case 'daily': {
            return now.toISOString().slice(0, 10); // YYYY-MM-DD
        }
        case 'weekly': {
            // ISO week: YYYY-Www (use UTC to match PostgreSQL)
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        }
        case 'monthly': {
            // Use UTC to match PostgreSQL's `now() at time zone 'UTC'`
            return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
        }
        default:
            return 'once';
    }
}
