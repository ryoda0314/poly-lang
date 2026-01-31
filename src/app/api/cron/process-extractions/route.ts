import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractPhrasesFromImage } from "@/actions/image-extract";
import { tokenizePhrases } from "@/actions/tokenize";

const BATCH_SIZE = 5; // Process up to 5 jobs per cron run
const PROCESSING_TIMEOUT_MINUTES = 10; // Reset stale processing jobs

export async function GET(request: NextRequest) {
    // Verify cron secret from Vercel
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const results: Array<{ jobId: string; status: string; phraseCount?: number; error?: string }> = [];

    try {
        // First, reset any stale "processing" jobs that have been stuck
        const staleThreshold = new Date(Date.now() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000).toISOString();
        await supabase
            .from('extraction_jobs')
            .update({ status: 'pending', started_at: null })
            .eq('status', 'processing')
            .lt('started_at', staleThreshold);

        // Fetch pending jobs
        const { data: pendingJobs, error: fetchError } = await supabase
            .from('extraction_jobs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error('Failed to fetch pending jobs:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        if (!pendingJobs || pendingJobs.length === 0) {
            return NextResponse.json({ message: 'No pending jobs', processed: 0 });
        }

        // Process each job
        for (const job of pendingJobs) {
            try {
                // Mark as processing
                await supabase
                    .from('extraction_jobs')
                    .update({ status: 'processing', started_at: new Date().toISOString() })
                    .eq('id', job.id);

                // Extract phrases from image
                const extractResult = await extractPhrasesFromImage(
                    job.image_data,
                    job.target_lang,
                    job.native_lang
                );

                if (!extractResult.success) {
                    // Mark as failed
                    await supabase
                        .from('extraction_jobs')
                        .update({
                            status: 'failed',
                            error_message: extractResult.error || 'Extraction failed',
                            completed_at: new Date().toISOString()
                        })
                        .eq('id', job.id);

                    results.push({
                        jobId: job.id,
                        status: 'failed',
                        error: extractResult.error
                    });
                    continue;
                }

                // Tokenize extracted phrases
                let phrasesWithTokens = extractResult.phrases;
                if (extractResult.phrases.length > 0) {
                    const tokenizeInputs = extractResult.phrases.map(p => ({
                        text: p.target_text,
                        lang: job.target_lang
                    }));

                    const tokenized = await tokenizePhrases(tokenizeInputs);

                    phrasesWithTokens = extractResult.phrases.map((phrase, index) => ({
                        ...phrase,
                        tokens: tokenized[index]?.tokens || []
                    }));
                }

                // Mark as completed
                await supabase
                    .from('extraction_jobs')
                    .update({
                        status: 'completed',
                        extracted_phrases: phrasesWithTokens as unknown as import('@/types/supabase').Json,
                        phrase_count: phrasesWithTokens.length,
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', job.id);

                // Log learning event
                await supabase.from('learning_events').insert({
                    user_id: job.user_id,
                    language_code: job.target_lang,
                    event_type: 'image_extract',
                    xp_delta: 0,
                    meta: { phrase_count: phrasesWithTokens.length, job_id: job.id }
                });

                results.push({
                    jobId: job.id,
                    status: 'completed',
                    phraseCount: phrasesWithTokens.length
                });

            } catch (error) {
                console.error(`Failed to process job ${job.id}:`, error);

                // Mark as failed
                await supabase
                    .from('extraction_jobs')
                    .update({
                        status: 'failed',
                        error_message: error instanceof Error ? error.message : 'Unknown error',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', job.id);

                results.push({
                    jobId: job.id,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            message: `Processed ${results.length} jobs`,
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
