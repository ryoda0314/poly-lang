-- Pre-stocked Wiktionary raw wikitext for faster etymology lookups
CREATE TABLE IF NOT EXISTS etymology_wikitext_stock (
    word TEXT NOT NULL,
    target_language TEXT NOT NULL,
    raw_wikitext TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (word, target_language)
);

CREATE INDEX idx_wikitext_stock_lang ON etymology_wikitext_stock(target_language);

-- RLS: allow authenticated users to read
ALTER TABLE etymology_wikitext_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wikitext stock"
    ON etymology_wikitext_stock FOR SELECT
    TO authenticated
    USING (true);
