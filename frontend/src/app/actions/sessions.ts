"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadSessionImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("session-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage
    .from("session-images")
    .getPublicUrl(path);

  return { url: urlData.publicUrl };
}

export async function createSession(input: {
  userHobbyId: string;
  userChallengeId?: string | null;
  sessionType: "practice" | "thought";
  duration: number;
  mood?: "loved" | "good" | "okay" | "frustrated" | "discouraged" | null;
  notes?: string;
  imageUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      user_hobby_id: input.userHobbyId,
      user_challenge_id: input.userChallengeId ?? null,
      session_type: input.sessionType,
      duration: input.duration,
      mood: input.mood ?? null,
      notes: input.notes ?? "",
      image_url: input.imageUrl ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

/**
 * Practice sessions, newest first.
 *
 * Bounded. It was unbounded, and three surfaces call it on every load — the
 * dashboard, the hobby page and session detail — so a heavy user shipped every
 * row they had ever logged, three times over, to render at most a few dozen.
 * The cap sits well past what any of them shows: the dashboard derives a 7-day
 * strip and a streak, the hobby page one hobby's slice behind a scroll.
 *
 * The streak is the only consumer that could notice, and only past a 500-session
 * unbroken run.
 */
const SESSION_LIMIT = 500;

export async function getSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `*,
       user_hobbies!inner(*)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(SESSION_LIMIT);

  if (error) return { error: error.message };
  return { data };
}

/**
 * One hobby's sessions, newest first.
 *
 * The hobby page used to call `getSessions()` — up to 500 rows across every
 * hobby — and filter client-side with `toSessionsForHobby`. Filtering in the
 * query means a user with three hobbies stops paying for the other two, and
 * the cap now bounds what that page actually renders rather than what it
 * discards.
 */
export async function getSessionsForHobby(hobbySlug: string, limit = SESSION_LIMIT) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `*,
       user_hobbies!inner(*)`,
    )
    .eq("user_id", user.id)
    .eq("user_hobbies.hobby_slug", hobbySlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data };
}

export async function getSessionById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `*,
       user_hobbies!inner(*),
       user_challenges(*, challenges(*))`,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}
