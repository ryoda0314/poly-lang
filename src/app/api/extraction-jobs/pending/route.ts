import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight polling endpoint for checking completed extraction jobs.
 * Returns jobs that are completed but haven't been notified yet.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ jobs: [] });
    }

    const { data: jobs, error } = await supabase
        .from('extraction_jobs')
        .select('id, status, phrase_count, completed_at, extracted_phrases')
        .eq('user_id', user.id)
        .eq('notification_sent', false)
        .in('status', ['completed', 'failed'])
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch pending notifications:', error);
        return NextResponse.json({ jobs: [] });
    }

    return NextResponse.json({ jobs: jobs || [] });
}

/**
 * Mark jobs as notified after showing toast.
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobIds } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return NextResponse.json({ error: 'Invalid jobIds' }, { status: 400 });
    }

    await supabase
        .from('extraction_jobs')
        .update({ notification_sent: true })
        .in('id', jobIds)
        .eq('user_id', user.id);

    return NextResponse.json({ success: true });
}
