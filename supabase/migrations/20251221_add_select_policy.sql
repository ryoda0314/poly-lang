-- Add missing SELECT policy for awareness_memos
-- Previous migration removed the 'for all' policy but only added INSERT, UPDATE, DELETE policies.

CREATE POLICY "Users can view own memos" 
  ON awareness_memos 
  FOR SELECT 
  USING (auth.uid() = user_id);
