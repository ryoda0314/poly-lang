-- Combined Migration for Fresh Database
-- Generated based on existing migrations up to 2025-12-21

-- ==========================================
-- 1. Profiles Table
-- ==========================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  gender text,
  native_language text,
  learning_language text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);


-- ==========================================
-- 2. Awareness Memos Table
-- ==========================================
create table if not exists awareness_memos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  phrase_id text not null,
  token_index integer not null,
  confidence text check (confidence in ('high', 'medium', 'low')),
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table awareness_memos enable row level security;

-- Policies for awareness_memos (Final versions)
CREATE POLICY "Users can view own memos" ON awareness_memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON awareness_memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON awareness_memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON awareness_memos FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 3. Pronunciation Runs Table
-- ==========================================
CREATE TABLE IF NOT EXISTS pronunciation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phrase_id TEXT NOT NULL,
  expected_text TEXT NOT NULL,
  asr_text TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  diffs JSONB NOT NULL DEFAULT '[]',
  feedback TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_user_phrase ON pronunciation_runs(user_id, phrase_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_runs_created_at ON pronunciation_runs(created_at DESC);

ALTER TABLE pronunciation_runs ENABLE ROW LEVEL SECURITY;

-- Policies for pronunciation_runs
CREATE POLICY "Users can insert their own runs" ON pronunciation_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own runs" ON pronunciation_runs
  FOR SELECT
  USING (auth.uid() = user_id);


-- ==========================================
-- 4. Triggers and Functions
-- ==========================================
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 5. Seed Data
-- ==========================================
-- [WARNING] The following insert fails if the user does not exist in auth.users.
-- Please create the user with this ID manually in the Auth dashboard, or update this ID to match an existing user.
-- INSERT INTO profiles (id, username, gender, learning_language, native_language, settings)
-- VALUES ('423128d1-ede3-4e44-af4e-1f456662719b', 'ryoda', 'unspecified', 'en', 'ja', '{}'::jsonb)
-- ON CONFLICT (id) DO UPDATE SET 
--   settings = COALESCE(profiles.settings, '{}'::jsonb);
