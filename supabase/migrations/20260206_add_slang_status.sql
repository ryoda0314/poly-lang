-- Add status column for moderation queue
ALTER TABLE public.slang_terms
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_slang_terms_status ON public.slang_terms(status);

-- Allow anonymous users to insert pending slang suggestions
CREATE POLICY "Anyone can suggest slang"
  ON public.slang_terms FOR INSERT
  WITH CHECK (status = 'pending');
