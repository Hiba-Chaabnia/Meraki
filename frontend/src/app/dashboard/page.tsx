"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SessionLoggerModal,
  AddHobbyModal,
  HeroBanner,
  TodaysFocus,
  RoadmapCard,
  ActivityTimeline,
} from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { useUser } from "@/lib/hooks/useUser";
import { getUserStats } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions, createSession } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { triggerPracticeFeedback } from "@/app/actions/feedback";
import { triggerChallengeGeneration, pollChallengeGenStatus } from "@/app/actions/challenges";
import { getActiveNudge, triggerMotivationCheck, type NudgeData } from "@/app/actions/nudges";
import { getUserRoadmaps } from "@/app/actions/roadmap";
import { checkAndAwardMilestones } from "@/app/actions/milestones";
import { toUserStats, toActiveHobby, toPracticeSession, toChallenge, toRoadmap } from "@/lib/transformData";
import { moodEmojis } from "@/lib/dashboardData";
import { Plus } from "lucide-react";
import type { UserStats, ActiveHobby, PracticeSession, Challenge, Roadmap, ActivityItem } from "@/lib/dashboardData";

function buildActivityItems(sessions: PracticeSession[], challenges: Challenge[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const s of sessions) {
    const mood = moodEmojis[s.mood];
    items.push({
      id: s.id,
      type: "session",
      title: s.hobbyName,
      subtitle: s.notes || `${s.duration} min practice`,
      date: s.date,
      color: s.hobbyColor,
      icon: mood?.emoji ?? "",
      href: `/dashboard/sessions/${s.id}`,
    });
  }

  for (const c of challenges.filter((ch) => ch.completedDate)) {
    items.push({
      id: c.id,
      type: "challenge",
      title: c.title,
      subtitle: c.hobbyName,
      date: c.completedDate!,
      color: c.hobbyColor,
      icon: "\u2714\uFE0F",
      href: `/dashboard/challenges/${c.id}`,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, 5);
}

export default function DashboardPage() {
  const { profile } = useUser();
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [addHobbyOpen, setAddHobbyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [generatingChallenge, setGeneratingChallenge] = useState(false);

  const handleGenerateChallenge = async () => {
    if (hobbies.length === 0 || generatingChallenge) return;
    setGeneratingChallenge(true);
    const slug = hobbies[0].slug;
    const { job_id, error } = await triggerChallengeGeneration(slug);
    if (error || !job_id) {
      setGeneratingChallenge(false);
      return;
    }
    const poll = setInterval(async () => {
      const status = await pollChallengeGenStatus(job_id);
      if (status.status === "completed" || status.status === "failed") {
        clearInterval(poll);
        setGeneratingChallenge(false);
        fetchData();
      }
    }, 2500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, hobbiesRes, sessionsRes, challengesRes, nudgeRes, roadmapsRes] = await Promise.all([
        getUserStats(),
        getUserHobbies(),
        getSessions(),
        getUserChallenges(),
        getActiveNudge(),
        getUserRoadmaps(),
      ]);
      if (statsRes.data) setStats(toUserStats(statsRes.data));

      const activeHobbies = hobbiesRes.data
        ? hobbiesRes.data.filter((h: any) => h.status === "active" || h.status === "paused").map(toActiveHobby)
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
        if (actives.length > 0 && sessionsRes.data && sessionsRes.data.length > 0) {
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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  const displayStats = stats ?? { currentStreak: 0, longestStreak: 0, totalSessions: 0, totalHours: 0, challengesCompleted: 0, hobbiesExplored: 0, daysSinceJoining: 0 };
  const displayName = profile?.full_name || "Creative";
  const activeChallenges = challenges.filter((c) => c.status === "active" || c.status === "upcoming");
  const primaryRoadmap = roadmaps.length > 0 ? roadmaps[0] : null;
  const activityItems = buildActivityItems(sessions, challenges);

  const handleSaveSession = async (data: SessionFormData) => {
    const hobby = hobbies.find((h) => h.slug === data.hobbySlug);
    if (!hobby) return;
    const result = await createSession({
      userHobbyId: hobby.userHobbyId,
      sessionType: data.type,
      duration: data.duration,
      notes: data.notes,
      imageUrl: data.imageUrl,
    });
    if (result.data?.id) {
      triggerPracticeFeedback(result.data.id).catch((e) =>
        console.error("[Dashboard] Failed to trigger feedback:", e)
      );
    }
    checkAndAwardMilestones().catch((e) =>
      console.error("[Dashboard] Milestone check failed:", e)
    );
    fetchData();
  };

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveSession}
        hobbies={hobbies}
        activeChallenges={challenges}
      />
      <AddHobbyModal
        isOpen={addHobbyOpen}
        onClose={() => setAddHobbyOpen(false)}
        onAdded={fetchData}
      />

      <div className="min-h-screen bg-[var(--background)]">
        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-12 space-y-8">
          {/* Hero Banner */}
          <HeroBanner
            displayName={displayName}
            stats={displayStats}
            onLogPractice={() => setLoggerOpen(true)}
          />

          {/* Today's Focus */}
          <section>
            <TodaysFocus
              hobbies={hobbies}
              activeChallenges={activeChallenges}
              nudge={nudge}
              roadmap={primaryRoadmap}
              onGenerateChallenge={handleGenerateChallenge}
              generatingChallenge={generatingChallenge}
              onDismissNudge={() => setNudge(null)}
            />
          </section>

          {/* Two columns: Hobbies + Roadmap */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Hobbies */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border-2 border-[var(--primary)] shadow-sm p-6"
            >
              <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
                My Hobbies
              </h2>
              {hobbies.length > 0 ? (
                <div className="space-y-3">
                  {hobbies.map((h) => (
                    <Link key={h.slug} href={`/dashboard/hobby/${h.slug}`} className="flex items-center gap-3 group">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: h.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{h.name}</p>
                        <p className="text-xs text-gray-400">
                          {h.totalSessions} sessions
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.status === "active"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-50 text-gray-400"
                          }`}
                      >
                        {h.status === "active" ? "Active" : "Paused"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-2">No hobbies yet</p>
                  <Link href="/discover" className="text-sm text-[var(--secondary)] font-medium hover:underline">
                    Explore hobbies &rarr;
                  </Link>
                </div>
              )}
              <button
                onClick={() => setAddHobbyOpen(true)}
                className="mt-4 flex items-center gap-2 text-sm text-[var(--secondary)] font-medium hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add a Hobby
              </button>
            </motion.div>

            {/* Roadmap */}
            {primaryRoadmap ? (
              <RoadmapCard roadmap={primaryRoadmap} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border-2 border-[var(--secondary)] shadow-sm p-6 flex flex-col items-center justify-center text-center"
              >
                <h2 className="font-serif text-lg font-semibold text-gray-800 mb-2">
                  My Roadmap
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  {hobbies.length > 0
                    ? "Generate a learning roadmap from your hobby page."
                    : "Add a hobby first to create a roadmap."}
                </p>
                {hobbies.length > 0 && (
                  <Link
                    href={`/dashboard/hobby/${hobbies[0].slug}`}
                    className="text-sm text-[var(--secondary)] font-medium hover:underline"
                  >
                    Go to hobby &rarr;
                  </Link>
                )}
              </motion.div>
            )}
          </section>

          {/* Recent Activity */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
                Recent Activity
              </h2>
              <ActivityTimeline items={activityItems} />
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}
