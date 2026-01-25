-- Create phrase_sets table for custom phrase collections
CREATE TABLE phrase_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    language_code VARCHAR(10) NOT NULL,
    phrase_count INTEGER DEFAULT 0,
    color VARCHAR(20),
    icon VARCHAR(50),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name, language_code)
);

-- Create index for efficient querying
CREATE INDEX idx_phrase_sets_user_lang ON phrase_sets(user_id, language_code);

-- Create phrase_set_items table for phrases within sets
CREATE TABLE phrase_set_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_set_id UUID NOT NULL REFERENCES phrase_sets(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    target_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    tokens TEXT[],
    category_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_phrase_set_items_set ON phrase_set_items(phrase_set_id);

-- Enable RLS
ALTER TABLE phrase_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_set_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phrase_sets
CREATE POLICY "Users can view their own phrase sets"
    ON phrase_sets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own phrase sets"
    ON phrase_sets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phrase sets"
    ON phrase_sets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phrase sets"
    ON phrase_sets FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for phrase_set_items
CREATE POLICY "Users can view items in their phrase sets"
    ON phrase_set_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM phrase_sets
            WHERE phrase_sets.id = phrase_set_items.phrase_set_id
            AND phrase_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create items in their phrase sets"
    ON phrase_set_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM phrase_sets
            WHERE phrase_sets.id = phrase_set_items.phrase_set_id
            AND phrase_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their phrase sets"
    ON phrase_set_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM phrase_sets
            WHERE phrase_sets.id = phrase_set_items.phrase_set_id
            AND phrase_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items in their phrase sets"
    ON phrase_set_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM phrase_sets
            WHERE phrase_sets.id = phrase_set_items.phrase_set_id
            AND phrase_sets.user_id = auth.uid()
        )
    );

-- Function to update phrase_count when items change
CREATE OR REPLACE FUNCTION update_phrase_set_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE phrase_sets
        SET phrase_count = phrase_count + 1,
            updated_at = NOW()
        WHERE id = NEW.phrase_set_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE phrase_sets
        SET phrase_count = phrase_count - 1,
            updated_at = NOW()
        WHERE id = OLD.phrase_set_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update phrase_count
CREATE TRIGGER trigger_update_phrase_set_count
AFTER INSERT OR DELETE ON phrase_set_items
FOR EACH ROW EXECUTE FUNCTION update_phrase_set_count();
