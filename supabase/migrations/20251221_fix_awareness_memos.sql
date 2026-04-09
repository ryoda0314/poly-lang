-- Fix awareness_memos table

-- 1. Drop the UNIQUE constraint to allow multiple memos per token
ALTER TABLE awareness_memos DROP CONSTRAINT IF EXISTS awareness_memos_user_id_phrase_id_token_index_key;

-- 2. Fix RLS policy: 'for all' should be replaced with specific policies for insert/update/delete
DROP POLICY IF EXISTS "Users can insert/update own memos" ON awareness_memos;

-- Create proper policies for each operation
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
