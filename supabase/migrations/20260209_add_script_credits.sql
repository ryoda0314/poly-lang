-- Add script credits to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS script_credits INTEGER DEFAULT 0 NOT NULL;

-- Add script count to daily_usage
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS script_count INTEGER DEFAULT 0 NOT NULL;
