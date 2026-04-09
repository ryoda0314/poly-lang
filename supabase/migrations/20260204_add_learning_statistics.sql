-- Migration: Add learning statistics for swipe deck
-- Tracks individual item learning progress and study sessions

-- ============================================
-- 1. Phrase Set Item Reviews Table
-- Tracks learning progress for each item in a phrase set
-- ============================================
CREATE TABLE IF NOT EXISTS phrase_set_item_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_set_item_id UUID NOT NULL REFERENCES phrase_set_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- SRS State
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'reviewing', 'mastered')),
    strength SMALLINT NOT NULL DEFAULT 0 CHECK (strength >= 0 AND strength <= 5),
    ease_factor REAL NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
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

    -- Ensure one review record per item per user
    UNIQUE(phrase_set_item_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_phrase_set_item_reviews_user_status
    ON phrase_set_item_reviews(user_id, status);
CREATE INDEX idx_phrase_set_item_reviews_user_next_review
    ON phrase_set_item_reviews(user_id, next_review_at)
    WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_phrase_set_item_reviews_item
    ON phrase_set_item_reviews(phrase_set_item_id);

-- RLS Policies
ALTER TABLE phrase_set_item_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
    ON phrase_set_item_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
    ON phrase_set_item_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON phrase_set_item_reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON phrase_set_item_reviews FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================
-- 2. Study Sessions Table
-- Tracks individual study sessions
-- ============================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phrase_set_id UUID REFERENCES phrase_sets(id) ON DELETE SET NULL,
    language_code TEXT NOT NULL,

    -- Session metrics
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Review statistics
    items_reviewed INTEGER NOT NULL DEFAULT 0,
    items_correct INTEGER NOT NULL DEFAULT 0,
    items_incorrect INTEGER NOT NULL DEFAULT 0,
    new_items_learned INTEGER NOT NULL DEFAULT 0,
    items_mastered INTEGER NOT NULL DEFAULT 0,

    -- Accuracy
    accuracy_percentage REAL GENERATED ALWAYS AS (
        CASE WHEN items_reviewed > 0
        THEN (items_correct::REAL / items_reviewed::REAL * 100)
        ELSE 0 END
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_study_sessions_user
    ON study_sessions(user_id, started_at DESC);
CREATE INDEX idx_study_sessions_user_language
    ON study_sessions(user_id, language_code);
CREATE INDEX idx_study_sessions_phrase_set
    ON study_sessions(phrase_set_id)
    WHERE phrase_set_id IS NOT NULL;

-- RLS Policies
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON study_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON study_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON study_sessions FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================
-- 3. Phrase Set Progress (Aggregated View)
-- Cached progress data per phrase set
-- ============================================
CREATE TABLE IF NOT EXISTS phrase_set_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_set_id UUID NOT NULL REFERENCES phrase_sets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Item counts by status
    new_count INTEGER NOT NULL DEFAULT 0,
    learning_count INTEGER NOT NULL DEFAULT 0,
    reviewing_count INTEGER NOT NULL DEFAULT 0,
    mastered_count INTEGER NOT NULL DEFAULT 0,

    -- Aggregated stats
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    avg_strength REAL NOT NULL DEFAULT 0,

    -- Due for review
    due_count INTEGER NOT NULL DEFAULT 0,

    -- Session tracking
    total_study_time_seconds INTEGER NOT NULL DEFAULT 0,
    session_count INTEGER NOT NULL DEFAULT 0,
    last_studied_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(phrase_set_id, user_id)
);

-- Indexes
CREATE INDEX idx_phrase_set_progress_user
    ON phrase_set_progress(user_id);
CREATE INDEX idx_phrase_set_progress_set
    ON phrase_set_progress(phrase_set_id);

-- RLS Policies
ALTER TABLE phrase_set_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
    ON phrase_set_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON phrase_set_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON phrase_set_progress FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================
-- 4. User Language Statistics (Aggregated)
-- Overall stats per user per language
-- ============================================
CREATE TABLE IF NOT EXISTS user_learning_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,

    -- Item counts
    total_items INTEGER NOT NULL DEFAULT 0,
    mastered_items INTEGER NOT NULL DEFAULT 0,
    learning_items INTEGER NOT NULL DEFAULT 0,

    -- Review stats
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,

    -- Time tracking
    total_study_time_seconds INTEGER NOT NULL DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 0,

    -- Dates
    last_study_date DATE,
    streak_start_date DATE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, language_code)
);

-- Indexes
CREATE INDEX idx_user_learning_stats_user
    ON user_learning_stats(user_id);

-- RLS Policies
ALTER TABLE user_learning_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
    ON user_learning_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
    ON user_learning_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_learning_stats FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================
-- 5. Trigger to update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phrase_set_item_reviews_updated_at
    BEFORE UPDATE ON phrase_set_item_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phrase_set_progress_updated_at
    BEFORE UPDATE ON phrase_set_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_stats_updated_at
    BEFORE UPDATE ON user_learning_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
