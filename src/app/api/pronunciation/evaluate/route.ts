import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiffItem, EvaluationResult } from '@/types/pronunciation';


export async function POST(request: NextRequest) {
    try {
        // 認証チェック
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        const expectedText = formData.get('expectedText') as string | null;

        if (!audioFile || !expectedText) {
            return NextResponse.json({ error: 'Missing audio or expected text' }, { status: 400 });
        }

        // ファイルサイズチェック（10MB以下）
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (audioFile.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Max 10MB allowed' }, { status: 400 });
        }

        // ファイルタイプチェック
        const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
        if (!allowedTypes.includes(audioFile.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: webm, mp3, wav, ogg, m4a' }, { status: 400 });
        }

        // expectedTextの長さ制限
        if (expectedText.length > 1000) {
            return NextResponse.json({ error: 'Expected text too long. Max 1000 characters' }, { status: 400 });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            console.error('Missing OPENAI_API_KEY environment variable');
            return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
