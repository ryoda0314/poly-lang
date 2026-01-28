-- Distribution Events v2: Claim-based + Recurring + Bundle Rewards
-- Users must log in and click "受け取る" to claim rewards.

-- Drop v1 objects if they exist
drop function if exists execute_distribution(uuid, text, integer);
drop index if exists idx_distribution_events_pending_scheduled;
drop index if exists idx_distribution_events_scheduled;
drop index if exists idx_distribution_events_status;
drop policy if exists "Admins can manage distribution events" on distribution_events;
drop table if exists distribution_claims;
drop table if exists distribution_events;

-- ============================================================
-- distribution_events
-- ============================================================
create table distribution_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  rewards jsonb not null,               -- [{type:"coins",amount:100},{type:"audio_credits",amount:50}]
  recurrence text not null default 'once'
    check (recurrence in ('once', 'daily', 'weekly', 'monthly')),
  scheduled_at timestamptz not null,    -- when it first becomes available
  expires_at timestamptz,               -- optional expiry (null = no expiry for one-time, or runs forever for recurring)
  status text not null default 'draft'
    check (status in ('draft', 'active', 'expired', 'cancelled')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  claim_count integer default 0
);

-- RLS
alter table distribution_events enable row level security;

create policy "Admins can manage distribution events" on distribution_events
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Allow all authenticated users to read active events
create policy "Users can read active distribution events" on distribution_events
  for select using (
    status = 'active' and auth.uid() is not null
  );

-- Indexes
create index idx_distribution_events_status on distribution_events(status);
create index idx_distribution_events_scheduled on distribution_events(scheduled_at);
create index idx_distribution_events_active_scheduled
  on distribution_events(status, scheduled_at)
  where status = 'active';

-- ============================================================
-- distribution_claims
-- ============================================================
create table distribution_claims (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references distribution_events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  period_key text not null,             -- 'once' for one-time, '2026-01-28' for daily, '2026-W04' for weekly, '2026-01' for monthly
  rewards_granted jsonb,                -- snapshot of what was granted
  claimed_at timestamptz default now(),
  unique(event_id, user_id, period_key)
);

-- RLS
alter table distribution_claims enable row level security;

create policy "Users can read own claims" on distribution_claims
  for select using (auth.uid() = user_id);

create policy "Admins can read all claims" on distribution_claims
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Indexes
create index idx_distribution_claims_event on distribution_claims(event_id);
create index idx_distribution_claims_user on distribution_claims(user_id);
create index idx_distribution_claims_lookup on distribution_claims(event_id, user_id, period_key);

-- ============================================================
-- claim_distribution RPC
-- ============================================================
create or replace function claim_distribution(
  p_event_id uuid,
  p_user_id uuid
)
returns jsonb as $$
declare
  v_event record;
  v_period_key text;
  v_reward record;
  v_rewards jsonb;
  v_col text;
  v_amt integer;
  v_valid_columns text[] := array['coins', 'audio_credits', 'explorer_credits',
                                   'correction_credits', 'explanation_credits', 'extraction_credits'];
begin
  -- Lock the event row (shared lock) and fetch
  select * into v_event
  from distribution_events
  where id = p_event_id
  for share;

  if v_event is null then
    raise exception 'Event not found';
  end if;

  if v_event.status != 'active' then
    raise exception 'Event is not active (status: %)', v_event.status;
  end if;

  -- Check expiry
  if v_event.expires_at is not null and v_event.expires_at <= now() then
    raise exception 'Event has expired';
  end if;

  -- Compute period_key based on recurrence
  case v_event.recurrence
    when 'once' then
      v_period_key := 'once';
    when 'daily' then
      v_period_key := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
    when 'weekly' then
      v_period_key := to_char(now() at time zone 'UTC', 'IYYY-"W"IW');
    when 'monthly' then
      v_period_key := to_char(now() at time zone 'UTC', 'YYYY-MM');
    else
      raise exception 'Unknown recurrence: %', v_event.recurrence;
  end case;

  -- Check if already claimed for this period (unique constraint will also catch this,
  -- but we raise a friendlier error)
  if exists (
    select 1 from distribution_claims
    where event_id = p_event_id
      and user_id = p_user_id
      and period_key = v_period_key
  ) then
    raise exception 'Already claimed for this period';
  end if;

  v_rewards := v_event.rewards;

  -- Grant each reward
  for v_reward in select * from jsonb_array_elements(v_rewards) as r
  loop
    v_col := v_reward.r ->> 'type';
    v_amt := (v_reward.r ->> 'amount')::integer;

    -- Validate column name (allowlist to prevent SQL injection)
    if not (v_col = any(v_valid_columns)) then
      raise exception 'Invalid reward type: %', v_col;
    end if;

    if v_amt is null or v_amt <= 0 then
      raise exception 'Invalid reward amount for %: %', v_col, v_amt;
    end if;

    -- Increment the user's profile column
    execute format(
      'update profiles set %I = coalesce(%I, 0) + $1 where id = $2',
      v_col, v_col
    ) using v_amt, p_user_id;
  end loop;

  -- Insert claim record
  insert into distribution_claims (event_id, user_id, period_key, rewards_granted)
  values (p_event_id, p_user_id, v_period_key, v_rewards);

  -- Increment claim_count on the event
  update distribution_events
  set claim_count = claim_count + 1
  where id = p_event_id;

  return v_rewards;
end;
$$ language plpgsql security definer;
