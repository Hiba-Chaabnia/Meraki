-- ═══════════════════════════════════════════════════════════
-- Meraki — Complete Database Schema
--
-- The single source of truth, and now the only file here. It folds in every
-- numbered migration through 008_drop_notification_prefs.sql; those files have
-- been deleted, since a database only ever needed this one and keeping both
-- meant two places to answer "what is the schema". They remain in git history
-- if the reasoning behind a particular change is ever wanted — docs written
-- before this point still cite them by number.
--
-- Written to be re-runnable: every statement is `if not exists`, `or replace`,
-- or a `drop ... if exists` followed by a create. Running it against a database
-- that is already up to date changes nothing, so it doubles as a repair script
-- when you are not sure which migrations landed.
--
-- Run it in the Supabase SQL editor. This repo has no CLI-linked migration flow.
-- ═══════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default '',
  avatar_url     text,
  bio            text not null default '',
  location       text not null default '',
  public_profile boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- notification_prefs recorded consent for emails that no sender could send.
alter table public.profiles
  drop column if exists notification_prefs;


-- ─────────────────────────────────────────────────────────
-- 2. USER_HOBBIES
--
-- hobby_slug is the identity: unique per user, and the join key for
-- user_roadmaps.hobby_slug and challenges.hobby_slug (neither of which is a
-- real FK). Renaming by rewriting it would silently detach a hobby from its
-- roadmap and its challenges, so the display name lives beside it in
-- custom_name. Null means "derive it from the slug".
-- ─────────────────────────────────────────────────────────
create table if not exists public.user_hobbies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  hobby_slug  text not null,
  custom_name text,
  status      text not null default 'sampling',
  started_at  timestamptz not null default now(),
  paused_at   timestamptz,
  unique (user_id, hobby_slug)
);

alter table public.user_hobbies add column if not exists custom_name text;
alter table public.user_hobbies add column if not exists paused_at   timestamptz;

comment on column public.user_hobbies.custom_name is
  'User-chosen display name. Null = derive from hobby_slug via formatSlug().';

-- 'completed' was in the constraint from day one and nothing ever set it. A
-- hobby is not a thing you finish: 'paused' covers "not right now", delete
-- covers "not ever", and reaching the last roadmap stage is a milestone.
update public.user_hobbies set status = 'paused' where status = 'completed';

alter table public.user_hobbies drop constraint if exists user_hobbies_status_check;
alter table public.user_hobbies
  add constraint user_hobbies_status_check
  check (status in ('sampling', 'active', 'paused'));

create index if not exists idx_user_hobbies_user on public.user_hobbies(user_id);

-- The active-hobby cap lives in src/lib/hobbyLimits.ts, not here: a check
-- constraint cannot count sibling rows, and a trigger that rejected the insert
-- would surface as a raw Postgres error rather than the sentence the modal
-- wants to show.


-- ─────────────────────────────────────────────────────────
-- 3. CHALLENGES
-- ─────────────────────────────────────────────────────────
create table if not exists public.challenges (
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

create index if not exists idx_challenges_hobby on public.challenges(hobby_slug);


-- ─────────────────────────────────────────────────────────
-- 4. USER_CHALLENGES
--
-- completed_at stays null for a skipped row — it means "when completed", and a
-- skipped challenge was not. So the one-skip-per-hobby-per-day guard reads
-- skipped_at instead.
-- ─────────────────────────────────────────────────────────
create table if not exists public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status       text not null default 'active',
  started_at   timestamptz,
  completed_at timestamptz,
  skipped_at   timestamptz,
  unique (user_id, challenge_id)
);

alter table public.user_challenges add column if not exists skipped_at timestamptz;

-- Rows skipped before skipping was a user action were system-retired, not
-- skipped by anyone; started_at is honest about not knowing the real moment
-- while keeping the column populated where a retirement really happened.
update public.user_challenges
   set skipped_at = coalesce(skipped_at, started_at, now())
 where status = 'skipped' and skipped_at is null;

-- 'upcoming' was the column default but nothing ever wrote it:
-- save_generated_challenge always inserts 'active'.
update public.user_challenges set status = 'active' where status = 'upcoming';

alter table public.user_challenges alter column status set default 'active';

alter table public.user_challenges drop constraint if exists user_challenges_status_check;
alter table public.user_challenges
  add constraint user_challenges_status_check
  check (status in ('active', 'completed', 'skipped'));

create index if not exists idx_user_challenges_challenge
  on public.user_challenges(challenge_id);

-- Serves both reads the generation guard performs — "is there an active
-- challenge for this hobby" and "when was the last skip" — and shares the
-- (user_id, status) prefix of the older idx_user_challenges_user it replaces.
create index if not exists idx_user_challenges_user_status
  on public.user_challenges(user_id, status, skipped_at desc);

drop index if exists public.idx_user_challenges_user;


-- ─────────────────────────────────────────────────────────
-- 5. PRACTICE_SESSIONS
-- ─────────────────────────────────────────────────────────
create table if not exists public.practice_sessions (
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

create index if not exists idx_sessions_user_date
  on public.practice_sessions(user_id, created_at desc);
create index if not exists idx_sessions_user_hobby
  on public.practice_sessions(user_hobby_id);


-- ─────────────────────────────────────────────────────────
-- 6. AI_FEEDBACK
-- ─────────────────────────────────────────────────────────
create table if not exists public.ai_feedback (
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
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text not null,
  created_at  timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────
-- 8. USER_MILESTONES
-- ─────────────────────────────────────────────────────────
create table if not exists public.user_milestones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  earned_at    timestamptz not null default now(),
  unique (user_id, milestone_id)
);

create index if not exists idx_user_milestones_user on public.user_milestones(user_id);


-- ─────────────────────────────────────────────────────────
-- 9. QUIZ_RESPONSES
-- ─────────────────────────────────────────────────────────
create table if not exists public.quiz_responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id integer not null,
  answer      jsonb not null,
  created_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_quiz_responses_user on public.quiz_responses(user_id);


-- ─────────────────────────────────────────────────────────
-- 10. HOBBY_MATCHES
-- ─────────────────────────────────────────────────────────
create table if not exists public.hobby_matches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  hobby_slug       text not null,
  match_percentage integer not null check (match_percentage between 0 and 100),
  match_tags       text[] not null default '{}',
  reasoning        text not null default '',
  created_at       timestamptz not null default now(),
  unique (user_id, hobby_slug)
);

create index if not exists idx_hobby_matches_user on public.hobby_matches(user_id);


-- ─────────────────────────────────────────────────────────
-- 11. SAMPLING_RESULTS
-- ─────────────────────────────────────────────────────────
create table if not exists public.sampling_results (
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
create table if not exists public.local_experience_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  hobby_slug text not null,
  location   text not null,
  result     jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, hobby_slug, location)
);


-- ─────────────────────────────────────────────────────────
-- 13. JOBS  (backend only — service-role key)
--
-- progress is the number of crew tasks FINISHED so far:
--   0 = nothing done yet (queued, or the first task still running)
--   n = all n tasks done, set just before status flips to 'completed'
-- A plain int rather than a step name: task names are a backend detail, and
-- the client already owns both the labels and the total count per crew.
-- ─────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  job_type     text not null,
  status       text not null default 'pending',
  request_data jsonb not null default '{}',
  result       jsonb,
  error        text,
  progress     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.jobs add column if not exists progress integer not null default 0;

create index if not exists idx_jobs_status     on public.jobs(status);
create index if not exists idx_jobs_user_id    on public.jobs(user_id);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);


-- ─────────────────────────────────────────────────────────
-- 14. ROADMAPS
-- ─────────────────────────────────────────────────────────
create table if not exists public.roadmaps (
  id           uuid primary key default gen_random_uuid(),
  hobby_slug   text not null,
  title        text not null default '',
  description  text not null default '',
  phases       jsonb not null default '[]',
  total_phases integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_roadmaps_hobby on public.roadmaps(hobby_slug);


-- ─────────────────────────────────────────────────────────
-- 15. USER_ROADMAPS
--
-- completed_goals is a JSONB array of "phase_number:goal_index" keys (1-based
-- phase, 0-based goal), e.g. ["1:0", "2:1"]. Kept here rather than in a join
-- table because there is exactly one row per (user, hobby) and the dashboard
-- already selects it — the checklist costs no extra query.
--
-- The keys are positional, so they would go stale if a roadmap's phases were
-- replaced in place. Today they cannot be: save_generated_roadmap() does a
-- plain INSERT, which unique (user_id, hobby_slug) rejects for a hobby that
-- already has one. If that ever becomes an upsert, reset this column alongside.
-- ─────────────────────────────────────────────────────────
create table if not exists public.user_roadmaps (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  roadmap_id      uuid not null references public.roadmaps(id) on delete cascade,
  hobby_slug      text not null default '',
  current_phase   integer not null default 0,
  completed_goals jsonb not null default '[]'::jsonb,
  started_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, hobby_slug)
);

alter table public.user_roadmaps
  add column if not exists completed_goals jsonb not null default '[]'::jsonb;

create index if not exists idx_user_roadmaps_user on public.user_roadmaps(user_id);


-- ─────────────────────────────────────────────────────────
-- Dropped: NUDGES
--
-- The motivation nudge is derived, not stored. frontend/src/lib/nudge.ts
-- computes it from dashboard state the page already holds, and the whole write
-- path (save_nudge <- run_motivation_check_job <- POST /motivation/check) is
-- gone. Cascade takes the policies and the index with the table.
-- ─────────────────────────────────────────────────────────
drop table if exists public.nudges cascade;


-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Email sign-up writes `full_name` (see app/auth/actions.ts); Google returns the
-- same thing under `name`. Reading only the first left every OAuth profile
-- nameless, which surfaced as the dashboard greeting falling back to the email
-- local-part while the header — which did check the metadata — showed the real
-- name.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_roadmaps_updated_at on public.user_roadmaps;
create trigger trg_user_roadmaps_updated_at
  before update on public.user_roadmaps
  for each row execute function public.set_updated_at();


-- paused_at is kept in step with status by a trigger rather than by the
-- callers, because both the frontend (anon key + RLS) and the backend (service
-- role) can write status and only one of them went through updateHobbyStatus.
-- Resuming clears it: the column answers "when was it paused", not "when was it
-- last paused". Rows paused before the column existed stay null — that date was
-- never recorded, and inventing one from started_at would be a fabrication.
create or replace function public.sync_user_hobby_paused_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paused' and old.status is distinct from 'paused' then
    new.paused_at := now();
  elsif new.status <> 'paused' then
    new.paused_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_hobbies_paused_at on public.user_hobbies;

-- BEFORE INSERT too: a row created straight into 'paused' should be stamped.
-- On insert OLD is null, so `old.status is distinct from 'paused'` is true.
create trigger trg_user_hobbies_paused_at
  before insert or update of status on public.user_hobbies
  for each row execute function public.sync_user_hobby_paused_at();


-- ═══════════════════════════════════════════════════════════
-- DATABASE FUNCTIONS
-- ═══════════════════════════════════════════════════════════

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

alter table public.profiles                 enable row level security;
alter table public.user_hobbies             enable row level security;
alter table public.challenges               enable row level security;
alter table public.user_challenges          enable row level security;
alter table public.practice_sessions        enable row level security;
alter table public.ai_feedback              enable row level security;
alter table public.milestones               enable row level security;
alter table public.user_milestones          enable row level security;
alter table public.quiz_responses           enable row level security;
alter table public.hobby_matches            enable row level security;
alter table public.sampling_results         enable row level security;
alter table public.local_experience_results enable row level security;
alter table public.roadmaps                 enable row level security;
alter table public.user_roadmaps            enable row level security;

-- jobs is backend-only. Without an explicit REVOKE it can still be readable
-- through the REST API depending on project default grants, so RLS is enabled
-- with zero policies: that blocks anon and authenticated outright, while the
-- service-role key bypasses RLS entirely and the backend is unaffected.
alter table public.jobs enable row level security;


-- ─── challenges, milestones, roadmaps — read-only for all authenticated ───
drop policy if exists "Anyone can read challenges" on public.challenges;
create policy "Anyone can read challenges"
  on public.challenges for select to authenticated using (true);

drop policy if exists "Anyone can read milestones" on public.milestones;
create policy "Anyone can read milestones"
  on public.milestones for select to authenticated using (true);

drop policy if exists "Authenticated users can read roadmaps" on public.roadmaps;
create policy "Authenticated users can read roadmaps"
  on public.roadmaps for select to authenticated using (true);

-- ─── profiles ───
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- ─── user_hobbies ───
drop policy if exists "Users can read own hobbies" on public.user_hobbies;
create policy "Users can read own hobbies"
  on public.user_hobbies for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own hobbies" on public.user_hobbies;
create policy "Users can insert own hobbies"
  on public.user_hobbies for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own hobbies" on public.user_hobbies;
create policy "Users can update own hobbies"
  on public.user_hobbies for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own hobbies" on public.user_hobbies;
create policy "Users can delete own hobbies"
  on public.user_hobbies for delete to authenticated using (auth.uid() = user_id);

-- ─── user_challenges ───
-- The delete policy matters: user_challenges and user_roadmaps join by slug,
-- not by foreign key, so deleting a hobby row does not cascade to them. They
-- would survive and reattach to the next hobby added with the same slug — a
-- "new" hobby arriving with a stale roadmap and someone else's finished
-- challenges. deleteUserHobby() clears them explicitly, and RLS silently drops
-- deletes rather than erroring, so the policy has to exist.
drop policy if exists "Users can read own challenges" on public.user_challenges;
create policy "Users can read own challenges"
  on public.user_challenges for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own challenges" on public.user_challenges;
create policy "Users can insert own challenges"
  on public.user_challenges for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own challenges" on public.user_challenges;
create policy "Users can update own challenges"
  on public.user_challenges for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own challenges" on public.user_challenges;
create policy "Users can delete own challenges"
  on public.user_challenges for delete to authenticated using (auth.uid() = user_id);

-- ─── practice_sessions ───
drop policy if exists "Users can read own sessions" on public.practice_sessions;
create policy "Users can read own sessions"
  on public.practice_sessions for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.practice_sessions;
create policy "Users can insert own sessions"
  on public.practice_sessions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.practice_sessions;
create policy "Users can update own sessions"
  on public.practice_sessions for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.practice_sessions;
create policy "Users can delete own sessions"
  on public.practice_sessions for delete to authenticated using (auth.uid() = user_id);

-- ─── ai_feedback — the backend writes with the service-role key, so no INSERT ───
drop policy if exists "Users can read own feedback" on public.ai_feedback;
create policy "Users can read own feedback"
  on public.ai_feedback for select to authenticated using (
    session_id in (
      select id from public.practice_sessions where user_id = auth.uid()
    )
  );

-- ─── user_milestones ───
drop policy if exists "Users can read own milestones" on public.user_milestones;
create policy "Users can read own milestones"
  on public.user_milestones for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own milestones" on public.user_milestones;
create policy "Users can insert own milestones"
  on public.user_milestones for insert to authenticated with check (auth.uid() = user_id);

-- ─── quiz_responses ───
drop policy if exists "Users can read own quiz responses" on public.quiz_responses;
create policy "Users can read own quiz responses"
  on public.quiz_responses for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own quiz responses" on public.quiz_responses;
create policy "Users can insert own quiz responses"
  on public.quiz_responses for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own quiz responses" on public.quiz_responses;
create policy "Users can update own quiz responses"
  on public.quiz_responses for update to authenticated using (auth.uid() = user_id);

-- ─── hobby_matches ───
drop policy if exists "Users can read own matches" on public.hobby_matches;
create policy "Users can read own matches"
  on public.hobby_matches for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own matches" on public.hobby_matches;
create policy "Users can insert own matches"
  on public.hobby_matches for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own matches" on public.hobby_matches;
create policy "Users can delete own matches"
  on public.hobby_matches for delete to authenticated using (auth.uid() = user_id);

-- ─── sampling_results ───
drop policy if exists "Users can read own sampling results" on public.sampling_results;
create policy "Users can read own sampling results"
  on public.sampling_results for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own sampling results" on public.sampling_results;
create policy "Users can insert own sampling results"
  on public.sampling_results for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own sampling results" on public.sampling_results;
create policy "Users can update own sampling results"
  on public.sampling_results for update to authenticated using (auth.uid() = user_id);

-- ─── local_experience_results ───
drop policy if exists "Users can read own local experience results" on public.local_experience_results;
create policy "Users can read own local experience results"
  on public.local_experience_results for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own local experience results" on public.local_experience_results;
create policy "Users can insert own local experience results"
  on public.local_experience_results for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own local experience results" on public.local_experience_results;
create policy "Users can update own local experience results"
  on public.local_experience_results for update to authenticated using (auth.uid() = user_id);

-- ─── user_roadmaps ───
drop policy if exists "Users can read own user_roadmaps" on public.user_roadmaps;
create policy "Users can read own user_roadmaps"
  on public.user_roadmaps for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own user_roadmaps" on public.user_roadmaps;
create policy "Users can insert own user_roadmaps"
  on public.user_roadmaps for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own user_roadmaps" on public.user_roadmaps;
create policy "Users can update own user_roadmaps"
  on public.user_roadmaps for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own roadmaps" on public.user_roadmaps;
create policy "Users can delete own roadmaps"
  on public.user_roadmaps for delete to authenticated using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- STORAGE
--
-- Both buckets: public read, writes restricted to the user's own
-- "{user_id}/..." path.
--
-- session-images was originally created by hand from the Supabase dashboard
-- and existed only there, so a fresh project came up with practice-photo
-- uploads failing and nothing saying why. It is defined here now.
--
-- Note that `public` means exactly that: anyone holding the URL can fetch a
-- practice photo. That is what `getPublicUrl` in uploadSessionImage already
-- assumes. Making it private would mean signed URLs and a change to that
-- action — worth doing if these are ever treated as private, and deliberately
-- not changed here.
-- ═══════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('session-images', 'session-images', true)
on conflict (id) do nothing;

drop policy if exists "Session images are publicly readable" on storage.objects;
create policy "Session images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'session-images');

drop policy if exists "Users can upload their own session images" on storage.objects;
create policy "Users can upload their own session images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'session-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own session images" on storage.objects;
create policy "Users can delete their own session images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'session-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ═══════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════

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
