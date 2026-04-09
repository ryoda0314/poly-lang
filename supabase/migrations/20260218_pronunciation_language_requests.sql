-- pronunciation_language_requests: Users can request pronunciation support for a language
create table if not exists pronunciation_language_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    language_code text not null,
    language_name text not null,
    message text,
    created_at timestamptz not null default now(),
    -- One request per user per language
    unique (user_id, language_code)
);

alter table pronunciation_language_requests enable row level security;

create policy "Users can insert their own requests"
    on pronunciation_language_requests for insert
    with check (auth.uid() = user_id);

create policy "Users can view their own requests"
    on pronunciation_language_requests for select
    using (auth.uid() = user_id);