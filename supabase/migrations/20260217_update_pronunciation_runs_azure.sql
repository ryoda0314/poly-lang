-- Add Azure Speech 4-axis score columns to pronunciation_runs
ALTER TABLE pronunciation_runs
  ADD COLUMN IF NOT EXISTS accuracy_score REAL,
  ADD COLUMN IF NOT EXISTS fluency_score REAL,
  ADD COLUMN IF NOT EXISTS completeness_score REAL,
  ADD COLUMN IF NOT EXISTS prosody_score REAL,
  ADD COLUMN IF NOT EXISTS pronunciation_score REAL,
  ADD COLUMN IF NOT EXISTS recognized_text TEXT;
