-- Announcements: System-wide notifications for users
-- Admins can create and manage announcements visible on the dashboard

create table announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  type text not null default 'info'
    check (type in ('info', 'warning', 'success', 'update')),
  is_active boolean default true,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table announcements enable row level security;

-- Allow all authenticated users to read active announcements
create policy "Users can read active announcements" on announcements
  for select using (
    is_active = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
    and auth.uid() is not null
  );

-- Admins can manage all announcements
create policy "Admins can manage announcements" on announcements
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Indexes
create index idx_announcements_active on announcements(is_active, starts_at, ends_at);
create index idx_announcements_created on announcements(created_at desc);

-- User read status to track which announcements a user has seen/dismissed
create table announcement_reads (
  id uuid default gen_random_uuid() primary key,
  announcement_id uuid not null references announcements(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz default now(),
  dismissed boolean default false,
  unique(announcement_id, user_id)
);

-- RLS
alter table announcement_reads enable row level security;

create policy "Users can manage own read status" on announcement_reads
  for all using (auth.uid() = user_id);

-- Indexes
create index idx_announcement_reads_user on announcement_reads(user_id);
create index idx_announcement_reads_lookup on announcement_reads(announcement_id, user_id);
