"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationPrefs } from "@/types/database.types";

const USER_DATA_TABLES = [
  "practice_sessions", // cascades ai_feedback
  "user_challenges",
  "user_hobbies",
  "user_milestones",
  "quiz_responses",
  "hobby_matches",
  "sampling_results",
  "local_experience_results",
  "nudges",
  "user_roadmaps",
] as const;

const STORAGE_BUCKETS = ["session-images", "avatars"] as const;

async function deleteUserStorageFiles(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await admin.storage.from(bucket).remove(paths);
    }
  }
}

export async function updatePublicProfile(value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .update({ public_profile: value, updated_at: new Date().toISOString() })
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

export async function getNotificationPrefs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data: data.notification_prefs };
}

export async function updateNotificationPrefs(prefs: NotificationPrefs) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("notification_prefs")
    .single();

  if (error) return { error: error.message };
  return { data: data.notification_prefs };
}

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [
    profile,
    sessions,
    hobbies,
    challenges,
    milestones,
    quizResponses,
    hobbyMatches,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("practice_sessions")
      .select("*, ai_feedback(*)")
      .eq("user_id", user.id),
    supabase.from("user_hobbies").select("*").eq("user_id", user.id),
    supabase
      .from("user_challenges")
      .select("*, challenges(*)")
      .eq("user_id", user.id),
    supabase
      .from("user_milestones")
      .select("*, milestones(*)")
      .eq("user_id", user.id),
    supabase.from("quiz_responses").select("*").eq("user_id", user.id),
    supabase.from("hobby_matches").select("*").eq("user_id", user.id),
  ]);

  return {
    data: {
      profile: profile.data,
      sessions: sessions.data,
      hobbies: hobbies.data,
      challenges: challenges.data,
      milestones: milestones.data,
      quiz_responses: quizResponses.data,
      hobby_matches: hobbyMatches.data,
      exported_at: new Date().toISOString(),
    },
  };
}

/** Wipes all activity/content data but keeps the login and profile row intact. */
export async function deleteAllUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  await deleteUserStorageFiles(admin, user.id);
  await Promise.all(
    USER_DATA_TABLES.map((table) =>
      admin.from(table).delete().eq("user_id", user.id)
    )
  );

  return { success: true };
}

/** Deletes the Auth user itself — every FK-linked row cascades automatically. */
export async function deleteAccountPermanently() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  await deleteUserStorageFiles(admin, user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  return { success: true };
}
