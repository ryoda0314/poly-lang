-- Add IPA pronunciation feature to credit/usage system

-- Add ipa_credits column to profiles (purchased credits)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ipa_credits INTEGER DEFAULT 0;

-- Add ipa_count column to daily_usage (daily usage tracking)
ALTER TABLE daily_usage
ADD COLUMN IF NOT EXISTS ipa_count INTEGER DEFAULT 0;
