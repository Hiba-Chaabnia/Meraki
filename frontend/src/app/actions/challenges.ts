"use server";

import { requireAuth } from "@/lib/supabase/requireAuth";
import { formatSlug } from "@/lib/hobbyData";
import { SERVER_API_URL } from "@/lib/config";
import { getPracticeContext } from "@/lib/practiceContext";

export async function getUserChallenges() {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_challenges")
    .select("*, challenges(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getChallengeById(id: string) {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_challenges")
    .select("*, challenges(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function completeChallenge(userChallengeId: string) {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_challenges")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", userChallengeId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function triggerChallengeGeneration(
  hobbySlug: string
): Promise<{ job_id?: string; error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const hobbyName = formatSlug(hobbySlug);
  const ctx = await getPracticeContext(supabase, user.id);

  try {
    const response = await fetch(`${SERVER_API_URL}/challenges/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        hobby_name: hobbyName,
        hobby_slug: hobbySlug,
        session_count: ctx.sessionCount,
        avg_duration: ctx.avgDuration,
        mood_distribution: ctx.moodDistribution,
        days_active: ctx.daysActive,
        completed_challenges: ctx.completedChallenges,
        skipped_challenges: ctx.skippedChallenges,
        recent_feedback: "None",
        last_mood_trend: ctx.recentMoods,
      }),
    });

    if (!response.ok) return { error: `API error: ${response.status}` };
    const data = await response.json();
    return { job_id: data.job_id };
  } catch (e) {
    return { error: `Failed to connect to challenge API: ${e}` };
  }
}

export async function pollChallengeGenStatus(
  jobId: string
): Promise<{ status: string; result?: unknown; error?: string | null }> {
  try {
    const response = await fetch(`${SERVER_API_URL}/challenges/generate/${jobId}`);
    if (!response.ok) return { status: "failed", error: `API error: ${response.status}` };
    return await response.json();
  } catch (e) {
    return { status: "failed", error: `Poll failed: ${e}` };
  }
}
