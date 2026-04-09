-- Fix: Add missing kanji_hanja_count column to daily_usage
-- The increment_daily_usage RPC references all count columns in CASE statements,
-- so a missing column breaks ALL credit checks (not just kanji_hanja).

ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS kanji_hanja_count INTEGER DEFAULT 0;

-- Also ensure ipa_count exists (should already exist from 20260214_add_ipa_credits.sql)
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS ipa_count INTEGER DEFAULT 0;
