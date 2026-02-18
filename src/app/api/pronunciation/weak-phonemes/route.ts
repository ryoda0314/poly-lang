import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/pronunciation/weak-phonemes
 * Aggregates phoneme scores from recent pronunciation runs to identify weak phonemes.
 * Pass ?all=true to include phonemes with fewer than 2 occurrences.
 */
export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get('all') === 'true';
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch recent runs with word/phoneme data (last 50 runs)
        const { data: runs, error } = await supabase
            .from('pronunciation_runs')
            .select('diffs')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Failed to fetch runs:', error);
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
        }

        // Aggregate phoneme scores
        const phonemeMap = new Map<string, { total: number; count: number; low: number }>();

        for (const run of runs ?? []) {
            const words = run.diffs as Array<{
                word: string;
                accuracyScore: number;
                errorType: string;
                phonemes: Array<{ phoneme: string; accuracyScore: number }>;
            }> | null;

            if (!words || !Array.isArray(words)) continue;

            for (const word of words) {
                if (!word.phonemes || !Array.isArray(word.phonemes)) continue;
                for (const p of word.phonemes) {
                    const existing = phonemeMap.get(p.phoneme) ?? { total: 0, count: 0, low: 0 };
                    existing.total += p.accuracyScore;
                    existing.count++;
                    if (p.accuracyScore < 60) existing.low++;
                    phonemeMap.set(p.phoneme, existing);
                }
            }
        }

        // Convert to sorted array — sort by average score ascending (weakest first)
        const phonemes = [...phonemeMap.entries()]
            .filter(([, v]) => showAll || v.count >= 2)
            .map(([phoneme, { total, count, low }]) => ({
                phoneme,
                avgScore: Math.round(total / count),
                count,
                lowCount: low,
            }))
            .sort((a, b) => a.avgScore - b.avgScore);

        return NextResponse.json({
            phonemes,
            totalRuns: runs?.length ?? 0,
        });
    } catch (error) {
        console.error('Weak phonemes error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
