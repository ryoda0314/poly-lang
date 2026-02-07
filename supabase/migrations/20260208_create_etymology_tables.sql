-- Etymology entries cache (AI-structured from Wiktionary data)
CREATE TABLE IF NOT EXISTS etymology_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    definition TEXT,
    origin_language TEXT,
    etymology_summary TEXT,
    pronunciation TEXT,
    part_breakdown JSONB,
    first_known_use TEXT,
    tree_data JSONB,
    etymology_story TEXT,
    learning_hints JSONB,
    nuance_notes JSONB,
    cognates JSONB,
    raw_wikitext TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etymology_entries_word
ON etymology_entries(word);

-- Word parts library (prefixes, suffixes, roots)
CREATE TABLE IF NOT EXISTS etymology_word_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part TEXT NOT NULL,
    part_type TEXT NOT NULL,
    meaning TEXT NOT NULL,
    origin_language TEXT NOT NULL,
    examples TEXT[],
    learning_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_etymology_part UNIQUE(part, part_type)
);

CREATE INDEX IF NOT EXISTS idx_etymology_word_parts_type
ON etymology_word_parts(part_type);

CREATE INDEX IF NOT EXISTS idx_etymology_word_parts_origin
ON etymology_word_parts(origin_language);

-- Derivation relationships (parent-child word connections)
CREATE TABLE IF NOT EXISTS etymology_derivations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_word TEXT NOT NULL,
    child_word TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_etymology_derivation UNIQUE(parent_word, child_word)
);

CREATE INDEX IF NOT EXISTS idx_etymology_derivations_parent
ON etymology_derivations(parent_word);

CREATE INDEX IF NOT EXISTS idx_etymology_derivations_child
ON etymology_derivations(child_word);

-- User search history
CREATE TABLE IF NOT EXISTS etymology_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etymology_search_history_user
ON etymology_search_history(user_id, searched_at DESC);

-- RLS: etymology_entries (shared cache - all authenticated can read/insert)
ALTER TABLE etymology_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read etymology entries"
ON etymology_entries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert etymology entries"
ON etymology_entries FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS: etymology_word_parts (shared - all authenticated can read)
ALTER TABLE etymology_word_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read word parts"
ON etymology_word_parts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert word parts"
ON etymology_word_parts FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS: etymology_derivations (shared cache)
ALTER TABLE etymology_derivations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read derivations"
ON etymology_derivations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert derivations"
ON etymology_derivations FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS: etymology_search_history (user-scoped)
ALTER TABLE etymology_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own search history"
ON etymology_search_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
ON etymology_search_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
ON etymology_search_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
