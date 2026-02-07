-- Add confidence and has_wiktionary_data columns to etymology_entries
ALTER TABLE etymology_entries ADD COLUMN IF NOT EXISTS confidence JSONB DEFAULT NULL;
ALTER TABLE etymology_entries ADD COLUMN IF NOT EXISTS has_wiktionary_data BOOLEAN NOT NULL DEFAULT false;
