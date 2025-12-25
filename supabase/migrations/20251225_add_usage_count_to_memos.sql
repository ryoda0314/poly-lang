-- Add usage_count column to awareness_memos
ALTER TABLE awareness_memos 
ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN awareness_memos.usage_count IS 'The number of times this memo token has appeared in user corrections';
