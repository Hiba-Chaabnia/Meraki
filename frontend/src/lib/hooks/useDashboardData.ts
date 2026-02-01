import { useState, useCallback } from "react";
import { getUserStats } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { getActiveNudge, triggerMotivationCheck, type NudgeData } from "@/app/actions/nudges";
import { getUserRoadmaps } from "@/app/actions/roadmap";
import { toUserStats, toActiveHobby, toPracticeSession, toChallenge, toRoadmap } from "@/lib/transformData";
import type { UserStats, ActiveHobby, PracticeSession, Challenge, Roadmap } from "@/lib/dashboardData";
import type { Database } from "@/types/database.types";

type UserHobbyRow = Database["public"]["Tables"]["user_hobbies"]["Row"];

export interface DashboardData {
  isLoading: boolean;
  stats: UserStats | null;
  hobbies: ActiveHobby[];
  sessions: PracticeSession[];
  challenges: Challenge[];
  nudge: NudgeData | null;
  roadmaps: Roadmap[];
  setNudge: (nudge: NudgeData | null) => void;
  fetchData: () => Promise<void>;
}

/**
 * Fire-and-forget motivation check.
 * Runs after data loads if there is no active nudge, the user has active hobbies,
 * and it has been ≥3 days since the last practice session.
 */
function maybeCheckMotivation(
  hobbies: ActiveHobby[],
  sessions: PracticeSession[],
): void {
  const activeHobby = hobbies.find((h) => h.status === "active");
  if (!activeHobby || sessions.length === 0) return;

  const daysSince = Math.floor(
    (Date.now() - new Date(sessions[0].date).getTime()) / 86_400_000,
  );
  if (daysSince >= 3) {
    triggerMotivationCheck(activeHobby.slug).catch((e) =>
      console.error("[Dashboard] Motivation check failed:", e),
    );
  }
}

export function useDashboardData(): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, hobbiesRes, sessionsRes, challengesRes, nudgeRes, roadmapsRes] =
        await Promise.all([
          getUserStats(),
          getUserHobbies(),
          getSessions(),
          getUserChallenges(),
          getActiveNudge(),
          getUserRoadmaps(),
        ]);

      if (statsRes.data) setStats(toUserStats(statsRes.data));

      const activeHobbies: ActiveHobby[] = hobbiesRes.data
        ? (hobbiesRes.data as UserHobbyRow[])
            .filter((h) => h.status === "active" || h.status === "paused")
            .sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1))
            .slice(0, 5)
            .map(toActiveHobby)
        : [];
      setHobbies(activeHobbies);

      const activeSessions = sessionsRes.data ? sessionsRes.data.map(toPracticeSession) : [];
      setSessions(activeSessions);

      if (challengesRes.data) setChallenges(challengesRes.data.map(toChallenge));
      if (nudgeRes.data) setNudge(nudgeRes.data);
      if (roadmapsRes.data) setRoadmaps(roadmapsRes.data.map(toRoadmap));

      // Background: trigger motivation check when no nudge is active
      if (!nudgeRes.data) {
        maybeCheckMotivation(activeHobbies, activeSessions);
      }
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, stats, hobbies, sessions, challenges, nudge, setNudge, roadmaps, fetchData };
}
