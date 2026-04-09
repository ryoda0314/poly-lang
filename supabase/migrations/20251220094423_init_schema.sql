-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  gender text,
  native_language text,
  learning_language text,
  created_at timestamptz default now()
);

-- Awareness Memos table
create table awareness_memos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  phrase_id text not null,
  token_index integer not null,
  confidence text check (confidence in ('high', 'medium', 'low')),
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, phrase_id, token_index)
);

-- RLS Policies
alter table profiles enable row level security;
alter table awareness_memos enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own memos" on awareness_memos for select using (auth.uid() = user_id);
create policy "Users can insert/update own memos" on awareness_memos for all using (auth.uid() = user_id);
