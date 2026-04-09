-- Add extraction_credits column to profiles table for AI image analysis feature
alter table profiles
add column extraction_credits integer default 10 not null;
