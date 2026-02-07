-- Add demographics columns to slang_votes
ALTER TABLE public.slang_votes ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE public.slang_votes ADD COLUMN IF NOT EXISTS gender TEXT;
