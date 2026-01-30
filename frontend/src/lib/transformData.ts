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

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a user_hobbies row to ActiveHobby */
export function toActiveHobby(row: any): ActiveHobby {
  const slug = row.hobby_slug ?? "";
  return {
    userHobbyId: row.id,
    slug,
    name: formatSlug(slug),
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
  const slug = userHobby.hobby_slug ?? "";

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

/** Map a user_challenges row (with joined challenges) to Challenge */
export function toChallenge(row: any): Challenge {
  const ch = row.challenges ?? {};
  const slug = ch.hobby_slug ?? "";

  return {
    id: row.id,
    hobbySlug: slug,
    hobbyName: formatSlug(slug),
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
export function toMilestone(row: any): Milestone {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    earned: !!row.earned,
    earnedDate: row.earnedDate ?? null,
  };
}

/** Map a user_roadmaps row (with joined roadmaps) to Roadmap */
export function toRoadmap(row: any): Roadmap {
  const roadmap = row.roadmaps ?? {};
  const hobbySlug = row.hobby_slug ?? "";

  return {
    id: roadmap.id ?? row.roadmap_id ?? "",
    hobbySlug,
    hobbyName: formatSlug(hobbySlug),
    title: roadmap.title ?? "",
    description: roadmap.description ?? "",
    phases: roadmap.phases ?? [],
    currentPhase: row.current_phase ?? 0,
    totalPhases: roadmap.total_phases ?? (roadmap.phases?.length ?? 0),
    userRoadmapId: row.id ?? "",
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
