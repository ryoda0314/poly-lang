import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { eventId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { eventId } = body;
    if (!eventId) {
        return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    // Use admin client for the RPC call (security definer function)
    const adminSupabase = await createAdminClient();

    const { data: rewards, error: rpcError } = await adminSupabase.rpc(
        'claim_distribution',
        {
            p_event_id: eventId,
            p_user_id: user.id,
        }
    );

    if (rpcError) {
        console.error('[claim_distribution] RPC error:', rpcError);
        // Parse friendly error messages from the RPC
        const msg = rpcError.message || 'Failed to claim reward';
        if (msg.includes('Already claimed')) {
            return NextResponse.json({ error: 'Already claimed for this period' }, { status: 409 });
        }
        if (msg.includes('not active')) {
            return NextResponse.json({ error: 'This event is no longer available' }, { status: 410 });
        }
        if (msg.includes('expired')) {
            return NextResponse.json({ error: 'This event has expired' }, { status: 410 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ success: true, rewards });
}
