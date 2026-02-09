export interface MilestoneRule {
  slug: string;
  title: string;
  description: string;
  icon: string;
  check: (stats: MilestoneStats) => boolean;
}

export interface MilestoneStats {
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  challengesCompleted: number;
  hobbiesExplored: number;
  totalHours: number;
  daysSinceJoining: number;
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
    description: "Maintain a 7-day practice streak",
    icon: "fire",
    check: (s) => s.longestStreak >= 7,
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
    title: "Consistency King",
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
