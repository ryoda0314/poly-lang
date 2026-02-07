-- Add compound_tree column for part merge visualization
ALTER TABLE etymology_entries ADD COLUMN IF NOT EXISTS compound_tree JSONB;
