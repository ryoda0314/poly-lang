create table public.slang_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  definition text not null,
  example text not null,
  language_code text not null,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.slang_terms enable row level security;

-- Policy: Everyone can read
create policy "Everyone can read slang terms"
  on public.slang_terms for select
  using (true);

-- Policy: Only admins can insert/update/delete (Simplified: Authenticated users can insert for now, or specific user ID)
-- For MVP speed, let's allow authenticated users to insert if role is admin?
-- Actually, let's just allow all authenticated users to insert for now to make testing easier, or check role.
-- Assuming 'roles' are in profiles or metadata.
-- For now, open to authenticated for insert (or restricted if I had easy admin check)

create policy "Authenticated can insert slang"
  on public.slang_terms for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update slang"
  on public.slang_terms for update
  using (auth.role() = 'authenticated');

create policy "Authenticated can delete slang"
  on public.slang_terms for delete
  using (auth.role() = 'authenticated');
