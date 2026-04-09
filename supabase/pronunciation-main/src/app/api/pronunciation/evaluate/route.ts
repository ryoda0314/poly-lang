import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        // Parse multipart form data
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        const sentenceId = formData.get('sentenceId') as string | null;
        const expectedText = formData.get('expectedText') as string | null;

        // Validate inputs
        if (!audioFile) {
            return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
        }
        if (!sentenceId) {
            return NextResponse.json({ error: 'Sentence ID is required' }, { status: 400 });
        }
        if (!expectedText) {
            return NextResponse.json({ error: 'Expected text is required' }, { status: 400 });
        }

        // Check for OpenAI API key
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json(
                { error: 'OPENAI_API_KEY is not configured. Please set it in .env.local' },
                { status: 500 }
            );
        }

        // Convert audio to buffer for Whisper API
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

        // Create form data for Whisper API
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioBlob, 'recording.webm');
        whisperFormData.append('model', 'whisper-1');
        whisperFormData.append('language', 'en');

        // Call Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${openaiKey}`,
            },
            body: whisperFormData,
        });

        if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text();
            console.error('Whisper API error:', errorText);
            return NextResponse.json(
                { error: 'Speech recognition failed. Please check your OpenAI API key.' },
                { status: 500 }
            );
        }

        const whisperResult = await whisperResponse.json();
        const asrText = whisperResult.text?.trim() || '';

        // Calculate pronunciation score and diffs
        const { score, diffs, feedback } = calculatePronunciationScore(expectedText, asrText);

        // Save to Supabase
        let runId = crypto.randomUUID();
        try {
            const supabase = createServerClient();
            const { data, error } = await supabase
                .from('pronunciation_runs')
                .insert({
                    id: runId,
                    sentence_id: sentenceId,
                    expected_text: expectedText,
                    asr_text: asrText,
                    score,
                    diffs,
                    feedback,
                    device_info: {
                        userAgent: request.headers.get('user-agent') || 'unknown',
                    },
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                // Continue without DB save - still return results
            } else if (data) {
                runId = data.id;
            }
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Continue without DB save
        }

        return NextResponse.json({
            runId,
            score,
            asrText,
            expectedText,
            diffs,
            feedback,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Evaluate error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// Calculate pronunciation score using word-level comparison
function calculatePronunciationScore(expected: string, actual: string) {
    const expectedWords = normalizeText(expected).split(/\s+/).filter(Boolean);
    const actualWords = normalizeText(actual).split(/\s+/).filter(Boolean);

    const diffs: Array<{
        type: 'match' | 'missing' | 'substitution' | 'insertion';
        expected?: string;
        actual?: string;
        position: number;
    }> = [];

    let matchCount = 0;
    const actualUsed = new Set<number>();

    // Compare each expected word
    expectedWords.forEach((expectedWord, i) => {
        // Find best match in actual words
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
            // Good match
            diffs.push({ type: 'match', expected: expectedWord, position: i });
            matchCount++;
            actualUsed.add(bestMatch);
        } else if (bestSimilarity >= 0.4) {
            // Substitution (similar but not exact)
            diffs.push({
                type: 'substitution',
                expected: expectedWord,
                actual: actualWords[bestMatch],
                position: i,
            });
            actualUsed.add(bestMatch);
        } else {
            // Missing
            diffs.push({ type: 'missing', expected: expectedWord, position: i });
        }
    });

    // Check for insertions
    actualWords.forEach((actualWord, j) => {
        if (!actualUsed.has(j)) {
            diffs.push({
                type: 'insertion',
                actual: actualWord,
                position: expectedWords.length + j,
            });
        }
    });

    // Calculate score
    const score = Math.round((matchCount / Math.max(expectedWords.length, 1)) * 100);

    // Generate feedback
    const missingCount = diffs.filter((d) => d.type === 'missing').length;
    const substitutionCount = diffs.filter((d) => d.type === 'substitution').length;

    let feedback = '';
    if (score >= 90) {
        feedback = 'Excellent pronunciation! Your speech was clear and accurate.';
    } else if (score >= 70) {
        feedback = 'Good job! Most words were pronounced correctly. ';
        if (substitutionCount > 0) {
            feedback += `Focus on clarifying ${substitutionCount} word${substitutionCount > 1 ? 's' : ''} that were slightly different.`;
        }
    } else if (score >= 50) {
        feedback = 'Decent attempt. ';
        if (missingCount > 0) {
            feedback += `Try to pronounce ${missingCount} missing word${missingCount > 1 ? 's' : ''} more clearly. `;
        }
        feedback += 'Practice speaking slowly and distinctly.';
    } else {
        feedback = 'Keep practicing! Try speaking more slowly and pronouncing each word clearly. Listen to native speakers for reference.';
    }

    return { score, diffs, feedback };
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .trim();
}

function calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Levenshtein distance based similarity
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
}
