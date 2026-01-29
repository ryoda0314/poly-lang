-- ============================================================
-- Login-based streak system
-- ============================================================

-- Table: user_login_days
-- One row per user per calendar day they visit the app.
create table if not exists user_login_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  login_date date not null,
  created_at timestamptz default now(),
  unique(user_id, login_date)
);

create index if not exists idx_user_login_days_user_date
  on user_login_days(user_id, login_date);

alter table user_login_days enable row level security;

create policy "Users can view own login days"
  on user_login_days for select
  using (auth.uid() = user_id);

create policy "Users can insert own login days"
  on user_login_days for insert
  with check (auth.uid() = user_id);

create policy "Users can update own login days"
  on user_login_days for update
  using (auth.uid() = user_id);

-- Table: user_streaks
-- One row per user, caching computed streak values.
create table if not exists user_streaks (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_active_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_streaks enable row level security;

create policy "Users can view own streaks"
  on user_streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on user_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on user_streaks for update
  using (auth.uid() = user_id);

-- Backfill: populate user_login_days from existing learning_events
insert into user_login_days (user_id, login_date)
select distinct user_id, occurred_at::date as login_date
from learning_events
on conflict (user_id, login_date) do nothing;

-- Backfill: initialize user_streaks for existing users
-- Sets current_streak=1; the check-in API will correct it on next visit.
insert into user_streaks (user_id, current_streak, longest_streak, last_active_date)
select
    user_id,
    1 as current_streak,
    1 as longest_streak,
    max(login_date) as last_active_date
from user_login_days
group by user_id
on conflict (user_id) do nothing;
