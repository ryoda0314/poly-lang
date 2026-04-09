-- Pronunciation Runs Table
-- Migration: Create pronunciation_runs table for storing evaluation results

CREATE TABLE IF NOT EXISTS pronunciation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id TEXT NOT NULL,
  expected_text TEXT NOT NULL,
  asr_text TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  diffs JSONB NOT NULL DEFAULT '[]',
  feedback TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_sentence_id ON pronunciation_runs(sentence_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_created_at ON pronunciation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_score ON pronunciation_runs(score);

-- Enable Row Level Security
ALTER TABLE pronunciation_runs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust for production)
CREATE POLICY "Allow all operations on pronunciation_runs" ON pronunciation_runs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON pronunciation_runs TO anon;
GRANT ALL ON pronunciation_runs TO authenticated;
