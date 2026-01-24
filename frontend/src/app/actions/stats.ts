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

export async function getStreakDays() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get sessions from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("created_at, session_type")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  // Index sessions by date string for O(1) lookups
  const sessionsByDate = new Map<string, typeof data>();
  for (const s of data ?? []) {
    const dateStr = s.created_at.split("T")[0];
    const existing = sessionsByDate.get(dateStr);
    if (existing) {
      existing.push(s);
    } else {
      sessionsByDate.set(dateStr, [s]);
    }
  }

  // Build a 7-day array
  const days: ("practiced" | "thought" | "none")[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];

    const daySessions = sessionsByDate.get(dateStr) ?? [];

    if (daySessions.some((s) => s.session_type === "practice")) {
      days.push("practiced");
    } else if (daySessions.some((s) => s.session_type === "thought")) {
      days.push("thought");
    } else {
      days.push("none");
    }
  }

  return { data: days };
}

export async function getHeatmapData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get sessions from the last 12 weeks (84 days)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 83);

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("created_at, duration")
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  // Index sessions by date string for O(1) lookups
  const minutesByDate = new Map<string, number>();
  for (const s of data ?? []) {
    const dateStr = s.created_at.split("T")[0];
    minutesByDate.set(dateStr, (minutesByDate.get(dateStr) ?? 0) + s.duration);
  }

  // Build an 84-day heatmap array (0-3 intensity)
  const heatmap: (0 | 1 | 2 | 3)[] = [];
  for (let i = 0; i < 84; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (83 - i));
    const dateStr = date.toISOString().split("T")[0];

    const totalMinutes = minutesByDate.get(dateStr) ?? 0;

    if (totalMinutes === 0) heatmap.push(0);
    else if (totalMinutes < 30) heatmap.push(1);
    else if (totalMinutes < 60) heatmap.push(2);
    else heatmap.push(3);
  }

  return { data: heatmap };
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
