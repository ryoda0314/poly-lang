-- Cache table for sentence analysis results
CREATE TABLE IF NOT EXISTS sentence_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_normalized TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sentence_normalized)
);

CREATE INDEX idx_sentence_analysis_cache_sentence
  ON sentence_analysis_cache(sentence_normalized);

-- Add sentence_count to daily_usage
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS sentence_count INTEGER DEFAULT 0;

-- Add sentence_credits to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sentence_credits INTEGER DEFAULT 0;
