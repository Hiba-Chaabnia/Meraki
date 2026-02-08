-- Backend job tracking table (accessed via service-role key, no RLS)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  job_type text not null,
  status text not null default 'pending',
  request_data jsonb not null default '{}',
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_jobs_created_at on jobs(created_at desc);

-- No RLS — backend uses service-role key
