-- ═══════════════════════════════════════════════════════════
-- Meraki — Migration 002: settings/privacy gap fixes
-- Run manually via the Supabase SQL editor — this repo has no
-- CLI-linked migration flow (schema.sql is a single hand-applied dump).
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- Notification preferences (stored on profiles — one row per user)
-- ─────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default jsonb_build_object(
    'email_enabled', false,
    'streak_reminders', false,
    'challenge_alerts', false,
    'weekly_digest', false
  );


-- ─────────────────────────────────────────────────────────
-- Lock down jobs table
-- Was intentionally RLS-disabled ("backend only — service-role key"),
-- but with no explicit REVOKE this can be readable via the anon/authenticated
-- REST API depending on project default grants. Enabling RLS with zero
-- policies blocks both roles; the service-role key still bypasses RLS
-- entirely, so the backend's existing access is unaffected.
-- ─────────────────────────────────────────────────────────
alter table public.jobs enable row level security;


-- ─────────────────────────────────────────────────────────
-- Avatars storage bucket
-- Mirrors the existing (dashboard-created) session-images bucket:
-- public read, write restricted to the user's own "{user_id}/..." path.
-- ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
