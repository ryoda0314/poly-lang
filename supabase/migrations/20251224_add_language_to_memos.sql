-- Add language_code column to awareness_memos
-- For existing rows, we default to 'en' (or nullable) to avoid breakage, but user wants strict separation.
-- Let's set default 'en' for now, as most dev data is likely English or we don't care about old data clashing too much.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'awareness_memos' AND column_name = 'language_code') THEN
        ALTER TABLE awareness_memos ADD COLUMN language_code text NOT NULL DEFAULT 'en';
    END IF;
END $$;
