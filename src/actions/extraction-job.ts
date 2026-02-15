"use server";

import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";

export interface CreateExtractionJobResult {
    success: boolean;
    jobId?: string;
    error?: string;
}

export interface ExtractionJobOptions {
    includeReading: boolean;
    autoGenerateTranslation: boolean;
    autoGenerateReading: boolean;
}

export interface ExtractionJob {
    id: string;
    user_id: string;
    image_data: string;
    target_lang: string;
    native_lang: string;
    phrase_set_id: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message: string | null;
    extracted_phrases: Array<{
        target_text: string;
        translation: string;
        tokens?: string[];
    }> | null;
    phrase_count: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    notification_sent: boolean;
    viewed_at: string | null;
    options?: ExtractionJobOptions | null;
}

/**
 * Creates a new extraction job and queues it for background processing.
 * Credits are consumed at job creation time.
 */
export async function createExtractionJob(
    imageBase64: string,
    targetLang: string,
    nativeLang: string,
    phraseSetId?: string,
    options?: ExtractionJobOptions
): Promise<CreateExtractionJobResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            error: "User not authenticated"
        };
    }

    // Validate image size (prevent DoS via oversized uploads)
    const MAX_IMAGE_BASE64_LENGTH = 20_000_000; // ~15MB
    if (!imageBase64 || imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
        return {
            success: false,
            error: "Image data is too large (max ~15MB)"
        };
    }

    // Validate language codes
    const VALID_LANG_CODES = ['en', 'ja', 'ko', 'zh', 'fr', 'es', 'de', 'ru', 'vi', 'it', 'nl', 'sv', 'pl', 'pt', 'id', 'tr', 'ar', 'hi', 'th'];
    if (!VALID_LANG_CODES.includes(targetLang) || !VALID_LANG_CODES.includes(nativeLang)) {
        return {
            success: false,
            error: "Invalid language code"
        };
    }

    // Check and consume extraction credit BEFORE creating job
    const creditCheck = await checkAndConsumeCredit(user.id, "extraction", supabase);
    if (!creditCheck.allowed) {
        return {
            success: false,
            error: creditCheck.error || "Insufficient extraction credits"
        };
    }

    // Create the extraction job
    const { data, error } = await supabase
        .from('extraction_jobs')
        .insert({
            user_id: user.id,
            image_data: imageBase64,
            target_lang: targetLang,
            native_lang: nativeLang,
            phrase_set_id: phraseSetId || null,
            status: 'pending',
            options: options ? (options as any) : null
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to create extraction job:', error);
        return {
            success: false,
            error: "Failed to create extraction job"
        };
    }

    return {
        success: true,
        jobId: data.id
    };
}

/**
 * Gets a single extraction job by ID.
 */
export async function getExtractionJob(jobId: string): Promise<ExtractionJob | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        return null;
    }

    return data as ExtractionJob;
}

/**
 * Gets all extraction jobs for the current user.
 */
export async function getExtractionJobs(limit: number = 20): Promise<ExtractionJob[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) {
        return [];
    }

    return data as ExtractionJob[];
}

/**
 * Gets newly completed jobs that haven't been notified yet.
 * Used for polling to show toast notifications.
 */
export async function getCompletedUnnotifiedJobs(): Promise<ExtractionJob[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('notification_sent', false)
        .order('completed_at', { ascending: false });

    if (error || !data) {
        return [];
    }

    return data as ExtractionJob[];
}

/**
 * Marks jobs as notified (called after showing toast).
 */
export async function markJobsAsNotified(jobIds: string[]): Promise<void> {
    if (jobIds.length === 0) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('extraction_jobs')
        .update({ notification_sent: true })
        .in('id', jobIds)
        .eq('user_id', user.id);
}

/**
 * Marks a job as viewed (when user opens the history page or views details).
 */
export async function markJobAsViewed(jobId: string): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('extraction_jobs')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('user_id', user.id);
}

/**
 * Deletes an extraction job.
 */
export async function deleteExtractionJob(jobId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase
        .from('extraction_jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

    return !error;
}
