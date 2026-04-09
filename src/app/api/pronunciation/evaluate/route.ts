import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supa-client';
import { DiffItem, EvaluationResult } from '@/types/pronunciation';

// Since we are in an API route, we need to create a Supabase client that works server-side
// However, supa-client.ts is designed for browser. We need a server-side client or just use standard fetch for Supabase if needed.
// Actually, `createClient` from `@/lib/supa-client` uses `createBrowserClient` which might not work here.
// Let's use `createRouteHandlerClient` pattern or just `createClient` from `@supabase/supabase-js`.
// For simplicity and reusing existing patterns, let's assume we can use process.env vars directly with `createClient`.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Note: In a real secure app, we should use Service Role key for admin writes or correct user context.
// Here we will rely on the user passing their session or just insert as anon if policy allows, 
// BUT we defined policy as "Users can insert their own runs". 
// So we need the USER'S context. 
// The best way in Next.js App Router is `createServerClient` from `@supabase/ssr` (if available) or passing the access token.

// Let's attempt to use the token passed in headers if possible, or just use anon key and client-side auth will handle it?
// No, API routes run on server. We need to forward auth.
// For MVP, we will extract the User ID from the request body or headers?
// Actually, RLS relies on `auth.uid()`. 
// We will skip saving to DB in this API route for simplicity to avoid auth complexity on server-side for now,
// OR we can save it from the CLIENT side after receiving the score. 
// Saving from CLIENT side is easier for Auth context.
// Let's decide: API returns score, Client saves to Supabase. This avoids server-side auth issues.

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        const expectedText = formData.get('expectedText') as string | null;

        if (!audioFile || !expectedText) {
            return NextResponse.json({ error: 'Missing audio or expected text' }, { status: 400 });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key' }, { status: 500 });
        }

        // 1. OpenAI Whisper API
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

        const whisperFormData = new FormData();
        whisperFormData.append('file', audioBlob, 'recording.webm');
        whisperFormData.append('model', 'whisper-1');
        // whisperFormData.append('language', 'en'); // Auto-detect or pass from client? Let's use auto for poly-lang.

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${openaiKey}` },
            body: whisperFormData,
        });

        if (!whisperResponse.ok) {
            const err = await whisperResponse.text();
            console.error('Whisper API Error:', err);
            return NextResponse.json({ error: 'Speech recognition failed' }, { status: 500 });
        }

        const whisperResult = await whisperResponse.json();
        const asrText = whisperResult.text?.trim() || '';

        // 2. Calculate Score
        const { score, diffs, feedback } = calculatePronunciationScore(expectedText, asrText);

        const result: EvaluationResult = {
            runId: crypto.randomUUID(), // Temp ID, client will generate real one on DB insert or ignore
            score,
            asrText,
            expectedText,
            diffs,
            feedback,
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ data: result });

    } catch (e: any) {
        console.error('API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Helper Functions (Same as pronunciation-main)
function calculatePronunciationScore(expected: string, actual: string) {
    const expectedWords = normalizeText(expected).split(/\s+/).filter(Boolean);
    const actualWords = normalizeText(actual).split(/\s+/).filter(Boolean);

    const diffs: DiffItem[] = [];
    let matchCount = 0;
    const actualUsed = new Set<number>();

    expectedWords.forEach((expectedWord, i) => {
        let bestMatch = -1;
        let bestSimilarity = 0;

        actualWords.forEach((actualWord, j) => {
            if (actualUsed.has(j)) return;
            const similarity = calculateSimilarity(expectedWord, actualWord);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = j;
            }
        });

        if (bestSimilarity >= 0.8) {
            diffs.push({ type: 'match', expected: expectedWord, position: i });
            matchCount++;
            actualUsed.add(bestMatch);
        } else if (bestSimilarity >= 0.4) {
            // Use actual word from best match for display
            diffs.push({ type: 'substitution', expected: expectedWord, actual: actualWords[bestMatch], position: i });
            actualUsed.add(bestMatch);
        } else {
            diffs.push({ type: 'missing', expected: expectedWord, position: i });
        }
    });

    actualWords.forEach((actualWord, j) => {
        if (!actualUsed.has(j)) {
            diffs.push({ type: 'insertion', actual: actualWord, position: expectedWords.length + j });
        }
    });

    const score = Math.round((matchCount / Math.max(expectedWords.length, 1)) * 100);

    // Generate feedback
    const missingCount = diffs.filter((d) => d.type === 'missing').length;
    const substitutionCount = diffs.filter((d) => d.type === 'substitution').length;
    let feedback = '';

    if (score >= 90) feedback = 'Excellent! Clear and accurate.';
    else if (score >= 70) feedback = `Good job. ${substitutionCount > 0 ? `Watch out for ${substitutionCount} mispronunciations.` : ''}`;
    else if (score >= 50) feedback = `Decent attempt. ${missingCount > 0 ? `Try to capture ${missingCount} missing words.` : ''}`;
    else feedback = 'Keep practicing. Try speaking slower.';

    return { score, diffs, feedback };
}

function normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim();
}

function calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    const distance = matrix[b.length][a.length];
    return 1 - distance / Math.max(a.length, b.length);
}
