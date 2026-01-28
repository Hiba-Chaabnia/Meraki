"use server";

import { requireAuth } from "@/lib/supabase/requireAuth";
import { formatSlug } from "@/lib/hobbyData";
import { API_URL } from "@/lib/config";

export async function getUserChallenges() {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_challenges")
    .select("*, challenges(*, hobbies(*))")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getChallengeById(id: string) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_challenges")
    .select("*, challenges(*, hobbies(*))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function completeChallenge(userChallengeId: string) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
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
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const hobbyName = formatSlug(hobbySlug);

  // Gather practice stats
  const { data: userHobby } = await supabase
    .from("user_hobbies")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  void userHobby;

  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("duration, mood, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const sessionList = sessions ?? [];
  const sessionCount = sessionList.length;
  const avgDuration =
    sessionCount > 0
      ? Math.round(sessionList.reduce((s, r) => s + (r.duration ?? 0), 0) / sessionCount)
      : 0;

  const moods: Record<string, number> = {};
  for (const s of sessionList) {
    if (s.mood) moods[s.mood] = (moods[s.mood] ?? 0) + 1;
  }
  const moodDistStr = Object.entries(moods)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const uniqueDays = new Set(sessionList.map((s) => s.created_at?.split("T")[0]));
  const daysActive = uniqueDays.size;

  const { data: userChallenges } = await supabase
    .from("user_challenges")
    .select("status, challenges(title)")
    .eq("user_id", user.id);

  const completed = (userChallenges ?? [])
    .filter((c: any) => c.status === "completed")
    .map((c: any) => c.challenges?.title ?? "")
    .filter(Boolean)
    .join(", ");

  const skipped = (userChallenges ?? [])
    .filter((c: any) => c.status === "skipped")
    .map((c: any) => c.challenges?.title ?? "")
    .filter(Boolean)
    .join(", ");

  const recentMoods = sessionList
    .slice(0, 5)
    .map((s) => s.mood ?? "okay")
    .join(", ");

  try {
    const response = await fetch(`${API_URL}/challenges/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        hobby_name: hobbyName,
        hobby_slug: hobbySlug,
        session_count: sessionCount,
        avg_duration: avgDuration,
        mood_distribution: moodDistStr || "No data",
        days_active: daysActive,
        completed_challenges: completed || "None",
        skipped_challenges: skipped || "None",
        recent_feedback: "None",
        last_mood_trend: recentMoods || "No data",
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
): Promise<{ status: string; result?: any; error?: string | null }> {
  try {
    const response = await fetch(`${API_URL}/challenges/generate/${jobId}`);
    if (!response.ok) return { status: "failed", error: `API error: ${response.status}` };
    return await response.json();
  } catch (e) {
    return { status: "failed", error: `Poll failed: ${e}` };
  }
}
