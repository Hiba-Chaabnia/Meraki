-- ═══════════════════════════════════════════════════════════
-- Meraki — Initial Database Schema
-- ═══════════════════════════════════════════════════════════
-- Run this migration in the Supabase SQL Editor or via CLI:
--   supabase db push
-- ═══════════════════════════════════════════════════════════


-- ─── 1. PROFILES ────────────────────────────────────────
-- Extends auth.users with app-specific profile data.
-- One-to-one with auth.users; auto-created via trigger.
-- ─────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  bio         text not null default '',
  location    text not null default '',
  pronouns    text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'User profile data that extends auth.users (name, bio, avatar, etc.)';


-- ─── 2. USER_SETTINGS ──────────────────────────────────
-- Notification and privacy preferences per user.
-- One-to-one with auth.users; auto-created via trigger.
-- ─────────────────────────────────────────────────────────
create table public.user_settings (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email_notifications  boolean not null default true,
  push_notifications   boolean not null default false,
  streak_reminders     boolean not null default true,
  challenge_alerts     boolean not null default true,
  weekly_digest        boolean not null default true,
  public_profile       boolean not null default false,
  updated_at           timestamptz not null default now()
);

comment on table public.user_settings is
  'Per-user notification toggles and privacy preferences';


-- ─── 3. HOBBY_CATEGORIES ───────────────────────────────
-- Reference table grouping hobbies into browsable categories.
-- Populated via seed data; rarely changes.
-- ─────────────────────────────────────────────────────────
create table public.hobby_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text not null default '',
  image_url   text,
  created_at  timestamptz not null default now()
);

comment on table public.hobby_categories is
  'Top-level groupings (Creative Arts, Crafts, Gardening, etc.)';


-- ─── 4. HOBBIES ────────────────────────────────────────
-- Catalog of all hobbies available on the platform.
-- Each hobby belongs to a category and carries display metadata.
-- ─────────────────────────────────────────────────────────
create table public.hobbies (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  category_id      uuid references public.hobby_categories(id) on delete set null,
  description      text not null default '',
  difficulty_level text not null default 'beginner'
    check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  time_commitment  text not null default 'moderate'
    check (time_commitment in ('quick', 'moderate', 'intensive')),
  cost_range       text not null default 'low'
    check (cost_range in ('free', 'low', 'medium', 'high')),
  color            text not null default '#B8A9E8',
  light_color      text not null default '#E8E2F7',
  image_url        text,
  created_at       timestamptz not null default now()
);

comment on table public.hobbies is
  'Master catalog of hobbies (pottery, watercolor, knitting, etc.)';


-- ─── 5. USER_HOBBIES ──────────────────────────────────
-- Junction table linking users to hobbies they are exploring.
-- Tracks lifecycle: sampling → active → paused → completed.
-- Streaks / totals are computed from practice_sessions.
-- ─────────────────────────────────────────────────────────
create table public.user_hobbies (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  hobby_id   uuid not null references public.hobbies(id) on delete cascade,
  status     text not null default 'sampling'
    check (status in ('sampling', 'active', 'paused', 'completed')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, hobby_id)
);

create index idx_user_hobbies_user on public.user_hobbies(user_id);

comment on table public.user_hobbies is
  'Which hobbies each user is exploring and their lifecycle status';


-- ─── 6. CHALLENGES ─────────────────────────────────────
-- Challenge templates tied to a hobby. These are the "what to do"
-- definitions; user progress is tracked in user_challenges.
-- Can be hand-authored or AI-generated (CrewAI).
-- ─────────────────────────────────────────────────────────
create table public.challenges (
  id                uuid primary key default gen_random_uuid(),
  hobby_id          uuid not null references public.hobbies(id) on delete cascade,
  title             text not null,
  description       text not null,
  why_this_challenge text not null default '',
  skills            text[] not null default '{}',
  difficulty        text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard', 'stretch')),
  estimated_time    text not null default '',
  tips              text[] not null default '{}',
  what_youll_learn  text[] not null default '{}',
  created_at        timestamptz not null default now()
);

create index idx_challenges_hobby on public.challenges(hobby_id);

comment on table public.challenges is
  'Challenge templates: reusable definitions tied to a hobby';


-- ─── 7. USER_CHALLENGES ────────────────────────────────
-- Tracks an individual user's progress through a challenge.
-- Separating this from the template allows many users to
-- attempt the same challenge independently.
-- ─────────────────────────────────────────────────────────
create table public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status       text not null default 'upcoming'
    check (status in ('active', 'upcoming', 'completed', 'skipped')),
  started_at   timestamptz,
  completed_at timestamptz,

  unique (user_id, challenge_id)
);

create index idx_user_challenges_user on public.user_challenges(user_id, status);

comment on table public.user_challenges is
  'Per-user progress on a challenge (active, completed, skipped)';


-- ─── 8. PRACTICE_SESSIONS ──────────────────────────────
-- The core activity table. Every time a user logs a practice
-- or a "thought" (mental engagement), a row is created here.
-- This is the source of truth for streaks, totals, heatmaps.
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

create index idx_sessions_user_date on public.practice_sessions(user_id, created_at desc);
create index idx_sessions_user_hobby on public.practice_sessions(user_hobby_id);

comment on table public.practice_sessions is
  'Every practice session or thought-log. Source of truth for streaks and stats.';


-- ─── 9. AI_FEEDBACK ────────────────────────────────────
-- AI-generated feedback for a practice session.
-- Stored separately because it is generated asynchronously
-- (CrewAI) and not every session receives feedback.
-- One-to-one with practice_sessions.
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

comment on table public.ai_feedback is
  'AI-generated observations, growth points, suggestions per session';


-- ─── 10. MILESTONES ────────────────────────────────────
-- Milestone definitions (gamification badges).
-- The criteria column stores machine-readable rules that
-- the backend evaluates to award milestones automatically.
-- ─────────────────────────────────────────────────────────
create table public.milestones (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text not null,
  icon        text not null,
  criteria    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.milestones is
  'Badge definitions with criteria rules (First Session, Week Warrior, etc.)';


-- ─── 11. USER_MILESTONES ───────────────────────────────
-- Junction table recording which milestones a user has earned.
-- Rows are inserted by the backend when criteria are met.
-- ─────────────────────────────────────────────────────────
create table public.user_milestones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  earned_at    timestamptz not null default now(),

  unique (user_id, milestone_id)
);

create index idx_user_milestones_user on public.user_milestones(user_id);

comment on table public.user_milestones is
  'Earned milestones per user';


-- ─── 12. QUIZ_RESPONSES ────────────────────────────────
-- Stores each user's answers to the personality quiz.
-- answer is JSONB to support both single strings and arrays.
-- These feed into the CrewAI hobby-matching algorithm.
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

comment on table public.quiz_responses is
  'Personality quiz answers used by CrewAI for hobby matching';


-- ─── 13. HOBBY_MATCHES ─────────────────────────────────
-- AI-generated hobby recommendations for a user.
-- Produced by CrewAI after the quiz; displayed on the
-- results screen and used to seed the sampling flow.
-- ─────────────────────────────────────────────────────────
create table public.hobby_matches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  hobby_id         uuid not null references public.hobbies(id) on delete cascade,
  match_percentage integer not null check (match_percentage between 0 and 100),
  match_tags       text[] not null default '{}',
  reasoning        text not null default '',
  created_at       timestamptz not null default now(),

  unique (user_id, hobby_id)
);

create index idx_hobby_matches_user on public.hobby_matches(user_id);

comment on table public.hobby_matches is
  'CrewAI-generated hobby recommendations with match % and tags';


-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-create profile + settings row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into public.user_settings (id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Auto-update updated_at timestamps
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

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create trigger trg_user_hobbies_updated_at
  before update on public.user_hobbies
  for each row execute function public.set_updated_at();


-- ═══════════════════════════════════════════════════════════
-- COMPUTED HELPERS (database functions)
-- ═══════════════════════════════════════════════════════════

-- Returns the current consecutive-day streak for a user
create or replace function public.get_current_streak(p_user_id uuid)
returns integer
language sql stable
as $$
  with daily as (
    select distinct (created_at at time zone 'UTC')::date as d
    from public.practice_sessions
    where user_id = p_user_id
    order by d desc
  ),
  gaps as (
    select d,
           d - (row_number() over (order by d desc))::int as grp
    from daily
  )
  select count(*)::int
  from gaps
  where grp = (select grp from gaps limit 1);
$$;


-- Returns aggregate stats for a user as a JSON object
create or replace function public.get_user_stats(p_user_id uuid)
returns json
language sql stable
as $$
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
    'days_since_joining',
      (select extract(day from now() - created_at)::int
       from public.profiles where id = p_user_id)
  );
$$;


-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

alter table public.profiles          enable row level security;
alter table public.user_settings     enable row level security;
alter table public.hobby_categories  enable row level security;
alter table public.hobbies           enable row level security;
alter table public.user_hobbies      enable row level security;
alter table public.challenges        enable row level security;
alter table public.user_challenges   enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.ai_feedback       enable row level security;
alter table public.milestones        enable row level security;
alter table public.user_milestones   enable row level security;
alter table public.quiz_responses    enable row level security;
alter table public.hobby_matches     enable row level security;

-- ─── Reference tables: anyone authenticated can read ───
create policy "Anyone can read hobby_categories"
  on public.hobby_categories for select
  to authenticated using (true);

create policy "Anyone can read hobbies"
  on public.hobbies for select
  to authenticated using (true);

create policy "Anyone can read challenges"
  on public.challenges for select
  to authenticated using (true);

create policy "Anyone can read milestones"
  on public.milestones for select
  to authenticated using (true);

-- ─── profiles ───
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- ─── user_settings ───
create policy "Users can read own settings"
  on public.user_settings for select
  to authenticated using (auth.uid() = id);

create policy "Users can update own settings"
  on public.user_settings for update
  to authenticated using (auth.uid() = id);

-- ─── user_hobbies ───
create policy "Users can read own hobbies"
  on public.user_hobbies for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can insert own hobbies"
  on public.user_hobbies for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can update own hobbies"
  on public.user_hobbies for update
  to authenticated using (auth.uid() = user_id);

create policy "Users can delete own hobbies"
  on public.user_hobbies for delete
  to authenticated using (auth.uid() = user_id);

-- ─── user_challenges ───
create policy "Users can read own challenges"
  on public.user_challenges for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can insert own challenges"
  on public.user_challenges for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can update own challenges"
  on public.user_challenges for update
  to authenticated using (auth.uid() = user_id);

-- ─── practice_sessions ───
create policy "Users can read own sessions"
  on public.practice_sessions for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.practice_sessions for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.practice_sessions for update
  to authenticated using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.practice_sessions for delete
  to authenticated using (auth.uid() = user_id);

-- ─── ai_feedback ───
create policy "Users can read own feedback"
  on public.ai_feedback for select
  to authenticated using (
    session_id in (
      select id from public.practice_sessions where user_id = auth.uid()
    )
  );

-- ─── user_milestones ───
create policy "Users can read own milestones"
  on public.user_milestones for select
  to authenticated using (auth.uid() = user_id);

-- ─── quiz_responses ───
create policy "Users can read own quiz responses"
  on public.quiz_responses for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can upsert own quiz responses"
  on public.quiz_responses for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can update own quiz responses"
  on public.quiz_responses for update
  to authenticated using (auth.uid() = user_id);

-- ─── hobby_matches ───
create policy "Users can read own matches"
  on public.hobby_matches for select
  to authenticated using (auth.uid() = user_id);
