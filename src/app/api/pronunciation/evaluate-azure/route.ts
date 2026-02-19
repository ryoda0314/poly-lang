import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeCredit } from '@/lib/limits';
import { randomUUID } from 'crypto';

/**
 * Step 1: Consume credit + return speech token.
 * Actual Azure evaluation happens client-side (same auth flow as CorrectionSidebar).
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phraseId, expectedText, mode } = await request.json();
        if (!phraseId || !expectedText) {
            return NextResponse.json({ error: 'Missing phraseId or expectedText' }, { status: 400 });
        }

        const creditType = mode === 'speaking' ? 'speaking' : 'pronunciation';
        const limitCheck = await checkAndConsumeCredit(user.id, creditType, supabase);
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.error || 'Insufficient credits' }, { status: 429 });
        }

        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;
        if (!speechKey || !speechRegion) {
            return NextResponse.json({ error: 'Azure Speech not configured' }, { status: 500 });
        }

        // Get auth token (same as /api/speech-token)
        const tokenRes = await fetch(
            `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': speechKey,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        if (!tokenRes.ok) {
            console.error(`[pronunciation] Token fetch failed: ${tokenRes.status}`);
            return NextResponse.json({ error: 'Failed to get speech token' }, { status: 502 });
        }

        const token = await tokenRes.text();
        const runId = randomUUID();

        return NextResponse.json({
            token,
            region: speechRegion,
            runId,
        });
    } catch (error) {
        console.error('Pronunciation prepare error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
