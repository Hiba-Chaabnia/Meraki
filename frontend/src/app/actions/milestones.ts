"use server";

import { createClient } from "@/lib/supabase/server";
import { milestoneRules, type MilestoneStats } from "@/lib/milestoneRules";

export async function checkAndAwardMilestones(): Promise<{ awarded?: string[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch stats via RPC
  const { data: rawStats, error: statsErr } = await supabase.rpc("get_user_stats", {
    p_user_id: user.id,
  });
  if (statsErr) return { error: statsErr.message };

  const d = typeof rawStats === "string" ? JSON.parse(rawStats) : rawStats;
  const stats: MilestoneStats = {
    totalSessions: d?.total_sessions ?? d?.totalSessions ?? 0,
    currentStreak: d?.current_streak ?? d?.currentStreak ?? 0,
    longestStreak: d?.longest_streak ?? d?.longestStreak ?? 0,
    challengesCompleted: d?.challenges_completed ?? d?.challengesCompleted ?? 0,
    hobbiesExplored: d?.hobbies_explored ?? d?.hobbiesExplored ?? 0,
    totalHours: d?.total_hours ?? d?.totalHours ?? 0,
    daysSinceJoining: d?.days_since_joining ?? d?.daysSinceJoining ?? 0,
  };

  // Get all milestone definitions
  const { data: allMilestones, error: mErr } = await supabase
    .from("milestones")
    .select("id, slug");
  if (mErr) return { error: mErr.message };

  const slugToId: Record<string, string> = {};
  for (const m of allMilestones ?? []) {
    slugToId[m.slug] = m.id;
  }

  // Get already-earned milestones
  const { data: earned } = await supabase
    .from("user_milestones")
    .select("milestone_id")
    .eq("user_id", user.id);

  const earnedIds = new Set((earned ?? []).map((e) => e.milestone_id));

  // Check each rule
  const newlyAwarded: string[] = [];
  for (const rule of milestoneRules) {
    const milestoneId = slugToId[rule.slug];
    if (!milestoneId) continue;
    if (earnedIds.has(milestoneId)) continue;
    if (!rule.check(stats)) continue;

    // Award it
    const { error: insertErr } = await supabase.from("user_milestones").insert({
      user_id: user.id,
      milestone_id: milestoneId,
      earned_at: new Date().toISOString(),
    });

    if (!insertErr) {
      newlyAwarded.push(rule.title);
    }
  }

  return { awarded: newlyAwarded };
}
