-- Create pronunciation_runs table
CREATE TABLE IF NOT EXISTS pronunciation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phrase_id TEXT NOT NULL,
  expected_text TEXT NOT NULL,
  asr_text TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  diffs JSONB NOT NULL DEFAULT '[]',
  feedback TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_user_phrase ON pronunciation_runs(user_id, phrase_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_created_at ON pronunciation_runs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE pronunciation_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own runs" ON pronunciation_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own runs" ON pronunciation_runs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant permissions (if needed for anon access in strictly public apps, but we require auth)
-- GRANT ALL ON pronunciation_runs TO authenticated;
