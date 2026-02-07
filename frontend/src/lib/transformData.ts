import type { Database } from "@/types/database.types";
import type {
  ActiveHobby,
  PracticeSession,
  Challenge,
  Milestone,
  Mood,
  UserStats,
  Roadmap,
} from "@/lib/dashboardData";
import { formatSlug } from "@/lib/hobbyData";

/* ─── DB row aliases ─────────────────────────────────────────────────────── */

type Tables = Database["public"]["Tables"];

type UserHobbyRow = Tables["user_hobbies"]["Row"];
type PracticeSessionRow = Tables["practice_sessions"]["Row"];
type ChallengesRow = Tables["challenges"]["Row"];
type UserChallengeRow = Tables["user_challenges"]["Row"];
type MilestoneRow = Tables["milestones"]["Row"];
type RoadmapRow = Tables["roadmaps"]["Row"];
type UserRoadmapRow = Tables["user_roadmaps"]["Row"];

/* ─── Join shapes returned by Supabase select queries ────────────────────── */

type SessionWithHobby = PracticeSessionRow & {
  user_hobbies: UserHobbyRow;
};

type UserChallengeWithChallenge = UserChallengeRow & {
  challenges: ChallengesRow;
};

type MilestoneWithEarned = MilestoneRow & {
  earned: boolean;
  earnedDate: string | null;
};

type UserRoadmapWithRoadmap = UserRoadmapRow & {
  roadmaps: RoadmapRow;
};

/** Shape of the get_user_stats RPC result (always snake_case from Postgres). */
type UserStatsRpc = {
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  total_hours: number;
  challenges_completed: number;
  hobbies_explored: number;
  days_since_joining: number;
};

/* ─── Mappers ────────────────────────────────────────────────────────────── */

/** Map a user_hobbies row to ActiveHobby */
export function toActiveHobby(row: UserHobbyRow): ActiveHobby {
  return {
    userHobbyId: row.id,
    slug: row.hobby_slug,
    // 005 lets a hobby be renamed without touching the slug it is joined by.
    name: row.custom_name?.trim() || formatSlug(row.hobby_slug),
    status: row.status === "paused" ? "paused" : "active",
    currentStreak: 0,
    totalSessions: 0,
    daysSinceStart: Math.max(
      1,
      Math.floor((Date.now() - new Date(row.started_at).getTime()) / 86_400_000),
    ),
    lastSessionDaysAgo: 0,
    pausedAt: row.paused_at ?? null,
  };
}

/** Map a practice_sessions row (with user_hobbies join) to PracticeSession */
export function toPracticeSession(row: SessionWithHobby): PracticeSession {
  const slug = row.user_hobbies.hobby_slug;
  return {
    id: row.id,
    hobbySlug: slug,
    hobbyName: formatSlug(slug),
    date: row.created_at,
    duration: row.duration ?? 0,
    mood: (row.mood ?? "okay") as Mood,
    notes: row.notes ?? "",
    challengeId: row.user_challenge_id ?? null,
    imageUrl: row.image_url ?? null,
  };
}

/** Map a user_challenges row (with challenges join) to Challenge */
export function toChallenge(row: UserChallengeWithChallenge): Challenge {
  const ch = row.challenges;
  return {
    id: row.id,
    hobbySlug: ch.hobby_slug,
    hobbyName: formatSlug(ch.hobby_slug),
    title: ch.title ?? "",
    description: ch.description ?? "",
    skills: ch.skills ?? [],
    difficulty: ch.difficulty ?? "easy",
    estimatedTime: ch.estimated_time ?? "",
    status: row.status ?? "upcoming",
    startedDate: row.started_at ?? null,
    completedDate: row.completed_at ?? null,
    tips: ch.tips ?? [],
    whatYoullLearn: ch.what_youll_learn ?? [],
  };
}

/** Map a milestones row (with earned info) to Milestone */
export function toMilestone(row: MilestoneWithEarned): Milestone {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    earned: !!row.earned,
    earnedDate: row.earnedDate ?? null,
  };
}

/* ─── Collection helpers ─────────────────────────────────────────────────── */

/** Filter raw user_hobbies data to active/paused and map to ActiveHobby[] */
export function toActiveHobbies(data: UserHobbyRow[] | null): ActiveHobby[] {
  return (data ?? [])
    .filter((h) => h.status === "active" || h.status === "paused")
    .map(toActiveHobby);
}

/** Filter sessions by hobby slug and map to PracticeSession[] */
export function toSessionsForHobby(
  data: SessionWithHobby[] | null,
  hobbySlug: string
): PracticeSession[] {
  return (data ?? [])
    .filter((s) => s.user_hobbies?.hobby_slug === hobbySlug)
    .map(toPracticeSession);
}

/** Filter challenges by hobby slug and map to Challenge[] */
export function toChallengesForHobby(
  data: UserChallengeWithChallenge[] | null,
  hobbySlug: string
): Challenge[] {
  return (data ?? [])
    .filter((c) => c.challenges.hobby_slug === hobbySlug)
    .map(toChallenge);
}

/** Map all user_roadmaps rows to Roadmap[] */
export function toRoadmaps(data: UserRoadmapWithRoadmap[] | null): Roadmap[] {
  return (data ?? []).map(toRoadmap);
}

/** Map a user_roadmaps row (with roadmaps join) to Roadmap */
export function toRoadmap(row: UserRoadmapWithRoadmap): Roadmap {
  const roadmap = row.roadmaps;
  return {
    id: roadmap.id ?? "",
    hobbySlug: row.hobby_slug,
    hobbyName: formatSlug(row.hobby_slug),
    title: roadmap.title ?? "",
    description: roadmap.description ?? "",
    phases: (roadmap.phases as unknown as Roadmap["phases"]) ?? [],
    currentPhase: row.current_phase ?? 0,
    totalPhases: roadmap.total_phases ?? 0,
    userRoadmapId: row.id,
    // jsonb comes back as unknown until migration 004 has been applied.
    completedGoals: Array.isArray(row.completed_goals) ? row.completed_goals : [],
  };
}

/** Map the get_user_stats RPC result to UserStats */
export function toUserStats(data: unknown): UserStats {
  if (!data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      totalHours: 0,
      challengesCompleted: 0,
      hobbiesExplored: 0,
      daysSinceJoining: 0,
    };
  }
  const d = (typeof data === "string" ? JSON.parse(data) : data) as UserStatsRpc;
  return {
    currentStreak:       d.current_streak       ?? 0,
    longestStreak:       d.longest_streak       ?? 0,
    totalSessions:       d.total_sessions       ?? 0,
    totalHours:          d.total_hours          ?? 0,
    challengesCompleted: d.challenges_completed ?? 0,
    hobbiesExplored:     d.hobbies_explored     ?? 0,
    daysSinceJoining:    d.days_since_joining   ?? 0,
  };
}
