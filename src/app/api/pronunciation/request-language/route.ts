import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { languageCode, languageName, message } = await request.json();
        if (!languageCode || !languageName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabase
            .from('pronunciation_language_requests')
            .upsert(
                { user_id: user.id, language_code: languageCode, language_name: languageName, message: message ?? null },
                { onConflict: 'user_id,language_code' }
            );

        if (error) {
            console.error('DB error:', error);
            return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data } = await supabase
            .from('pronunciation_language_requests')
            .select('language_code')
            .eq('user_id', user.id);

        const requestedCodes = (data ?? []).map((r: { language_code: string }) => r.language_code);
        return NextResponse.json({ requestedCodes });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}