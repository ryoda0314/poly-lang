import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sentenceId = searchParams.get('sentenceId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const scoreMin = searchParams.get('scoreMin');
        const scoreMax = searchParams.get('scoreMax');
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const supabase = createServerClient();

        let query = supabase
            .from('pronunciation_runs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (sentenceId) {
            query = query.eq('sentence_id', sentenceId);
        }
        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }
        if (scoreMin) {
            query = query.gte('score', parseInt(scoreMin, 10));
        }
        if (scoreMax) {
            query = query.lte('score', parseInt(scoreMax, 10));
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase query error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch runs. Database may not be configured.' },
                { status: 500 }
            );
        }

        // Transform column names from snake_case to camelCase
        const runs = (data || []).map((row) => ({
            id: row.id,
            sentenceId: row.sentence_id,
            expectedText: row.expected_text,
            asrText: row.asr_text,
            score: row.score,
            diffs: row.diffs,
            feedback: row.feedback,
            deviceInfo: row.device_info,
            createdAt: row.created_at,
        }));

        return NextResponse.json({
            runs,
            total: count || 0,
        });
    } catch (error) {
        console.error('Runs fetch error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
