-- Phrase Collections table for organizing saved phrases
create table phrase_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text,
  icon text,
  language_code text not null,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name, language_code)
);

-- Add collection_id to learning_events for phrase organization
alter table learning_events add column collection_id uuid references phrase_collections(id) on delete set null;

-- RLS Policies for phrase_collections
alter table phrase_collections enable row level security;

create policy "Users can view own collections" on phrase_collections for select using (auth.uid() = user_id);
create policy "Users can manage own collections" on phrase_collections for all using (auth.uid() = user_id);

-- Index for performance
create index idx_learning_events_collection on learning_events(collection_id);
create index idx_phrase_collections_user_lang on phrase_collections(user_id, language_code);
