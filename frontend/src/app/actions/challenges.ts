"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
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

/**
 * One hobby's challenges, newest first. Same reasoning as
 * `getSessionsForHobby`: the hobby page pulled every challenge the account had
 * and filtered client-side.
 */
export async function getChallengesForHobby(hobbySlug: string) {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_challenges")
    .select("*, challenges!inner(*)")
    .eq("user_id", user.id)
    .eq("challenges.hobby_slug", hobbySlug)
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

/**
 * One skip per hobby per day.
 *
 * Each generation is a ~90-second crew run, so unlimited rerolls turn it into a
 * slot machine. The cap also makes the signal mean something: `tasks.yaml` tells
 * the crew "DO NOT repeat similar patterns" for skipped challenges, which is
 * only useful if a skip cost the user something.
 */
const SKIP_COOLDOWN_HOURS = 24;

/** Rows for one hobby, resolved through the join since hobby_slug lives on `challenges`. */
async function hobbyChallenges(
  supabase: SupabaseClient<Database>,
  userId: string,
  hobbySlug: string,
) {
  const { data } = await supabase
    .from("user_challenges")
    .select("id, status, skipped_at, challenges(hobby_slug)")
    .eq("user_id", userId);

  type Row = { id: string; status: string; skipped_at: string | null; challenges: { hobby_slug: string } | null };
  return ((data ?? []) as unknown as Row[]).filter((r) => r.challenges?.hobby_slug === hobbySlug);
}

export async function triggerChallengeGeneration(
  hobbySlug: string
): Promise<{ job_id?: string; error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  /* Enforced here, not just in the UI. Both surfaces already hide their
     generate button while a challenge is active, but a second tab or a stale
     page defeated that — and a second active challenge is exactly what
     `_skip_previous_active_challenges` used to paper over by silently
     retiring the first. */
  const rows = await hobbyChallenges(supabase, user.id, hobbySlug);
  if (rows.some((r) => r.status === "active")) {
    return { error: "You already have an active challenge for this hobby." };
  }

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


/**
 * Reject a challenge and generate a replacement, atomically.
 *
 * The honest exit from a challenge you do not want. Without it the only way out
 * would be claiming you completed it, and `challengesCompleted` feeds
 * get_user_stats, the Progress page and the challenge-champion milestone.
 *
 * Skip and generate are one action because they are only safe together: the
 * generation guard refuses while a challenge is active, so the row must be
 * marked first — which means a failed trigger would otherwise leave the user
 * with no challenge at all *and* the daily skip spent. If the trigger fails the
 * skip is rolled back.
 */
export async function swapChallenge(
  userChallengeId: string,
  hobbySlug: string,
): Promise<{ job_id?: string; error?: string; retryAfterHours?: number }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const rows = await hobbyChallenges(supabase, user.id, hobbySlug);
  const lastSkip = rows
    .map((r) => r.skipped_at)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  if (lastSkip) {
    const hours = (Date.now() - new Date(lastSkip).getTime()) / 3_600_000;
    if (hours < SKIP_COOLDOWN_HOURS) {
      return {
        error: "You've already swapped a challenge for this hobby today.",
        retryAfterHours: Math.ceil(SKIP_COOLDOWN_HOURS - hours),
      };
    }
  }

  const { error: skipError } = await supabase
    .from("user_challenges")
    .update({ status: "skipped", skipped_at: new Date().toISOString() })
    .eq("id", userChallengeId)
    .eq("user_id", user.id);

  if (skipError) return { error: skipError.message };

  const result = await triggerChallengeGeneration(hobbySlug);

  if (!result.job_id) {
    // Put it back rather than stranding the user with nothing.
    await supabase
      .from("user_challenges")
      .update({ status: "active", skipped_at: null })
      .eq("id", userChallengeId)
      .eq("user_id", user.id);
    return { error: result.error ?? "Could not generate a replacement." };
  }

  return { job_id: result.job_id };
}
