-- Create enum for verification status
-- Check if type exists first to avoid error on rerun, but standard SQL usually just errors. 
-- In pure SQL script for Supabase, we usually just CREATE TYPE.
CREATE TYPE verification_status_type AS ENUM ('unverified', 'attempted', 'verified');

-- Add columns to awareness_memos
ALTER TABLE awareness_memos
ADD COLUMN status verification_status_type NOT NULL DEFAULT 'unverified',
ADD COLUMN attempted_at TIMESTAMPTZ,
ADD COLUMN verified_at TIMESTAMPTZ,
ADD COLUMN strength SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN last_reviewed_at TIMESTAMPTZ,
ADD COLUMN next_review_at TIMESTAMPTZ;

-- Add index for efficient querying of review queue and unverified items
CREATE INDEX idx_memos_status_user ON awareness_memos(user_id, status);
CREATE INDEX idx_memos_next_review ON awareness_memos(user_id, next_review_at);
