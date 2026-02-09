"use server";

import { createClient } from "@/lib/supabase/server";

const API_URL = process.env.CREWAI_API_URL || "http://localhost:8000";

export async function triggerRoadmapGeneration(
  hobbySlug: string
): Promise<{ job_id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const hobbyName = hobbySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Gather practice stats
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("duration, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const sessionList = sessions ?? [];
  const sessionCount = sessionList.length;
  const avgDuration =
    sessionCount > 0
      ? Math.round(sessionList.reduce((s, r) => s + (r.duration ?? 0), 0) / sessionCount)
      : 0;

  const uniqueDays = new Set(sessionList.map((s) => s.created_at?.split("T")[0]));
  const daysActive = uniqueDays.size;

  // Completed challenges
  const { data: userChallenges } = await supabase
    .from("user_challenges")
    .select("status, challenges(title)")
    .eq("user_id", user.id)
    .eq("status", "completed");

  const completed = (userChallenges ?? [])
    .map((c: any) => c.challenges?.title ?? "")
    .filter(Boolean)
    .join(", ");

  try {
    const response = await fetch(`${API_URL}/roadmap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        hobby_name: hobbyName,
        hobby_slug: hobbySlug,
        session_count: sessionCount,
        avg_duration: avgDuration,
        days_active: daysActive,
        completed_challenges: completed || "None",
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
): Promise<{ status: string; result?: any; error?: string | null }> {
  try {
    const response = await fetch(`${API_URL}/roadmap/generate/${jobId}`);
    if (!response.ok) return { status: "failed", error: `API error: ${response.status}` };
    return await response.json();
  } catch (e) {
    return { status: "failed", error: `Poll failed: ${e}` };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: user_roadmaps and roadmaps tables are new (migration 008).
// Supabase generated types don't include them yet. Using `any` casts until types are regenerated.

export async function getUserRoadmap(hobbySlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await (supabase as any)
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await (supabase as any)
    .from("user_roadmaps")
    .select("*, roadmaps(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function advanceRoadmapPhase(userRoadmapId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get current phase
  const { data: current, error: getErr } = await (supabase as any)
    .from("user_roadmaps")
    .select("current_phase, roadmaps(total_phases)")
    .eq("id", userRoadmapId)
    .eq("user_id", user.id)
    .single();

  if (getErr || !current) return { error: "Roadmap not found" };

  const totalPhases = current.roadmaps?.total_phases ?? 0;
  const nextPhase = (current.current_phase ?? 0) + 1;
  if (nextPhase >= totalPhases) return { error: "Already at final phase" };

  const { data, error } = await (supabase as any)
    .from("user_roadmaps")
    .update({ current_phase: nextPhase, updated_at: new Date().toISOString() })
    .eq("id", userRoadmapId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}
