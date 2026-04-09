-- Add credit columns to profiles table
alter table profiles 
add column audio_credits integer default 50 not null,
add column explorer_credits integer default 20 not null,
add column correction_credits integer default 5 not null;
