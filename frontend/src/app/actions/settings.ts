"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationPrefs } from "@/types/database.types";

/**
 * Every table holding rows scoped to a single user, mapped to the select used
 * when exporting it.
 *
 * Deletion iterates the keys; export iterates the same keys and uses the value
 * as its select clause. They were previously two separate lists and had already
 * drifted — export was missing four tables, so "download a complete copy" was
 * quietly untrue. Keep them as one list: adding a user-scoped table here makes
 * it both deletable and exportable at once.
 */
const USER_DATA_TABLES = {
  practice_sessions: "*, ai_feedback(*)", // deletion cascades ai_feedback
  user_challenges: "*, challenges(*)",
  user_hobbies: "*",
  user_milestones: "*, milestones(*)",
  quiz_responses: "*",
  hobby_matches: "*",
  sampling_results: "*",
  local_experience_results: "*",
  nudges: "*",
  user_roadmaps: "*",
} as const;

type UserDataTable = keyof typeof USER_DATA_TABLES;

/** `Object.keys` widens to `string[]`; Supabase needs the literal union. */
const USER_DATA_TABLE_NAMES = Object.keys(USER_DATA_TABLES) as UserDataTable[];

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

  const [profile, ...tables] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    ...USER_DATA_TABLE_NAMES.map((table) =>
      supabase.from(table).select(USER_DATA_TABLES[table]).eq("user_id", user.id)
    ),
  ]);

  // The privacy policy promises a complete copy, so a partial export is worse
  // than none — it looks authoritative while quietly omitting things. Fail
  // instead, and say which table broke.
  const failed = [
    ...(profile.error ? [`profiles: ${profile.error.message}`] : []),
    ...tables.flatMap((res, i) =>
      res.error ? [`${USER_DATA_TABLE_NAMES[i]}: ${res.error.message}`] : []
    ),
  ];
  if (failed.length > 0) {
    console.error("[settings] Export failed:", failed.join("; "));
    return { error: "Could not export all of your data. Please try again." };
  }

  const rows = Object.fromEntries(
    USER_DATA_TABLE_NAMES.map((table, i) => [table, tables[i].data])
  );

  return {
    data: {
      // Lives in auth.users, not profiles — it was missing from the export
      // entirely, despite being the field people identify themselves by.
      account: {
        email: user.email,
        signed_up_at: user.created_at,
        sign_in_method: user.app_metadata?.provider ?? "email",
      },
      profile: profile.data,
      ...rows,
      // Photos are referenced by URL rather than embedded; bundling the files
      // would mean building an archive. The privacy policy says so explicitly.
      note: "Photos appear as links. Download them before deleting your account — the links stop working once it is gone.",
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
    USER_DATA_TABLE_NAMES.map((table) =>
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
