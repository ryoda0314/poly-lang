-- Add example_translation column to grammar_patterns
-- Separates the example sentence's translation from the pattern explanation
ALTER TABLE grammar_patterns
ADD COLUMN IF NOT EXISTS example_translation TEXT DEFAULT '';
