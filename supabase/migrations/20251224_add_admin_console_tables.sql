-- 1. Add role to profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- 2. Create is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Tables

-- Levels
CREATE TABLE IF NOT EXISTS levels (
    level int PRIMARY KEY,
    xp_threshold int NOT NULL,
    title text NOT NULL,
    next_unlock_label text NOT NULL
);

-- Daily Quest Templates
CREATE TABLE IF NOT EXISTS daily_quest_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code text, -- NULL means common for all languages
    level_min int,
    level_max int,
    quest_key text NOT NULL UNIQUE,
    title text NOT NULL,
    event_type text NOT NULL,
    required_count int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_key text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL,
    icon text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Learning Events (Re-declaring to ensure it exists, though usually it might be there)
-- If it exists from previous attempts, we just ensure it has correct columns or ignore.
-- For safety in this prompt context, we create if not exists.
CREATE TABLE IF NOT EXISTS learning_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code text NOT NULL,
    event_type text NOT NULL, -- 'phrase_viewed', 'correction_submit', etc.
    xp_delta int NOT NULL DEFAULT 0,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

-- Levels Policies
CREATE POLICY "Levels are viewable by everyone" ON levels FOR SELECT USING (true);
CREATE POLICY "Levels are editable by admins only" ON levels FOR ALL USING (is_admin());

-- Daily Quest Templates Policies
CREATE POLICY "Quest templates are viewable by everyone" ON daily_quest_templates FOR SELECT USING (true);
CREATE POLICY "Quest templates are editable by admins only" ON daily_quest_templates FOR ALL USING (is_admin());

-- Badges Policies
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "Badges are editable by admins only" ON badges FOR ALL USING (is_admin());

-- Learning Events Policies
-- Users can see their own events
CREATE POLICY "Users can view their own events" ON learning_events FOR SELECT USING (auth.uid() = user_id);
-- Admins can view ALL events (admin bypass, using is_admin function)
CREATE POLICY "Admins can view all events" ON learning_events FOR SELECT USING (is_admin());

-- Users can insert their own events (usually via API/Server Action with auth)
CREATE POLICY "Users can insert their own events" ON learning_events FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins can insert/update/delete events (for tools/maintenance)
CREATE POLICY "Admins can manage all events" ON learning_events FOR ALL USING (is_admin());
