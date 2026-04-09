import { NextResponse } from 'next/server';
import { checkAdmin } from '@/app/admin/dashboard-data/actions';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
    const auth = await checkAdmin();
    if (!auth.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from('pronunciation_language_requests')
        .select('id, user_id, language_code, language_name, message, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user emails via admin auth API
    const userIds = [...new Set((data ?? []).map(r => r.user_id))];
    const emailMap: Record<string, string> = {};
    await Promise.all(
        userIds.map(async (uid) => {
            const { data: u } = await supabase.auth.admin.getUserById(uid);
            if (u?.user?.email) emailMap[uid] = u.user.email;
        })
    );

    const requests = (data ?? []).map(r => ({
        ...r,
        user_email: emailMap[r.user_id] ?? '(不明)',
    }));

    return NextResponse.json({ requests });
}
