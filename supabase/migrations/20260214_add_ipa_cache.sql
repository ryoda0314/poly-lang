-- ============================================
-- Migration: Add IPA pronunciation cache
-- ============================================
-- Caches IPA (International Phonetic Alphabet) transcriptions
-- for English text to avoid repeated LLM generation.
-- Supports two modes: word-by-word and connected speech.

CREATE TABLE ipa_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash TEXT NOT NULL,
    original_text TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('word', 'connected')),
    ipa TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(text_hash, mode)
);

CREATE INDEX idx_ipa_cache_hash_mode ON ipa_cache(text_hash, mode);

ALTER TABLE ipa_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read IPA cache"
    ON ipa_cache FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can insert IPA"
    ON ipa_cache FOR INSERT
    TO authenticated
    WITH CHECK (true);
