import { useState, useCallback } from "react";
import { getUserStats } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { getActiveNudge, triggerMotivationCheck, type NudgeData } from "@/app/actions/nudges";
import { getUserRoadmaps } from "@/app/actions/roadmap";
import { toUserStats, toActiveHobby, toPracticeSession, toChallenge, toRoadmap } from "@/lib/transformData";
import type { UserStats, ActiveHobby, PracticeSession, Challenge, Roadmap } from "@/lib/dashboardData";

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

      const activeHobbies = hobbiesRes.data
        ? hobbiesRes.data
            .filter((h: any) => h.status === "active" || h.status === "paused")
            .sort((a: any, b: any) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1))
            .slice(0, 5)
            .map(toActiveHobby)
        : [];
      setHobbies(activeHobbies);

      if (sessionsRes.data) setSessions(sessionsRes.data.map(toPracticeSession));
      if (challengesRes.data) setChallenges(challengesRes.data.map(toChallenge));
      if (nudgeRes.data) setNudge(nudgeRes.data);
      if (roadmapsRes.data && hobbiesRes.data) {
        setRoadmaps(roadmapsRes.data.map((r: any) => toRoadmap(r, hobbiesRes.data)));
      }

      // Background: trigger motivation check for inactive hobbies
      if (!nudgeRes.data && hobbiesRes.data) {
        const actives = hobbiesRes.data.filter((h: any) => h.status === "active");
        if (actives.length > 0 && sessionsRes.data?.length > 0) {
          const lastSession = sessionsRes.data[0];
          const daysSince = Math.floor(
            (Date.now() - new Date(lastSession.created_at).getTime()) / 86_400_000
          );
          if (daysSince >= 3) {
            const slug = actives[0].hobbies?.slug;
            if (slug) {
              triggerMotivationCheck(slug).catch((e) =>
                console.error("[Dashboard] Motivation check failed:", e)
              );
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, stats, hobbies, sessions, challenges, nudge, setNudge, roadmaps, fetchData };
}
