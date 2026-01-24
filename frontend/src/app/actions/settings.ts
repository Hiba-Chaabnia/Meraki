"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateSettings(updates: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  streak_reminders?: boolean;
  challenge_alerts?: boolean;
  weekly_digest?: boolean;
  public_profile?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("user_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [profile, settings, sessions, hobbies, challenges, milestones] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_settings").select("*").eq("id", user.id).single(),
      supabase
        .from("practice_sessions")
        .select("*, ai_feedback(*)")
        .eq("user_id", user.id),
      supabase.from("user_hobbies").select("*, hobbies(*)").eq("user_id", user.id),
      supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id),
      supabase
        .from("user_milestones")
        .select("*, milestones(*)")
        .eq("user_id", user.id),
    ]);

  return {
    data: {
      profile: profile.data,
      settings: settings.data,
      sessions: sessions.data,
      hobbies: hobbies.data,
      challenges: challenges.data,
      milestones: milestones.data,
      exported_at: new Date().toISOString(),
    },
  };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete user data from all tables (cascade should handle most, but be explicit)
  await Promise.all([
    supabase.from("practice_sessions").delete().eq("user_id", user.id),
    supabase.from("user_challenges").delete().eq("user_id", user.id),
    supabase.from("user_hobbies").delete().eq("user_id", user.id),
    supabase.from("user_milestones").delete().eq("user_id", user.id),
    supabase.from("quiz_responses").delete().eq("user_id", user.id),
    supabase.from("hobby_matches").delete().eq("user_id", user.id),
    supabase.from("user_settings").delete().eq("id", user.id),
    supabase.from("profiles").delete().eq("id", user.id),
  ]);

  await supabase.auth.signOut();
  return { success: true };
}
