-- User's saved vocabulary words (My単語帳)
CREATE TABLE IF NOT EXISTS user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    target_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    reading TEXT,
    source_topic TEXT,
    miss_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_vocab UNIQUE(user_id, language_code, target_text)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_lang
ON user_vocabulary(user_id, language_code);

CREATE INDEX IF NOT EXISTS idx_user_vocabulary_topic
ON user_vocabulary(source_topic);

-- Vocabulary generation sessions (tracks AI generation history)
CREATE TABLE IF NOT EXISTS vocab_generation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    topic TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    generated_words JSONB NOT NULL,
    session_results JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user session queries
CREATE INDEX IF NOT EXISTS idx_vocab_sessions_user
ON vocab_generation_sessions(user_id, created_at DESC);

-- Enable RLS for user_vocabulary
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vocabulary"
ON user_vocabulary FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary"
ON user_vocabulary FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary"
ON user_vocabulary FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary"
ON user_vocabulary FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS for vocab_generation_sessions
ALTER TABLE vocab_generation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON vocab_generation_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON vocab_generation_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON vocab_generation_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
