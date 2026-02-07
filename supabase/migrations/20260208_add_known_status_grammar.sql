-- Add 'known' status to grammar_patterns for tracking patterns user already knows
ALTER TABLE grammar_patterns DROP CONSTRAINT IF EXISTS grammar_patterns_status_check;
ALTER TABLE grammar_patterns ADD CONSTRAINT grammar_patterns_status_check
    CHECK (status IN ('to_learn', 'learning', 'mastered', 'known'));
