"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StreakDisplay, ChallengeCard, MotivationNudge, SessionLoggerModal, StuckHelper } from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { useUser } from "@/lib/hooks/useUser";
import { getUserStats } from "@/app/actions/stats";
import { getStreakDays } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions, createSession } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { toUserStats, toActiveHobby, toPracticeSession, toChallenge } from "@/lib/transformData";
import {
  moodEmojis,
  getGreeting,
  getNudge,
} from "@/lib/dashboardData";
import { Plus, ArrowRight, Flame } from "lucide-react";
import type { UserStats, ActiveHobby, PracticeSession, Challenge, StreakDay } from "@/lib/dashboardData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function DashboardPage() {
  const { profile } = useUser();
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [streak, setStreak] = useState<StreakDay[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, hobbiesRes, sessionsRes, challengesRes, streakRes] = await Promise.all([
        getUserStats(),
        getUserHobbies(),
        getSessions(),
        getUserChallenges(),
        getStreakDays(),
      ]);
      if (statsRes.data) setStats(toUserStats(statsRes.data));
      if (hobbiesRes.data) setHobbies(hobbiesRes.data.filter((h: any) => h.status === "active" || h.status === "paused").map(toActiveHobby));
      if (sessionsRes.data) setSessions(sessionsRes.data.map(toPracticeSession));
      if (challengesRes.data) setChallenges(challengesRes.data.map(toChallenge));
      if (streakRes.data) setStreak(streakRes.data);
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  const displayStats = stats ?? { currentStreak: 0, longestStreak: 0, totalSessions: 0, totalHours: 0, challengesCompleted: 0, hobbiesExplored: 0, daysSinceJoining: 0 };
  const nudge = getNudge(displayStats);
  const recentSessions = sessions.slice(0, 3);
  const activeChallenges = challenges.filter((c) => c.status === "active" || c.status === "upcoming").slice(0, 2);
  const displayName = profile?.full_name || "Creative";

  const handleSaveSession = async (data: SessionFormData) => {
    const hobby = hobbies.find((h) => h.slug === data.hobbySlug);
    if (!hobby) return;
    await createSession({
      userHobbyId: hobby.userHobbyId,
      sessionType: data.type,
      duration: data.duration,
      mood: data.mood,
      notes: data.notes,
    });
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

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12"
      >
        {/* Greeting */}
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="!text-2xl md:!text-3xl mb-1">
              {getGreeting(displayName)}
            </h1>
            <p className="text-gray-500 text-sm">
              Day {displayStats.daysSinceJoining} of your creative journey
            </p>
          </div>
          <button
            onClick={() => setLoggerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-[var(--secondary)] hover:shadow-lg transition-all active:scale-[0.97] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Practice
          </button>
        </motion.div>

        {/* Nudge */}
        <motion.div variants={fadeUp} className="mb-8">
          <MotivationNudge nudge={nudge} />
        </motion.div>

        {/* Stuck Helper */}
        <motion.div variants={fadeUp} className="mb-8">
          <StuckHelper sessions={sessions} hobbies={hobbies} />
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Current Streak", value: `${displayStats.currentStreak} days`, icon: <Flame className="w-5 h-5 text-[var(--secondary)]" /> },
            { label: "Total Sessions", value: String(displayStats.totalSessions), icon: null },
            { label: "Hours Practiced", value: `${displayStats.totalHours}h`, icon: null },
            { label: "Challenges Done", value: String(displayStats.challengesCompleted), icon: null },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"
            >
              {stat.icon && <div className="flex justify-center mb-1">{stat.icon}</div>}
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Two-column: Streak + My Hobbies */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">
              This Week
            </h2>
            <StreakDisplay
              days={streak.length > 0 ? streak : ["none","none","none","none","none","none","none"]}
              currentStreak={displayStats.currentStreak}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">
              My Hobbies
            </h2>
            {hobbies.length > 0 ? (
              <div className="space-y-3">
                {hobbies.map((h) => (
                  <div key={h.slug} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: h.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{h.name}</p>
                      <p className="text-xs text-gray-400">
                        {h.totalSessions} sessions &middot; {h.currentStreak} day streak
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        h.status === "active"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {h.status === "active" ? "Active" : "Paused"}
                    </span>
                  </div>
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
          </div>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800">
              Recent Sessions
            </h2>
            <Link
              href="/dashboard/sessions"
              className="text-sm text-[var(--secondary)] font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <Link key={s.id} href={`/dashboard/sessions/${s.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: s.hobbyColor + "20" }}
                    >
                      {moodEmojis[s.mood]?.emoji ?? ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{s.hobbyName}</p>
                      <p className="text-xs text-gray-400 truncate">{s.notes}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-600">{s.duration} min</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-sm text-gray-400">No sessions yet. Log your first practice!</p>
            </div>
          )}
        </motion.div>

        {/* Active Challenges */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800">
              Your Challenges
            </h2>
            <Link
              href="/dashboard/challenges"
              className="text-sm text-[var(--secondary)] font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {activeChallenges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeChallenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-sm text-gray-400">No challenges yet. They will appear as you progress!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
