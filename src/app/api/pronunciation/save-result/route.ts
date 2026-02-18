import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logTokenUsage } from '@/lib/token-usage';

/**
 * Step 2: Save client-side pronunciation assessment results to DB.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            runId,
            phraseId,
            expectedText,
            recognizedText,
            scores,
            words,
            feedback,
            durationSeconds,
        } = body;

        if (!runId || !phraseId || !expectedText) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error: dbErr } = await supabase
            .from('pronunciation_runs')
            .insert({
                id: runId,
                user_id: user.id,
                phrase_id: phraseId,
                expected_text: expectedText,
                asr_text: recognizedText || '',
                score: Math.round(scores?.overall ?? 0),
                diffs: words ?? [],
                feedback: feedback || '',
                accuracy_score: scores?.accuracy ?? 0,
                fluency_score: scores?.fluency ?? 0,
                completeness_score: scores?.completeness ?? 0,
                prosody_score: scores?.prosody ?? 0,
                pronunciation_score: scores?.overall ?? 0,
                recognized_text: recognizedText || '',
                device_info: { mode: 'azure-client', userAgent: request.headers.get('user-agent') || 'unknown' },
            } as any)
            .select()
            .single();

        if (dbErr) {
            console.error('DB save error:', dbErr);
            return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
        }

        // Log Azure Speech cost: durationSeconds stored as input_tokens
        // $1/hour = $277.78/1M seconds (see token-usage.ts azure-speech pricing)
        if (typeof durationSeconds === 'number' && durationSeconds > 0) {
            logTokenUsage(user.id, phraseId ?? 'pronunciation', 'azure-speech', durationSeconds, 0).catch(() => {});
        }

        return NextResponse.json({ success: true, runId: data?.id ?? runId });
    } catch (error) {
        console.error('Pronunciation save error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
