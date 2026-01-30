-- Create extraction_jobs table for async image extraction processing
CREATE TABLE extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Job parameters (stored at creation)
    image_data TEXT NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    native_lang VARCHAR(10) NOT NULL,
    phrase_set_id UUID REFERENCES phrase_sets(id) ON DELETE SET NULL,

    -- Job status: pending, processing, completed, failed
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,

    -- Results (populated on completion)
    extracted_phrases JSONB,
    phrase_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Notification tracking
    notification_sent BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_extraction_jobs_user_id ON extraction_jobs(user_id);
CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_created_at ON extraction_jobs(created_at DESC);

-- Index for cron job to find pending jobs efficiently
CREATE INDEX idx_extraction_jobs_pending ON extraction_jobs(status, created_at)
    WHERE status = 'pending';

-- Index for notification polling
CREATE INDEX idx_extraction_jobs_completed_unnotified ON extraction_jobs(user_id, completed_at)
    WHERE status = 'completed' AND notification_sent = FALSE;

-- Enable RLS
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own extraction jobs
CREATE POLICY "Users can view own extraction jobs"
    ON extraction_jobs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own extraction jobs
CREATE POLICY "Users can insert own extraction jobs"
    ON extraction_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own extraction jobs (for marking as viewed)
CREATE POLICY "Users can update own extraction jobs"
    ON extraction_jobs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
