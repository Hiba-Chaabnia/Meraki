/* ═══════════════════════════════════════════════════════
   Dashboard types and utility functions.
   Placeholder data has been removed — pages now fetch from Supabase.
   ═══════════════════════════════════════════════════════ */

/* ─── User Stats ─── */
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalHours: number;
  challengesCompleted: number;
  hobbiesExplored: number;
  daysSinceJoining: number;
}

/* ─── Active Hobbies ─── */
export interface ActiveHobby {
  userHobbyId: string;
  slug: string;
  name: string;
  color: string;
  lightColor: string;
  status: "active" | "paused";
  currentStreak: number;
  totalSessions: number;
  daysSinceStart: number;
  lastSessionDaysAgo: number;
}

/* ─── Mood ─── */
export type Mood = "loved" | "good" | "okay" | "frustrated" | "discouraged";

export const moodEmojis: Record<Mood, { emoji: string; label: string }> = {
  loved: { emoji: "\ud83d\ude0d", label: "Loved it" },
  good: { emoji: "\ud83d\ude0a", label: "Good" },
  okay: { emoji: "\ud83d\ude10", label: "Okay" },
  frustrated: { emoji: "\ud83d\ude15", label: "Frustrated" },
  discouraged: { emoji: "\ud83d\ude2b", label: "Discouraged" },
};

/* ─── Practice Sessions ─── */
export interface PracticeSession {
  id: string;
  hobbySlug: string;
  hobbyName: string;
  hobbyColor: string;
  date: string;
  duration: number;
  mood: Mood;
  notes: string;
  hasImage: boolean;
  challengeId: string | null;
  aiFeedback: {
    observations: string[];
    growth: string[];
    suggestions: string[];
    celebration: string;
  } | null;
}

/* ─── Challenges ─── */
export type ChallengeStatus = "active" | "upcoming" | "completed" | "skipped";
export type ChallengeDifficulty = "easy" | "medium" | "hard" | "stretch";

export interface Challenge {
  id: string;
  hobbySlug: string;
  hobbyName: string;
  hobbyColor: string;
  title: string;
  description: string;
  whyThisChallenge: string;
  skills: string[];
  difficulty: ChallengeDifficulty;
  estimatedTime: string;
  status: ChallengeStatus;
  startedDate: string | null;
  completedDate: string | null;
  tips: string[];
  whatYoullLearn: string[];
}

export const difficultyConfig: Record<
  ChallengeDifficulty,
  { label: string; dots: number; color: string }
> = {
  easy: { label: "Easy", dots: 1, color: "#7BC47F" },
  medium: { label: "Medium", dots: 2, color: "#fdc740" },
  hard: { label: "Hard", dots: 3, color: "#FF9149" },
  stretch: { label: "Stretch", dots: 4, color: "#E87DA5" },
};

/* ─── Streak data ─── */
export type StreakDay = "practiced" | "thought" | "none";

/* ─── Milestones ─── */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  earnedDate: string | null;
  icon: string;
}

/* ─── Motivation nudge messages ─── */
export interface NudgeMessage {
  type: "streak" | "comeback" | "challenge" | "encouragement";
  message: string;
  action?: { label: string; href: string };
}

export function getNudge(stats: UserStats): NudgeMessage {
  if (stats.currentStreak >= 7) {
    return {
      type: "streak",
      message: `${stats.currentStreak} days and counting! You\u2019re building something real.`,
    };
  }
  if (stats.currentStreak >= 3) {
    return {
      type: "encouragement",
      message: "Every session is a win. Let\u2019s keep this momentum going!",
    };
  }
  return {
    type: "encouragement",
    message: "Ready to make something awesome today? Your creative space is waiting!",
    action: { label: "Log Practice", href: "/dashboard/sessions" },
  };
}

/* ─── Greeting based on time of day ─── */
export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 17) return `Hey there, ${name}!`;
  return `Evening, ${name}!`;
}
