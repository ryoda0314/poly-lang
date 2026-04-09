import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

/**
 * Cron endpoint for distribution lifecycle management:
 * 1. Auto-publish: draft events where scheduled_at <= now → active
 * 2. Auto-expire: active events where expires_at <= now → expired
 */
export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createAdminClient();
        const now = new Date().toISOString();

        // 1. Auto-publish: draft → active (scheduled_at has passed)
        const { data: published, error: publishError } = await supabase
            .from('distribution_events')
            .update({ status: 'active' })
            .eq('status', 'draft')
            .lte('scheduled_at', now)
            .select('id, title');

        if (publishError) {
            console.error('Auto-publish error:', publishError);
        }

        // 2. Auto-expire: active → expired (expires_at has passed)
        const { data: expired, error: expireError } = await supabase
            .from('distribution_events')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .not('expires_at', 'is', null)
            .lte('expires_at', now)
            .select('id, title');

        if (expireError) {
            console.error('Auto-expire error:', expireError);
        }

        return NextResponse.json({
            message: 'Distribution lifecycle processed',
            published: published?.length ?? 0,
            expired: expired?.length ?? 0,
            publishedEvents: published ?? [],
            expiredEvents: expired ?? [],
        });
    } catch (e: any) {
        console.error('Distribution cron error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    return POST(request);
}
