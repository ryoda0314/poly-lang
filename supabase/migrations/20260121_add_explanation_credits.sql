-- Add explanation_credits column to profiles table
alter table profiles 
add column explanation_credits integer default 5 not null;
