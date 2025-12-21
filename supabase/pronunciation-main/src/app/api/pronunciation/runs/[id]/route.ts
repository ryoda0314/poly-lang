import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('pronunciation_runs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Run not found' }, { status: 404 });
            }
            console.error('Supabase query error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch run' },
                { status: 500 }
            );
        }

        // Transform column names from snake_case to camelCase
        const run = {
            id: data.id,
            sentenceId: data.sentence_id,
            expectedText: data.expected_text,
            asrText: data.asr_text,
            score: data.score,
            diffs: data.diffs,
            feedback: data.feedback,
            deviceInfo: data.device_info,
            createdAt: data.created_at,
        };

        return NextResponse.json(run);
    } catch (error) {
        console.error('Run fetch error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
