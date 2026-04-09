-- User-specific sentence analysis history
CREATE TABLE IF NOT EXISTS user_sentence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  sentence_normalized TEXT NOT NULL,
  difficulty TEXT,
  sentence_pattern_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sentence_history_user
  ON user_sentence_history(user_id, created_at DESC);

-- One entry per user per sentence (upsert updates created_at on re-analysis)
CREATE UNIQUE INDEX idx_user_sentence_history_unique
  ON user_sentence_history(user_id, sentence_normalized);
