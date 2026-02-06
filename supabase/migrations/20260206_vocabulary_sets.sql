-- Vocabulary Sets (単語集)
CREATE TABLE IF NOT EXISTS vocabulary_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    description TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_set_name UNIQUE(user_id, language_code, name)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_user_lang
ON vocabulary_sets(user_id, language_code);

-- Add set_id to user_vocabulary
ALTER TABLE user_vocabulary
ADD COLUMN IF NOT EXISTS set_id UUID REFERENCES vocabulary_sets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_vocabulary_set
ON user_vocabulary(set_id);

-- Enable RLS for vocabulary_sets
ALTER TABLE vocabulary_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sets"
ON vocabulary_sets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sets"
ON vocabulary_sets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sets"
ON vocabulary_sets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sets"
ON vocabulary_sets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to update word_count
CREATE OR REPLACE FUNCTION update_set_word_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.set_id IS NOT NULL THEN
        UPDATE vocabulary_sets
        SET word_count = word_count + 1, updated_at = NOW()
        WHERE id = NEW.set_id;
    ELSIF TG_OP = 'DELETE' AND OLD.set_id IS NOT NULL THEN
        UPDATE vocabulary_sets
        SET word_count = GREATEST(0, word_count - 1), updated_at = NOW()
        WHERE id = OLD.set_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.set_id IS DISTINCT FROM NEW.set_id THEN
            IF OLD.set_id IS NOT NULL THEN
                UPDATE vocabulary_sets
                SET word_count = GREATEST(0, word_count - 1), updated_at = NOW()
                WHERE id = OLD.set_id;
            END IF;
            IF NEW.set_id IS NOT NULL THEN
                UPDATE vocabulary_sets
                SET word_count = word_count + 1, updated_at = NOW()
                WHERE id = NEW.set_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update word_count
DROP TRIGGER IF EXISTS trigger_update_set_word_count ON user_vocabulary;
CREATE TRIGGER trigger_update_set_word_count
AFTER INSERT OR UPDATE OR DELETE ON user_vocabulary
FOR EACH ROW
EXECUTE FUNCTION update_set_word_count();
