"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export async function saveQuizResponses(
  responses: { questionId: number; answer: Json }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const rows = responses.map((r) => ({
    user_id: user.id,
    question_id: r.questionId,
    answer: r.answer,
  }));

  const { error } = await supabase
    .from("quiz_responses")
    .upsert(rows, { onConflict: "user_id,question_id" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveHobbyMatches(
  matches: {
    hobbySlug: string;
    matchPercentage: number;
    matchTags?: string[];
    reasoning?: string;
  }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete previous matches for this user
  await supabase.from("hobby_matches").delete().eq("user_id", user.id);

  const rows = matches
    .filter((m) => m.hobbySlug)
    .map((m) => ({
      user_id: user.id,
      hobby_slug: m.hobbySlug,
      match_percentage: m.matchPercentage,
      match_tags: m.matchTags ?? [],
      reasoning: m.reasoning ?? "",
    }));

  if (rows.length === 0) return { success: true };

  const { error } = await supabase.from("hobby_matches").insert(rows);
  if (error) return { error: error.message };
  return { success: true };
}

export async function hasQuizResults(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from("hobby_matches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function getHobbyMatches() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("hobby_matches")
    .select("*")
    .eq("user_id", user.id)
    .order("match_percentage", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
