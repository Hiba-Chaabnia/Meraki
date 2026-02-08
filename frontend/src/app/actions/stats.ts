"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUserStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.rpc("get_user_stats", {
    p_user_id: user.id,
  });

  if (error) return { error: error.message };
  return { data };
}

/**
 * Raw practice days for the heatmap — the last 14 weeks of sessions.
 *
 * Returns rows, not intensities: bucketing a timestamp into a day is a local
 * calendar question and this runs on the server, whose timezone is not the
 * viewer's. `buildHeatmap` does it client-side with the same `localDateKey`
 * that `deriveStreak` uses, so the two agree about what day a session was on.
 *
 * 14 weeks rather than the 12 rendered: the grid is aligned to whole Monday
 * weeks, so its first cell can sit up to six days before "12 weeks ago", and
 * the window has to cover them.
 */
export async function getHeatmapData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 14 * 7);

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("created_at, duration")
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  return {
    data: (data ?? []).map((s) => ({ date: s.created_at, duration: s.duration })),
  };
}


export async function getUserMilestones() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get all milestones with user's earned status
  const [allMilestones, userMilestones] = await Promise.all([
    supabase.from("milestones").select("*").order("created_at"),
    supabase
      .from("user_milestones")
      .select("*")
      .eq("user_id", user.id),
  ]);

  if (allMilestones.error) return { error: allMilestones.error.message };

  const earnedIds = new Set(
    (userMilestones.data ?? []).map((um) => um.milestone_id),
  );
  const earnedMap = new Map(
    (userMilestones.data ?? []).map((um) => [um.milestone_id, um.earned_at]),
  );

  const combined = (allMilestones.data ?? []).map((m) => ({
    ...m,
    earned: earnedIds.has(m.id),
    earnedDate: earnedMap.get(m.id) ?? null,
  }));

  return { data: combined };
}
