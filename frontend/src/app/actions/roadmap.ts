"use server";

import { requireAuth } from "@/lib/supabase/requireAuth";
import { formatSlug } from "@/lib/hobbyData";
import { SERVER_API_URL } from "@/lib/config";
import { getPracticeContext } from "@/lib/practiceContext";

export async function triggerRoadmapGeneration(
  hobbySlug: string
): Promise<{ job_id?: string; error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const hobbyName = formatSlug(hobbySlug);
  const ctx = await getPracticeContext(supabase, user.id);

  try {
    const response = await fetch(`${SERVER_API_URL}/roadmap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        hobby_name: hobbyName,
        hobby_slug: hobbySlug,
        session_count: ctx.sessionCount,
        avg_duration: ctx.avgDuration,
        days_active: ctx.daysActive,
        completed_challenges: ctx.completedChallenges,
        user_goals: "None",
      }),
    });

    if (!response.ok) return { error: `API error: ${response.status}` };
    const data = await response.json();
    return { job_id: data.job_id };
  } catch (e) {
    return { error: `Failed to connect to roadmap API: ${e}` };
  }
}

export async function pollRoadmapStatus(
  jobId: string
): Promise<{ status: string; result?: unknown; error?: string | null }> {
  try {
    const response = await fetch(`${SERVER_API_URL}/roadmap/generate/${jobId}`);
    if (!response.ok) return { status: "failed", error: `API error: ${response.status}` };
    return await response.json();
  } catch (e) {
    return { status: "failed", error: `Poll failed: ${e}` };
  }
}

export async function getUserRoadmap(hobbySlug: string) {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_roadmaps")
    .select("*, roadmaps(*)")
    .eq("user_id", user.id)
    .eq("hobby_slug", hobbySlug)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  return { data };
}

export async function getUserRoadmaps() {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_roadmaps")
    .select("*, roadmaps(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function advanceRoadmapPhase(userRoadmapId: string) {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data: current, error: getErr } = await supabase
    .from("user_roadmaps")
    .select("current_phase, roadmaps(total_phases)")
    .eq("id", userRoadmapId)
    .eq("user_id", user.id)
    .single();

  if (getErr || !current) return { error: "Roadmap not found" };

  type RoadmapPhaseJoin = { current_phase: number; roadmaps: { total_phases: number } | null };
  const typedCurrent = current as unknown as RoadmapPhaseJoin;
  const totalPhases = typedCurrent.roadmaps?.total_phases ?? 0;
  const nextPhase = typedCurrent.current_phase + 1;
  if (nextPhase >= totalPhases) return { error: "Already at final phase" };

  const { data, error } = await supabase
    .from("user_roadmaps")
    .update({ current_phase: nextPhase, updated_at: new Date().toISOString() })
    .eq("id", userRoadmapId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

/**
 * Tick or untick one checklist item on a roadmap stage.
 *
 * `goalKey` comes from `roadmapGoalKey(phaseNumber, goalIndex)`. Read-then-write
 * rather than a JSONB operator so the toggle stays one round trip of plain SQL;
 * the row is per-user and only that user's own UI writes it, so the race window
 * is a user double-clicking their own checkbox.
 */
export async function toggleRoadmapGoal(userRoadmapId: string, goalKey: string) {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data: current, error: getErr } = await supabase
    .from("user_roadmaps")
    .select("completed_goals")
    .eq("id", userRoadmapId)
    .eq("user_id", user.id)
    .single();

  if (getErr || !current) return { error: "Roadmap not found" };

  const existing: string[] = Array.isArray(current.completed_goals)
    ? current.completed_goals
    : [];
  const next = existing.includes(goalKey)
    ? existing.filter((k) => k !== goalKey)
    : [...existing, goalKey];

  const { error } = await supabase
    .from("user_roadmaps")
    .update({ completed_goals: next, updated_at: new Date().toISOString() })
    .eq("id", userRoadmapId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { data: next };
}
