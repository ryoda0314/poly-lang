-- Add coins column to profiles table
alter table profiles add column coins integer default 0;

-- Optional: Seed existing users with initial coins
update profiles set coins = 100 where coins is null;
