-- Add type column to slang_terms
alter table public.slang_terms 
add column type text check (type in ('word', 'phrase')) default 'word';
