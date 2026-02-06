-- ═══════════════════════════════════════════════════════════
-- Meraki — Migration 004: fields the dashboard hobby cards need
-- Run manually via the Supabase SQL editor — this repo has no
-- CLI-linked migration flow (schema.sql is a single hand-applied dump).
--
-- Backs two things the cards in docs/frontend/dashboard.html show but
-- the schema had nowhere to store:
--   * a tickable checklist per roadmap stage  -> user_roadmaps.completed_goals
--   * "Paused Aug 1"                          -> user_hobbies.paused_at
--
-- Both are additive. No existing policy changes are needed: both tables
-- already carry "Users can update own ..." policies scoped to auth.uid().
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- 1. Per-goal completion
--
-- A JSONB array of "phase_number:goal_index" keys (1-based phase, 0-based
-- goal), e.g. ["1:0", "2:1"]. Stored on user_roadmaps rather than in a join
-- table because there is exactly one row per (user, hobby) and the dashboard
-- already selects it — the checklist costs no extra query.
--
-- Keys are positional, so they would go stale if a roadmap's phases were ever
-- replaced in place. Today they cannot be: save_generated_roadmap() in the
-- backend does a plain INSERT into user_roadmaps, which the existing
-- unique (user_id, hobby_slug) constraint rejects for a hobby that already has
-- one. If that ever becomes an upsert, this column must be reset alongside it.
-- ─────────────────────────────────────────────────────────
alter table public.user_roadmaps
  add column if not exists completed_goals jsonb not null default '[]'::jsonb;


-- ─────────────────────────────────────────────────────────
-- 2. When a hobby was paused
--
-- Kept in step with `status` by a trigger rather than by the callers, because
-- both the frontend (server actions, anon key + RLS) and the backend (service
-- role) can write status, and only one of them went through updateHobbyStatus.
--
-- Resuming clears it: the column answers "when was it paused", not "when was
-- it last paused", so a running hobby must not carry a stale date.
--
-- Existing paused rows stay NULL — that date was never recorded and inventing
-- one from started_at would be a fabrication. The card falls back to its last
-- practice date when this is null.
-- ─────────────────────────────────────────────────────────
alter table public.user_hobbies
  add column if not exists paused_at timestamptz;

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
