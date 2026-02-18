import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/pronunciation/sentence-scores
 * Returns best score and attempt count per phrase_id for the current user.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: rows, error } = await supabase
            .from('pronunciation_runs')
            .select('phrase_id, score')
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to fetch sentence scores:', error);
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
        }

        // Aggregate: best score and count per phrase_id
        const map = new Map<string, { bestScore: number; attempts: number }>();
        for (const row of rows ?? []) {
            if (!row.phrase_id) continue;
            const existing = map.get(row.phrase_id);
            const score = row.score ?? 0;
            if (existing) {
                existing.bestScore = Math.max(existing.bestScore, score);
                existing.attempts++;
            } else {
                map.set(row.phrase_id, { bestScore: score, attempts: 1 });
            }
        }

        const scores: Record<string, { bestScore: number; attempts: number }> = {};
        for (const [key, value] of map) {
            scores[key] = value;
        }

        return NextResponse.json({ scores });
    } catch (error) {
        console.error('Sentence scores error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
