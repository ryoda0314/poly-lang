-- Enable RLS and add policies for user_sentence_history
ALTER TABLE user_sentence_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON user_sentence_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON user_sentence_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
  ON user_sentence_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON user_sentence_history FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS for sentence_analysis_cache (shared cache, no user_id)
ALTER TABLE sentence_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cache"
  ON sentence_analysis_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert cache"
  ON sentence_analysis_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update cache"
  ON sentence_analysis_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL);
