-- Add source_type to track where etymology data came from
ALTER TABLE etymology_entries
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'ai_only';

-- Backfill existing entries based on has_wiktionary_data
UPDATE etymology_entries
SET source_type = 'wiktionary'
WHERE has_wiktionary_data = TRUE;