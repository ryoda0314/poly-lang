-- Add user_id column to long_texts for user-owned texts
ALTER TABLE long_texts ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for user's texts
CREATE INDEX idx_long_texts_user ON long_texts(user_id, language_code);

-- Update RLS policies to allow users to manage their own texts

-- Drop existing select policy
DROP POLICY IF EXISTS "Anyone can read published long texts" ON long_texts;

-- Users can read published texts OR their own texts
CREATE POLICY "Users can read published or own long texts"
    ON long_texts FOR SELECT
    USING (is_published = TRUE OR user_id = auth.uid());

-- Users can create their own texts
CREATE POLICY "Users can create own long texts"
    ON long_texts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own texts
CREATE POLICY "Users can update own long texts"
    ON long_texts FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own texts
CREATE POLICY "Users can delete own long texts"
    ON long_texts FOR DELETE
    USING (auth.uid() = user_id);

-- Update sentences policy to include user-owned texts
DROP POLICY IF EXISTS "Anyone can read sentences of published texts" ON long_text_sentences;

CREATE POLICY "Users can read sentences of accessible texts"
    ON long_text_sentences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND (long_texts.is_published = TRUE OR long_texts.user_id = auth.uid())
        )
    );

-- Users can insert sentences for their own texts
CREATE POLICY "Users can insert sentences for own texts"
    ON long_text_sentences FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND long_texts.user_id = auth.uid()
        )
    );

-- Users can update sentences for their own texts
CREATE POLICY "Users can update sentences for own texts"
    ON long_text_sentences FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND long_texts.user_id = auth.uid()
        )
    );

-- Users can delete sentences for their own texts
CREATE POLICY "Users can delete sentences for own texts"
    ON long_text_sentences FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND long_texts.user_id = auth.uid()
        )
    );
