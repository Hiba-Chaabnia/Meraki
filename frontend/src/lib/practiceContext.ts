import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type TypedSupabase = SupabaseClient<Database>;
type ChallengeJoin = { status: string; challenges: { title: string } | null };

export interface PracticeContext {
  sessionCount: number;
  avgDuration: number;
  daysActive: number;
  completedChallenges: string;
  skippedChallenges: string;
  moodDistribution: string;
  recentMoods: string;
}

export async function getPracticeContext(
  supabase: TypedSupabase,
  userId: string
): Promise<PracticeContext> {
  const [{ data: sessions }, { data: userChallenges }] = await Promise.all([
    supabase
      .from("practice_sessions")
      .select("duration, mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_challenges")
      .select("status, challenges(title)")
      .eq("user_id", userId),
  ]);

  const sessionList = sessions ?? [];
  const sessionCount = sessionList.length;
  const avgDuration =
    sessionCount > 0
      ? Math.round(sessionList.reduce((s, r) => s + (r.duration ?? 0), 0) / sessionCount)
      : 0;

  const uniqueDays = new Set(sessionList.map((s) => s.created_at?.split("T")[0]));
  const daysActive = uniqueDays.size;

  const moods: Record<string, number> = {};
  for (const s of sessionList) {
    if (s.mood) moods[s.mood] = (moods[s.mood] ?? 0) + 1;
  }
  const moodDistribution =
    Object.entries(moods).map(([k, v]) => `${k}: ${v}`).join(", ") || "No data";
  const recentMoods =
    sessionList.slice(0, 5).map((s) => s.mood ?? "okay").join(", ") || "No data";

  const challenges = (userChallenges as ChallengeJoin[]) ?? [];
  const completedChallenges =
    challenges
      .filter((c) => c.status === "completed")
      .map((c) => c.challenges?.title ?? "")
      .filter(Boolean)
      .join(", ") || "None";
  const skippedChallenges =
    challenges
      .filter((c) => c.status === "skipped")
      .map((c) => c.challenges?.title ?? "")
      .filter(Boolean)
      .join(", ") || "None";

  return {
    sessionCount,
    avgDuration,
    daysActive,
    completedChallenges,
    skippedChallenges,
    moodDistribution,
    recentMoods,
  };
}
