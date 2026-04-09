import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { extractPhrasesFromImage } from "@/actions/image-extract";
import { tokenizePhrases } from "@/actions/tokenize";
import type { Json } from "@/types/supabase";

/**
 * Process a single pending job for the user.
 * Called during polling to enable on-demand processing without cron.
 */
async function processOnePendingJob(userId: string) {
    const supabase = await createAdminClient();

    // Get the oldest pending job for this user
    const { data: pendingJob } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (!pendingJob) return null;

    try {
        // Mark as processing
        await supabase
            .from('extraction_jobs')
            .update({ status: 'processing', started_at: new Date().toISOString() })
            .eq('id', pendingJob.id);

        // Extract phrases from image
        const extractResult = await extractPhrasesFromImage(
            pendingJob.image_data,
            pendingJob.target_lang,
            pendingJob.native_lang
        );

        if (!extractResult.success) {
            await supabase
                .from('extraction_jobs')
                .update({
                    status: 'failed',
                    error_message: extractResult.error || 'Extraction failed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', pendingJob.id);

            return { status: 'failed', error: extractResult.error };
        }

        // Tokenize extracted phrases
        let phrasesWithTokens = extractResult.phrases;
        if (extractResult.phrases.length > 0) {
            const tokenizeInputs = extractResult.phrases.map(p => ({
                text: p.target_text,
                lang: pendingJob.target_lang
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
                extracted_phrases: phrasesWithTokens as unknown as Json,
                phrase_count: phrasesWithTokens.length,
                completed_at: new Date().toISOString()
            })
            .eq('id', pendingJob.id);

        // Log learning event
        await supabase.from('learning_events').insert({
            user_id: pendingJob.user_id,
            language_code: pendingJob.target_lang,
            event_type: 'image_extract',
            xp_delta: 0,
            meta: { phrase_count: phrasesWithTokens.length, job_id: pendingJob.id }
        });

        return { status: 'completed', phraseCount: phrasesWithTokens.length };

    } catch (error) {
        console.error(`Failed to process job ${pendingJob.id}:`, error);

        await supabase
            .from('extraction_jobs')
            .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                completed_at: new Date().toISOString()
            })
            .eq('id', pendingJob.id);

        return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Polling endpoint for checking completed extraction jobs.
 * Also triggers on-demand processing for pending jobs.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ jobs: [] });
    }

    // Check if user has any pending jobs and process one
    const { data: hasPending } = await supabase
        .from('extraction_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1);

    if (hasPending && hasPending.length > 0) {
        // Process one pending job on-demand
        await processOnePendingJob(user.id);
    }

    // Fetch completed/failed jobs that haven't been notified
    const { data: jobs, error } = await supabase
        .from('extraction_jobs')
        .select('id, status, phrase_count, completed_at, extracted_phrases')
        .eq('user_id', user.id)
        .eq('notification_sent', false)
        .in('status', ['completed', 'failed'])
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch pending notifications:', error);
        return NextResponse.json({ jobs: [] });
    }

    return NextResponse.json({ jobs: jobs || [] });
}

/**
 * Mark jobs as notified after showing toast.
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobIds } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return NextResponse.json({ error: 'Invalid jobIds' }, { status: 400 });
    }

    await supabase
        .from('extraction_jobs')
        .update({ notification_sent: true })
        .in('id', jobIds)
        .eq('user_id', user.id);

    return NextResponse.json({ success: true });
}
