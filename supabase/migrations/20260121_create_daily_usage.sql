-- Create daily_usage table to track resource usage
create table daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date default current_date not null,
  audio_count integer default 0,
  explorer_count integer default 0,
  correction_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- RLS policies
alter table daily_usage enable row level security;

create policy "Users can view their own usage"
  on daily_usage for select
  using (auth.uid() = user_id);

-- Only server (service role) should update this tailored to specific logic, 
-- but we might allow inserts if using RLS for everything. 
-- However, we will likely use Service Role in Actions/API to increment freely 
-- without worrying about public update policies for now, 
-- or we can create a specific function.
-- For now, let's keep it simple and assume Service Role will be used for increments.
