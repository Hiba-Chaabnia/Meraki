import type {
  ActiveHobby,
  PracticeSession,
  Challenge,
  Milestone,
  Mood,
  UserStats,
} from "@/lib/dashboardData";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a user_hobbies row (with joined hobbies) to ActiveHobby */
export function toActiveHobby(row: any): ActiveHobby {
  const hobby = row.hobbies ?? {};
  return {
    userHobbyId: row.id,
    slug: hobby.slug ?? "",
    name: hobby.name ?? "",
    color: hobby.color ?? "#888",
    lightColor: hobby.light_color ?? "#eee",
    status: row.status === "paused" ? "paused" : "active",
    currentStreak: 0,
    totalSessions: 0,
    daysSinceStart: Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(row.started_at).getTime()) / 86_400_000,
      ),
    ),
    lastSessionDaysAgo: 0,
  };
}

/** Map a practice_sessions row (with joins) to PracticeSession */
export function toPracticeSession(row: any): PracticeSession {
  const userHobby = row.user_hobbies ?? {};
  const hobby = userHobby.hobbies ?? {};
  const fb = Array.isArray(row.ai_feedback) ? row.ai_feedback[0] : row.ai_feedback;

  return {
    id: row.id,
    hobbySlug: hobby.slug ?? "",
    hobbyName: hobby.name ?? "",
    hobbyColor: hobby.color ?? "#888",
    date: row.created_at,
    duration: row.duration ?? 0,
    mood: (row.mood ?? "okay") as Mood,
    notes: row.notes ?? "",
    hasImage: !!row.image_url,
    challengeId: row.user_challenge_id ?? null,
    aiFeedback: fb
      ? {
          observations: fb.observations ?? [],
          growth: fb.growth ?? [],
          suggestions: fb.suggestions ?? [],
          celebration: fb.celebration ?? "",
        }
      : null,
  };
}

/** Map a user_challenges row (with joined challenges + hobbies) to Challenge */
export function toChallenge(row: any): Challenge {
  const ch = row.challenges ?? {};
  const hobby = ch.hobbies ?? {};

  return {
    id: row.id,
    hobbySlug: hobby.slug ?? "",
    hobbyName: hobby.name ?? "",
    hobbyColor: hobby.color ?? "#888",
    title: ch.title ?? "",
    description: ch.description ?? "",
    whyThisChallenge: ch.why_this_challenge ?? "",
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
export function toMilestone(row: any): Milestone {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    icon: row.icon ?? "",
    earned: !!row.earned,
    earnedDate: row.earnedDate ?? null,
  };
}

/** Map the get_user_stats RPC result to UserStats */
export function toUserStats(data: any): UserStats {
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
  const d = typeof data === "string" ? JSON.parse(data) : data;
  return {
    currentStreak: d.current_streak ?? d.currentStreak ?? 0,
    longestStreak: d.longest_streak ?? d.longestStreak ?? 0,
    totalSessions: d.total_sessions ?? d.totalSessions ?? 0,
    totalHours: d.total_hours ?? d.totalHours ?? 0,
    challengesCompleted: d.challenges_completed ?? d.challengesCompleted ?? 0,
    hobbiesExplored: d.hobbies_explored ?? d.hobbiesExplored ?? 0,
    daysSinceJoining: d.days_since_joining ?? d.daysSinceJoining ?? 0,
  };
}
