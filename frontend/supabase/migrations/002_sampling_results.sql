-- Cache sampling preview crew output per user+hobby
create table if not exists sampling_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hobby_slug text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  constraint sampling_results_user_hobby unique (user_id, hobby_slug)
);

-- Cache local experiences crew output per user+hobby+location
create table if not exists local_experience_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hobby_slug text not null,
  location text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  constraint local_experience_results_user_hobby_location unique (user_id, hobby_slug, location)
);

-- RLS for sampling_results
alter table sampling_results enable row level security;

create policy "Users can read own sampling results"
  on sampling_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own sampling results"
  on sampling_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sampling results"
  on sampling_results for update
  using (auth.uid() = user_id);

-- RLS for local_experience_results
alter table local_experience_results enable row level security;

create policy "Users can read own local experience results"
  on local_experience_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own local experience results"
  on local_experience_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own local experience results"
  on local_experience_results for update
  using (auth.uid() = user_id);
