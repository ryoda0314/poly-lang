-- Create furigana cache table for storing kanji to hiragana readings
-- This reduces OpenAI API calls by caching readings across all users

CREATE TABLE IF NOT EXISTS public.furigana_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kanji TEXT NOT NULL UNIQUE,
    reading TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_furigana_cache_kanji ON public.furigana_cache(kanji);

-- No RLS needed - this is a shared read-only cache
ALTER TABLE public.furigana_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public cache)
CREATE POLICY "Allow public read access" ON public.furigana_cache
    FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role insert" ON public.furigana_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update" ON public.furigana_cache
    FOR UPDATE USING (true);
