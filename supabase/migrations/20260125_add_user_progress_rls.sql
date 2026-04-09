-- Add RLS policies for user_progress table
-- This table tracks user XP and level progression per language

-- Enable RLS (if not already enabled)
alter table user_progress enable row level security;

-- Policy for users to view their own progress
create policy "Users can view own progress"
on user_progress for select
using (auth.uid() = user_id);

-- Policy for users to insert their own progress
create policy "Users can insert own progress"
on user_progress for insert
with check (auth.uid() = user_id);

-- Policy for users to update their own progress
create policy "Users can update own progress"
on user_progress for update
using (auth.uid() = user_id);
