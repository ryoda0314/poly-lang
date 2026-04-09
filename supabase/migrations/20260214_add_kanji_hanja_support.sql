-- ============================================
-- Migration: Add Kanji-Hanja Learning Support
-- ============================================
-- This migration extends the phrase_sets system to support
-- Japanese kanji → Korean hanja learning feature

-- 1. Add set_type to distinguish kanji-hanja sets from regular phrase sets
ALTER TABLE phrase_sets
ADD COLUMN set_type TEXT DEFAULT 'phrase' CHECK (set_type IN ('phrase', 'kanji_hanja'));

CREATE INDEX idx_phrase_sets_user_lang_type ON phrase_sets(user_id, language_code, set_type);

-- 2. Extend phrase_set_items for kanji-hanja specific data
ALTER TABLE phrase_set_items
ADD COLUMN kanji_text TEXT,
ADD COLUMN hanja_text TEXT,
ADD COLUMN korean_reading TEXT,
ADD COLUMN hanja_meaning TEXT,
ADD COLUMN word_type TEXT CHECK (word_type IN ('character', 'compound', NULL));

CREATE INDEX idx_phrase_set_items_kanji ON phrase_set_items(kanji_text) WHERE kanji_text IS NOT NULL;

-- 3. Create kanji_hanja_mappings cache table
CREATE TABLE kanji_hanja_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kanji TEXT NOT NULL,
    hanja TEXT NOT NULL,
    korean_reading TEXT NOT NULL,
    hanja_meaning TEXT,
    word_type TEXT NOT NULL CHECK (word_type IN ('character', 'compound')),
    additional_readings JSONB,
    usage_examples JSONB,
    source TEXT NOT NULL CHECK (source IN ('openai', 'manual')),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kanji, word_type)
);

CREATE INDEX idx_kanji_hanja_mappings_kanji ON kanji_hanja_mappings(kanji);
CREATE INDEX idx_kanji_hanja_mappings_type ON kanji_hanja_mappings(word_type);

-- Enable RLS
ALTER TABLE kanji_hanja_mappings ENABLE ROW LEVEL SECURITY;

-- Public read access (cached data is language-universal)
CREATE POLICY "Anyone can read kanji mappings"
    ON kanji_hanja_mappings FOR SELECT
    TO authenticated
    USING (true);

-- Service role can insert (for automated caching)
-- Note: Service role bypasses RLS, but policy makes intent explicit
CREATE POLICY "Service role can insert mappings"
    ON kanji_hanja_mappings FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admin users can update/delete if needed
CREATE POLICY "Service role can update mappings"
    ON kanji_hanja_mappings FOR UPDATE
    TO authenticated
    USING (true);
