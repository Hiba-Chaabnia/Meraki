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

  // Look up hobby UUIDs from slugs
  const slugs = matches.map((m) => m.hobbySlug);
  const { data: hobbies, error: lookupError } = await supabase
    .from("hobbies")
    .select("id, slug")
    .in("slug", slugs);
  if (lookupError) return { error: lookupError.message };

  const slugToId: Record<string, string> = {};
  hobbies?.forEach((h) => { slugToId[h.slug] = h.id; });

  // Delete previous matches for this user
  await supabase.from("hobby_matches").delete().eq("user_id", user.id);

  const rows = matches
    .filter((m) => slugToId[m.hobbySlug])
    .map((m) => ({
      user_id: user.id,
      hobby_id: slugToId[m.hobbySlug],
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
    .select("*, hobbies(*)")
    .eq("user_id", user.id)
    .order("match_percentage", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
