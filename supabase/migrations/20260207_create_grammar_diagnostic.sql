-- Grammar diagnostic sessions (tracks AI generation + diagnostic history)
CREATE TABLE IF NOT EXISTS grammar_diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    native_language VARCHAR(10) NOT NULL,
    category TEXT,
    total_patterns INTEGER NOT NULL,
    known_count INTEGER DEFAULT 0,
    unknown_count INTEGER DEFAULT 0,
    generated_patterns JSONB NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_sessions_user
ON grammar_diagnostic_sessions(user_id, created_at DESC);

-- Grammar patterns (user's "to learn" list from diagnostics)
CREATE TABLE IF NOT EXISTS grammar_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    pattern_template TEXT NOT NULL,
    example_sentence TEXT NOT NULL,
    translation TEXT NOT NULL,
    category TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'to_learn' CHECK (status IN ('to_learn', 'learning', 'mastered')),
    session_id UUID REFERENCES grammar_diagnostic_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_grammar_pattern UNIQUE(user_id, language_code, pattern_template)
);

CREATE INDEX IF NOT EXISTS idx_grammar_patterns_user_lang
ON grammar_patterns(user_id, language_code);

CREATE INDEX IF NOT EXISTS idx_grammar_patterns_status
ON grammar_patterns(status);

-- Enable RLS for grammar_diagnostic_sessions
ALTER TABLE grammar_diagnostic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diagnostic sessions"
ON grammar_diagnostic_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnostic sessions"
ON grammar_diagnostic_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnostic sessions"
ON grammar_diagnostic_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS for grammar_patterns
ALTER TABLE grammar_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grammar patterns"
ON grammar_patterns FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grammar patterns"
ON grammar_patterns FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grammar patterns"
ON grammar_patterns FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grammar patterns"
ON grammar_patterns FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
