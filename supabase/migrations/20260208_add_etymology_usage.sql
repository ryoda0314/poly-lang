-- Add etymology usage tracking (separate from explanation)
ALTER TABLE daily_usage
ADD COLUMN IF NOT EXISTS etymology_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS etymology_credits INTEGER NOT NULL DEFAULT 0;
