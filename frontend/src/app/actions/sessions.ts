"use server";

import { createClient } from "@/lib/supabase/server";

export async function createSession(input: {
  userHobbyId: string;
  userChallengeId?: string | null;
  sessionType: "practice" | "thought";
  duration: number;
  mood?: "loved" | "good" | "okay" | "frustrated" | "discouraged" | null;
  notes?: string;
  imageUrl?: string | null;
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
       ai_feedback(*),
       user_hobbies!inner(*, hobbies(*))`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
       ai_feedback(*),
       user_hobbies!inner(*, hobbies(*)),
       user_challenges(*, challenges(*))`,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}
