-- Phrasal verb / idiom detail cache (shared, keyed by expression + target language)
CREATE TABLE IF NOT EXISTS phrasal_verb_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expression TEXT NOT NULL,
    target_language TEXT NOT NULL DEFAULT 'en',
    type TEXT NOT NULL,
    base_verb TEXT NOT NULL,
    meanings JSONB NOT NULL,
    origin TEXT,
    history TEXT,
    core_image JSONB,
    related_expressions TEXT[],
    formality_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_pv_entry UNIQUE(expression, target_language)
);

CREATE INDEX IF NOT EXISTS idx_pv_entries_expression ON phrasal_verb_entries(expression);
CREATE INDEX IF NOT EXISTS idx_pv_entries_base_verb ON phrasal_verb_entries(base_verb);
CREATE INDEX IF NOT EXISTS idx_pv_entries_target_lang ON phrasal_verb_entries(target_language);

-- Verb explorer cache (shared, keyed by verb + target language)
CREATE TABLE IF NOT EXISTS phrasal_verb_explorer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verb TEXT NOT NULL,
    target_language TEXT NOT NULL DEFAULT 'en',
    expressions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_pv_explorer UNIQUE(verb, target_language)
);

CREATE INDEX IF NOT EXISTS idx_pv_explorer_verb ON phrasal_verb_explorer(verb);

-- User search history for phrasal verbs
CREATE TABLE IF NOT EXISTS phrasal_verb_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_mode TEXT NOT NULL,
    target_language TEXT NOT NULL DEFAULT 'en',
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_search_history_user
ON phrasal_verb_search_history(user_id, searched_at DESC);

-- RLS: phrasal_verb_entries
ALTER TABLE phrasal_verb_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pv entries" ON phrasal_verb_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert pv entries" ON phrasal_verb_entries FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: phrasal_verb_explorer
ALTER TABLE phrasal_verb_explorer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pv explorer" ON phrasal_verb_explorer FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert pv explorer" ON phrasal_verb_explorer FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: phrasal_verb_search_history
ALTER TABLE phrasal_verb_search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own pv history" ON phrasal_verb_search_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pv history" ON phrasal_verb_search_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
