-- Create daily_usage table if not exists (with all columns including new ones)
CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date default current_date not null,
  audio_count integer default 0,
  explorer_count integer default 0,
  correction_count integer default 0,
  extraction_count integer default 0,
  explanation_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable RLS if not already enabled
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Create policy if not exists (use DO block for conditional creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_usage' AND policyname = 'Users can view their own usage'
  ) THEN
    CREATE POLICY "Users can view their own usage"
      ON daily_usage FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add extraction_count and explanation_count columns if they don't exist
ALTER TABLE daily_usage
ADD COLUMN IF NOT EXISTS extraction_count integer DEFAULT 0;

ALTER TABLE daily_usage
ADD COLUMN IF NOT EXISTS explanation_count integer DEFAULT 0;

-- Add subscription_plan column to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free';
