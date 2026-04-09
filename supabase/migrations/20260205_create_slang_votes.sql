-- Add vote count columns to slang_terms
ALTER TABLE slang_terms ADD COLUMN IF NOT EXISTS vote_count_up INTEGER DEFAULT 0;
ALTER TABLE slang_terms ADD COLUMN IF NOT EXISTS vote_count_down INTEGER DEFAULT 0;

-- Create slang_votes table
CREATE TABLE IF NOT EXISTS slang_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slang_term_id UUID REFERENCES slang_terms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slang_term_id, user_id)
);

-- Enable RLS
ALTER TABLE slang_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all votes" ON slang_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON slang_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON slang_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON slang_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update vote counts on slang_terms
CREATE OR REPLACE FUNCTION update_slang_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = true THEN
      UPDATE slang_terms SET vote_count_up = vote_count_up + 1 WHERE id = NEW.slang_term_id;
    ELSE
      UPDATE slang_terms SET vote_count_down = vote_count_down + 1 WHERE id = NEW.slang_term_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote = true AND NEW.vote = false THEN
      UPDATE slang_terms SET vote_count_up = vote_count_up - 1, vote_count_down = vote_count_down + 1 WHERE id = NEW.slang_term_id;
    ELSIF OLD.vote = false AND NEW.vote = true THEN
      UPDATE slang_terms SET vote_count_up = vote_count_up + 1, vote_count_down = vote_count_down - 1 WHERE id = NEW.slang_term_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = true THEN
      UPDATE slang_terms SET vote_count_up = vote_count_up - 1 WHERE id = OLD.slang_term_id;
    ELSE
      UPDATE slang_terms SET vote_count_down = vote_count_down - 1 WHERE id = OLD.slang_term_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update vote counts
CREATE TRIGGER slang_vote_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON slang_votes
FOR EACH ROW EXECUTE FUNCTION update_slang_vote_counts();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_slang_votes_user_id ON slang_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_slang_votes_slang_term_id ON slang_votes(slang_term_id);
