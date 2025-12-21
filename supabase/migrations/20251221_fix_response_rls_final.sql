-- Comprehensive Fix for Awareness Memos RLS
-- This script ensures RLS is ENABLED and all necessary policies exist.

-- 1. Enable Row Level Security (Critical: User screenshot showed this was DISABLED)
ALTER TABLE awareness_memos ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts/duplicates
DROP POLICY IF EXISTS "Users can view own memos" ON awareness_memos;
DROP POLICY IF EXISTS "Users can insert own memos" ON awareness_memos;
DROP POLICY IF EXISTS "Users can update own memos" ON awareness_memos;
DROP POLICY IF EXISTS "Users can delete own memos" ON awareness_memos;
DROP POLICY IF EXISTS "Users can insert/update own memos" ON awareness_memos;

-- 3. Re-create all CRUD policies
CREATE POLICY "Users can view own memos" 
  ON awareness_memos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memos" 
  ON awareness_memos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos" 
  ON awareness_memos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos" 
  ON awareness_memos 
  FOR DELETE 
  USING (auth.uid() = user_id);
