-- Add target_audience column to announcements
-- Allows targeting specific user groups: all, new_users, existing_users

alter table announcements add column target_audience text not null default 'all'
  check (target_audience in ('all', 'new_users', 'existing_users'));

-- Add new_user_days column to define how many days a user is considered "new"
-- Default is 7 days after registration
alter table announcements add column new_user_days integer default 7;

-- Index for filtering by target audience
create index idx_announcements_target on announcements(target_audience);

comment on column announcements.target_audience is 'Target audience: all=everyone, new_users=recently registered, existing_users=registered before threshold';
comment on column announcements.new_user_days is 'Number of days a user is considered new (used when target_audience is new_users or existing_users)';