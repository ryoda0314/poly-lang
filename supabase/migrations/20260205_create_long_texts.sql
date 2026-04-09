-- Long Text Exploration Tables

-- Main table for long texts
CREATE TABLE long_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    title_translation VARCHAR(200),
    language_code VARCHAR(10) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100),
    full_text TEXT NOT NULL,
    sentence_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentences extracted from long texts
CREATE TABLE long_text_sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    long_text_id UUID NOT NULL REFERENCES long_texts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation TEXT,
    tokens TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(long_text_id, position)
);

-- User progress tracking
CREATE TABLE user_long_text_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    long_text_id UUID NOT NULL REFERENCES long_texts(id) ON DELETE CASCADE,
    current_sentence INTEGER DEFAULT 0,
    completed_sentences INTEGER[] DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, long_text_id)
);

-- Indexes
CREATE INDEX idx_long_texts_language ON long_texts(language_code, is_published);
CREATE INDEX idx_long_text_sentences_text_id ON long_text_sentences(long_text_id, position);
CREATE INDEX idx_user_long_text_progress_user ON user_long_text_progress(user_id);

-- RLS Policies
ALTER TABLE long_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_text_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_long_text_progress ENABLE ROW LEVEL SECURITY;

-- Long texts: Anyone can read published texts
CREATE POLICY "Anyone can read published long texts"
    ON long_texts FOR SELECT
    USING (is_published = TRUE);

-- Long text sentences: Anyone can read sentences of published texts
CREATE POLICY "Anyone can read sentences of published texts"
    ON long_text_sentences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND long_texts.is_published = TRUE
        )
    );

-- User progress: Users can manage their own progress
CREATE POLICY "Users can read own progress"
    ON user_long_text_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON user_long_text_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_long_text_progress FOR UPDATE
    USING (auth.uid() = user_id);
