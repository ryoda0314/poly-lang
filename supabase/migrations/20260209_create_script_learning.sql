-- ============================================
-- Character Progress Table
-- Tracks per-character learning progress for each user
-- ============================================
CREATE TABLE IF NOT EXISTS character_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_set_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    language_code TEXT NOT NULL,

    -- SRS State
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'learning', 'reviewing', 'mastered')),
    strength SMALLINT NOT NULL DEFAULT 0
        CHECK (strength >= 0 AND strength <= 5),
    ease_factor REAL NOT NULL DEFAULT 2.5
        CHECK (ease_factor >= 1.3),
    interval_days INTEGER NOT NULL DEFAULT 0,

    -- Review scheduling
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,

    -- Statistics
    review_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, character_id)
);

-- Indexes
CREATE INDEX idx_char_progress_user_script
    ON character_progress(user_id, script_set_id);
CREATE INDEX idx_char_progress_user_lang
    ON character_progress(user_id, language_code);
CREATE INDEX idx_char_progress_next_review
    ON character_progress(user_id, next_review_at)
    WHERE next_review_at IS NOT NULL;

-- RLS
ALTER TABLE character_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own character progress"
    ON character_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own character progress"
    ON character_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own character progress"
    ON character_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own character progress"
    ON character_progress FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_character_progress_updated_at
    BEFORE UPDATE ON character_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Script Practice Sessions Table
-- Tracks AI-generated practice sessions
-- ============================================
CREATE TABLE IF NOT EXISTS script_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_set_id TEXT NOT NULL,
    language_code TEXT NOT NULL,

    practice_type TEXT NOT NULL
        CHECK (practice_type IN ('recognition', 'writing', 'reading', 'mixed')),
    character_count INTEGER NOT NULL,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,

    generated_exercises JSONB,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_script_sessions_user
    ON script_practice_sessions(user_id, created_at DESC);

ALTER TABLE script_practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own script sessions"
    ON script_practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own script sessions"
    ON script_practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own script sessions"
    ON script_practice_sessions FOR UPDATE USING (auth.uid() = user_id);
