-- Split credit types: add separate credits for chat, expression, vocab, grammar, extension

-- profiles: add new credit columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expression_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vocab_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grammar_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extension_credits integer DEFAULT 0 NOT NULL;

-- daily_usage: add new count columns
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS chat_count integer DEFAULT 0 NOT NULL;
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS expression_count integer DEFAULT 0 NOT NULL;
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS vocab_count integer DEFAULT 0 NOT NULL;
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS grammar_count integer DEFAULT 0 NOT NULL;
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS extension_count integer DEFAULT 0 NOT NULL;
