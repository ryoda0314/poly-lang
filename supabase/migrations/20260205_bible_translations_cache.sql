-- Global Bible verse translations cache (shared across all users)
CREATE TABLE IF NOT EXISTS bible_verse_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    source_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    target_language TEXT NOT NULL DEFAULT 'ja',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(book_id, chapter, verse, target_language)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bible_translations_lookup
ON bible_verse_translations(book_id, chapter, target_language);

-- Enable RLS but allow all authenticated users to read
ALTER TABLE bible_verse_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations
CREATE POLICY "Anyone can read bible translations"
ON bible_verse_translations FOR SELECT
TO authenticated
USING (true);

-- Only allow insert (no update/delete by users - admin only)
CREATE POLICY "System can insert translations"
ON bible_verse_translations FOR INSERT
TO authenticated
WITH CHECK (true);
