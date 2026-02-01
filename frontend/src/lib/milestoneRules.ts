import type { UserStats } from "@/lib/dashboardData";

export interface MilestoneRule {
  slug: string;
  title: string;
  description: string;
  icon: string;
  check: (stats: UserStats) => boolean;
}

export const milestoneRules: MilestoneRule[] = [
  {
    slug: "first-steps",
    title: "First Steps",
    description: "Log your very first practice session",
    icon: "footprints",
    check: (s) => s.totalSessions >= 1,
  },
  {
    slug: "building-momentum",
    title: "Building Momentum",
    description: "Complete 7 practice sessions",
    icon: "fire",
    check: (s) => s.totalSessions >= 7,
  },
  {
    slug: "challenge-champion",
    title: "Challenge Champion",
    description: "Complete 5 creative challenges",
    icon: "trophy",
    check: (s) => s.challengesCompleted >= 5,
  },
  {
    slug: "explorer",
    title: "Explorer",
    description: "Try 3 different hobbies",
    icon: "compass",
    check: (s) => s.hobbiesExplored >= 3,
  },
  {
    slug: "dedicated-creator",
    title: "Dedicated Creator",
    description: "Accumulate 10 hours of practice",
    icon: "clock",
    check: (s) => s.totalHours >= 10,
  },
  {
    slug: "consistency-king",
    title: "Consistency Legend",
    description: "Maintain a 30-day practice streak",
    icon: "crown",
    check: (s) => s.longestStreak >= 30,
  },
  {
    slug: "month-one",
    title: "Month One",
    description: "Be on your creative journey for 30 days",
    icon: "calendar",
    check: (s) => s.daysSinceJoining >= 30,
  },
];
