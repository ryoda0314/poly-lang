-- Add target_language column to etymology_entries
ALTER TABLE etymology_entries ADD COLUMN IF NOT EXISTS target_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE etymology_entries DROP CONSTRAINT IF EXISTS etymology_entries_word_key;
ALTER TABLE etymology_entries ADD CONSTRAINT etymology_entries_word_lang_key UNIQUE(word, target_language);
DROP INDEX IF EXISTS idx_etymology_entries_word;
CREATE INDEX idx_etymology_entries_word_lang ON etymology_entries(word, target_language);

-- Add target_language to etymology_derivations
ALTER TABLE etymology_derivations ADD COLUMN IF NOT EXISTS target_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE etymology_derivations DROP CONSTRAINT IF EXISTS unique_etymology_derivation;
ALTER TABLE etymology_derivations ADD CONSTRAINT unique_etymology_derivation UNIQUE(parent_word, child_word, target_language);

-- Add target_language to etymology_search_history
ALTER TABLE etymology_search_history ADD COLUMN IF NOT EXISTS target_language TEXT NOT NULL DEFAULT 'en';
DROP INDEX IF EXISTS idx_etymology_search_history_user;
CREATE INDEX idx_etymology_search_history_user_lang ON etymology_search_history(user_id, target_language, searched_at DESC);
