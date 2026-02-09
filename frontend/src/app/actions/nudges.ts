"use server";

import { createClient } from "@/lib/supabase/server";

const API_URL = process.env.CREWAI_API_URL || "http://localhost:8000";

export interface NudgeData {
  id: string;
  nudge_type: string;
  message: string;
  suggested_action: string;
  action_data: string;
  urgency: "gentle" | "check_in" | "re_engage";
}

export async function getActiveNudge(): Promise<{
  data?: NudgeData;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // nudges table is new — not in generated types yet, cast to any
  const { data, error } = await (supabase as any)
    .from("nudges")
    .select("id, nudge_type, message, suggested_action, action_data, urgency")
    .eq("user_id", user.id)
    .eq("acted_on", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return {};
  return { data: data as NudgeData };
}

export async function dismissNudge(nudgeId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase as any)
    .from("nudges")
    .update({ acted_on: true })
    .eq("id", nudgeId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function triggerMotivationCheck(
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

  // Gather engagement signals
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("created_at, mood")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const sessionList = sessions ?? [];
  let daysSinceLastSession = 999;
  if (sessionList.length > 0) {
    const lastDate = new Date(sessionList[0].created_at);
    daysSinceLastSession = Math.floor(
      (Date.now() - lastDate.getTime()) / 86_400_000
    );
  }

  const recentMoods = sessionList
    .slice(0, 5)
    .map((s) => s.mood ?? "okay")
    .join(", ");

  // Challenge skip rate
  const { data: challenges } = await supabase
    .from("user_challenges")
    .select("status")
    .eq("user_id", user.id);

  const total = (challenges ?? []).length;
  const skipped = (challenges ?? []).filter((c: any) => c.status === "skipped").length;
  const skipRate = total > 0 ? skipped / total : 0;

  try {
    const response = await fetch(`${API_URL}/motivation/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        hobby_name: hobbyName,
        hobby_slug: hobbySlug,
        days_since_last_session: daysSinceLastSession,
        recent_moods: recentMoods || "No data",
        challenge_skip_rate: skipRate,
        current_streak: 0,
        longest_streak: 0,
        session_frequency_trend: "unknown",
      }),
    });

    if (!response.ok) return { error: `API error: ${response.status}` };
    const data = await response.json();
    return { job_id: data.job_id };
  } catch (e) {
    return { error: `Failed to connect to motivation API: ${e}` };
  }
}
