-- ═══════════════════════════════════════════════════════════
-- Meraki — Complete Database Schema
-- Single consolidated migration. Safe to run on a fresh database.
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default '',
  avatar_url     text,
  bio            text not null default '',
  location       text not null default '',
  public_profile boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────
-- 2. USER_HOBBIES
-- ─────────────────────────────────────────────────────────
create table public.user_hobbies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  hobby_slug  text not null,
  status      text not null default 'sampling'
    check (status in ('sampling', 'active', 'paused', 'completed')),
  started_at  timestamptz not null default now(),
  unique (user_id, hobby_slug)
);

create index idx_user_hobbies_user on public.user_hobbies(user_id);


-- ─────────────────────────────────────────────────────────
-- 3. CHALLENGES
-- ─────────────────────────────────────────────────────────
create table public.challenges (
  id                 uuid primary key default gen_random_uuid(),
  hobby_slug         text not null,
  title              text not null,
  description        text not null,
  skills             text[] not null default '{}',
  difficulty         text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard', 'stretch')),
  estimated_time     text not null default '',
  tips               text[] not null default '{}',
  what_youll_learn   text[] not null default '{}',
  created_at         timestamptz not null default now()
);

create index idx_challenges_hobby on public.challenges(hobby_slug);


-- ─────────────────────────────────────────────────────────
-- 4. USER_CHALLENGES
-- ─────────────────────────────────────────────────────────
create table public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status       text not null default 'active'
    check (status in ('active', 'completed', 'skipped')),
  started_at   timestamptz,
  completed_at timestamptz,
  skipped_at   timestamptz,
  unique (user_id, challenge_id)
);

create index idx_user_challenges_challenge on public.user_challenges(challenge_id);


-- ─────────────────────────────────────────────────────────
-- 5. PRACTICE_SESSIONS
-- ─────────────────────────────────────────────────────────
create table public.practice_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  user_hobby_id     uuid not null references public.user_hobbies(id) on delete cascade,
  user_challenge_id uuid references public.user_challenges(id) on delete set null,
  session_type      text not null default 'practice'
    check (session_type in ('practice', 'thought')),
  duration          integer not null default 0,
  mood              text check (mood in ('loved', 'good', 'okay', 'frustrated', 'discouraged')),
  notes             text not null default '',
  image_url         text,
  created_at        timestamptz not null default now()
);

create index idx_sessions_user_date  on public.practice_sessions(user_id, created_at desc);
create index idx_sessions_user_hobby on public.practice_sessions(user_hobby_id);


-- ─────────────────────────────────────────────────────────
-- 6. AI_FEEDBACK
-- ─────────────────────────────────────────────────────────
create table public.ai_feedback (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null unique references public.practice_sessions(id) on delete cascade,
  observations text[] not null default '{}',
  growth       text[] not null default '{}',
  suggestions  text[] not null default '{}',
  celebration  text not null default '',
  created_at   timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────
-- 7. MILESTONES
-- ─────────────────────────────────────────────────────────
create table public.milestones (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text not null,
  created_at  timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────
-- 8. USER_MILESTONES
-- ─────────────────────────────────────────────────────────
create table public.user_milestones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  earned_at    timestamptz not null default now(),
  unique (user_id, milestone_id)
);

create index idx_user_milestones_user on public.user_milestones(user_id);


-- ─────────────────────────────────────────────────────────
-- 9. QUIZ_RESPONSES
-- ─────────────────────────────────────────────────────────
create table public.quiz_responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id integer not null,
  answer      jsonb not null,
  created_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

create index idx_quiz_responses_user on public.quiz_responses(user_id);


-- ─────────────────────────────────────────────────────────
-- 10. HOBBY_MATCHES
-- ─────────────────────────────────────────────────────────
create table public.hobby_matches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  hobby_slug       text not null,
  match_percentage integer not null check (match_percentage between 0 and 100),
  match_tags       text[] not null default '{}',
  reasoning        text not null default '',
  created_at       timestamptz not null default now(),
  unique (user_id, hobby_slug)
);

create index idx_hobby_matches_user on public.hobby_matches(user_id);


-- ─────────────────────────────────────────────────────────
-- 11. SAMPLING_RESULTS
-- ─────────────────────────────────────────────────────────
create table public.sampling_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  hobby_slug text not null,
  result     jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, hobby_slug)
);


-- ─────────────────────────────────────────────────────────
-- 12. LOCAL_EXPERIENCE_RESULTS
-- ─────────────────────────────────────────────────────────
create table public.local_experience_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  hobby_slug text not null,
  location   text not null,
  result     jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, hobby_slug, location)
);


-- ─────────────────────────────────────────────────────────
-- 13. JOBS  (backend only — no RLS, accessed via service-role key)
-- ─────────────────────────────────────────────────────────
create table public.jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  job_type     text not null,
  status       text not null default 'pending',
  request_data jsonb not null default '{}',
  result       jsonb,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_jobs_status     on public.jobs(status);
create index idx_jobs_user_id    on public.jobs(user_id);
create index idx_jobs_created_at on public.jobs(created_at desc);


-- ─────────────────────────────────────────────────────────
-- 14. ROADMAPS
-- ─────────────────────────────────────────────────────────
create table public.roadmaps (
  id           uuid primary key default gen_random_uuid(),
  hobby_slug   text not null,
  title        text not null default '',
  description  text not null default '',
  phases       jsonb not null default '[]',
  total_phases integer not null default 0,
  created_at   timestamptz not null default now()
);

create index idx_roadmaps_hobby on public.roadmaps(hobby_slug);


-- ─────────────────────────────────────────────────────────
-- 15. USER_ROADMAPS
-- Fix: unique constraint is now (user_id, hobby_slug) so a user
-- has exactly one active roadmap per hobby regardless of roadmap_id.
-- ─────────────────────────────────────────────────────────
create table public.user_roadmaps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  roadmap_id  uuid not null references public.roadmaps(id) on delete cascade,
  hobby_slug  text not null default '',
  current_phase integer not null default 0,
  started_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, hobby_slug)
);

create index idx_user_roadmaps_user on public.user_roadmaps(user_id);


-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Auto-update updated_at on every update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger trg_user_roadmaps_updated_at
  before update on public.user_roadmaps
  for each row execute function public.set_updated_at();


-- ═══════════════════════════════════════════════════════════
-- DATABASE FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Current consecutive-day streak
create or replace function public.get_current_streak(p_user_id uuid)
returns integer language sql stable as $$
  with daily as (
    select distinct (created_at at time zone 'UTC')::date as d
    from public.practice_sessions
    where user_id = p_user_id
    order by d desc
  ),
  gaps as (
    select d, d - (row_number() over (order by d desc))::int as grp
    from daily
  )
  select coalesce(count(*)::int, 0)
  from gaps
  where grp = (select grp from gaps limit 1);
$$;


-- Longest ever streak
create or replace function public.get_longest_streak(p_user_id uuid)
returns integer language sql stable as $$
  with daily as (
    select distinct (created_at at time zone 'UTC')::date as d
    from public.practice_sessions
    where user_id = p_user_id
  ),
  gaps as (
    select d, d - (row_number() over (order by d))::int as grp
    from daily
  ),
  streaks as (
    select count(*)::int as streak_len from gaps group by grp
  )
  select coalesce(max(streak_len), 0) from streaks;
$$;


-- Aggregate user stats (used by dashboard)
create or replace function public.get_user_stats(p_user_id uuid)
returns json language sql stable as $$
  select json_build_object(
    'total_sessions',
      (select count(*) from public.practice_sessions
       where user_id = p_user_id and session_type = 'practice'),
    'total_hours',
      (select coalesce(sum(duration), 0) / 60.0
       from public.practice_sessions
       where user_id = p_user_id and session_type = 'practice'),
    'challenges_completed',
      (select count(*) from public.user_challenges
       where user_id = p_user_id and status = 'completed'),
    'hobbies_explored',
      (select count(*) from public.user_hobbies
       where user_id = p_user_id),
    'current_streak',
      public.get_current_streak(p_user_id),
    'longest_streak',
      public.get_longest_streak(p_user_id),
    'days_since_joining',
      (select extract(day from now() - created_at)::int
       from public.profiles where id = p_user_id)
  );
$$;


-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

alter table public.profiles                enable row level security;
alter table public.user_hobbies            enable row level security;
alter table public.challenges              enable row level security;
alter table public.user_challenges         enable row level security;
alter table public.practice_sessions       enable row level security;
alter table public.ai_feedback             enable row level security;
alter table public.milestones              enable row level security;
alter table public.user_milestones         enable row level security;
alter table public.quiz_responses          enable row level security;
alter table public.hobby_matches           enable row level security;
alter table public.sampling_results        enable row level security;
alter table public.local_experience_results enable row level security;
alter table public.roadmaps                enable row level security;
alter table public.user_roadmaps           enable row level security;
-- jobs: no RLS — backend uses service-role key

-- ─── challenges, milestones — read-only for all authenticated ───
create policy "Anyone can read challenges"
  on public.challenges for select to authenticated using (true);

create policy "Anyone can read milestones"
  on public.milestones for select to authenticated using (true);

create policy "Authenticated users can read roadmaps"
  on public.roadmaps for select to authenticated using (true);

-- ─── profiles ───
create policy "Users can read own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- ─── user_hobbies ───
create policy "Users can read own hobbies"
  on public.user_hobbies for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own hobbies"
  on public.user_hobbies for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own hobbies"
  on public.user_hobbies for update to authenticated using (auth.uid() = user_id);

create policy "Users can delete own hobbies"
  on public.user_hobbies for delete to authenticated using (auth.uid() = user_id);

-- ─── user_challenges ───
create policy "Users can read own challenges"
  on public.user_challenges for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own challenges"
  on public.user_challenges for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own challenges"
  on public.user_challenges for update to authenticated using (auth.uid() = user_id);

-- ─── practice_sessions ───
create policy "Users can read own sessions"
  on public.practice_sessions for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.practice_sessions for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.practice_sessions for update to authenticated using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.practice_sessions for delete to authenticated using (auth.uid() = user_id);

-- ─── ai_feedback — backend writes via service-role key (no INSERT policy needed) ───
create policy "Users can read own feedback"
  on public.ai_feedback for select to authenticated using (
    session_id in (
      select id from public.practice_sessions where user_id = auth.uid()
    )
  );

-- ─── user_milestones ───
create policy "Users can read own milestones"
  on public.user_milestones for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own milestones"
  on public.user_milestones for insert to authenticated with check (auth.uid() = user_id);

-- ─── quiz_responses ───
create policy "Users can read own quiz responses"
  on public.quiz_responses for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own quiz responses"
  on public.quiz_responses for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own quiz responses"
  on public.quiz_responses for update to authenticated using (auth.uid() = user_id);

-- ─── hobby_matches ───
create policy "Users can read own matches"
  on public.hobby_matches for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own matches"
  on public.hobby_matches for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete own matches"
  on public.hobby_matches for delete to authenticated using (auth.uid() = user_id);

-- ─── sampling_results ───
create policy "Users can read own sampling results"
  on public.sampling_results for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own sampling results"
  on public.sampling_results for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own sampling results"
  on public.sampling_results for update to authenticated using (auth.uid() = user_id);

-- ─── local_experience_results ───
create policy "Users can read own local experience results"
  on public.local_experience_results for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own local experience results"
  on public.local_experience_results for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own local experience results"
  on public.local_experience_results for update to authenticated using (auth.uid() = user_id);

-- ─── user_roadmaps ───
create policy "Users can read own user_roadmaps"
  on public.user_roadmaps for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own user_roadmaps"
  on public.user_roadmaps for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own user_roadmaps"
  on public.user_roadmaps for update to authenticated using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════

-- ─── Milestones ───
insert into public.milestones (slug, title, description)
values
  ('first-steps',        'First Steps',        'Log your very first practice session'),
  ('building-momentum',  'Building Momentum',  'Complete 7 practice sessions'),
  ('challenge-champion', 'Challenge Champion', 'Complete 5 creative challenges'),
  ('explorer',           'Explorer',           'Try 3 different hobbies'),
  ('dedicated-creator',  'Dedicated Creator',  'Accumulate 10 hours of practice'),
  ('consistency-king',   'Consistency Legend', 'Maintain a 30-day practice streak'),
  ('month-one',          'Month One',          'Be on your creative journey for 30 days')
on conflict (slug) do nothing;
