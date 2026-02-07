"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StreakDisplay } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getUserStats, getStreakDays, getUserMilestones } from "@/app/actions/stats";
import { getSessions } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { toUserStats, toPracticeSession, toChallenge, toMilestone } from "@/lib/transformData";
import { moodEmojis } from "@/lib/dashboardData";
import type { UserStats, PracticeSession, Challenge, Milestone, Mood, StreakDay } from "@/lib/dashboardData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const tabDefs = [
  { key: "overview", label: "Overview" },
  { key: "wins", label: "Your Wins" },
  { key: "reflections", label: "Reflections" },
] as const;
type TabKey = (typeof tabDefs)[number]["key"];

const quotes = [
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Creativity takes courage.", author: "Henri Matisse" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
];

export default function MotivationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streak, setStreak] = useState<StreakDay[]>([]);

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, sessionsRes, challengesRes, milestonesRes, streakRes] = await Promise.all([
          getUserStats(), getSessions(), getUserChallenges(), getUserMilestones(), getStreakDays(),
        ]);
        if (statsRes.data) setStats(toUserStats(statsRes.data));
        if (sessionsRes.data) setSessions(sessionsRes.data.map(toPracticeSession));
        if (challengesRes.data) setChallenges(challengesRes.data.map(toChallenge));
        if (milestonesRes.data) setMilestones(milestonesRes.data.map(toMilestone));
        if (streakRes.data) setStreak(streakRes.data);
      } catch (e) { console.error("Failed to load motivation:", e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <PageSkeleton />;

  const displayStats = stats ?? { currentStreak: 0, longestStreak: 0, totalSessions: 0, totalHours: 0, challengesCompleted: 0, hobbiesExplored: 0, daysSinceJoining: 0 };
  const completedChallenges = challenges.filter((c) => c.status === "completed");
  const earnedMilestones = milestones.filter((m) => m.earned);

  const moodCounts: Record<Mood, number> = { loved: 0, good: 0, okay: 0, frustrated: 0, discouraged: 0 };
  sessions.forEach((s) => { if (s.mood && moodCounts[s.mood] !== undefined) moodCounts[s.mood]++; });
  const totalMoods = sessions.length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="!text-2xl md:!text-3xl mb-1">Motivation Center</h1>
        <p className="text-gray-500 text-sm">Celebrate your progress and stay inspired</p>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-gradient-to-br from-[var(--secondary-light)] to-[#FFF9F5] rounded-2xl p-6 mb-8">
        <p className="text-lg text-gray-700 italic mb-2">&ldquo;{randomQuote.text}&rdquo;</p>
        <p className="text-sm text-gray-500">&mdash; {randomQuote.author}</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2 mb-6">
        {tabDefs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key ? "bg-[var(--secondary)] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">Your Streak</h2>
              <StreakDisplay days={streak.length > 0 ? streak : ["none","none","none","none","none","none","none"]} currentStreak={displayStats.currentStreak} />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">Longest streak: <span className="font-bold text-gray-700">{displayStats.longestStreak} days</span></p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{displayStats.totalSessions}</p>
                <p className="text-xs text-gray-400">Sessions</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{displayStats.totalHours}h</p>
                <p className="text-xs text-gray-400">Practiced</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{displayStats.challengesCompleted}</p>
                <p className="text-xs text-gray-400">Challenges</p>
              </div>
            </div>
            <div className="text-center">
              <Link href="/dashboard/sessions" className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--secondary)] hover:shadow-lg transition-all">
                Log Today&apos;s Practice
              </Link>
            </div>
          </motion.div>
        )}

        {activeTab === "wins" && (
          <motion.div key="wins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div>
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">Milestones Earned ({earnedMilestones.length})</h2>
              {earnedMilestones.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {earnedMilestones.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                      <span className="text-3xl block mb-2">{m.icon}</span>
                      <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No milestones earned yet. Keep going!</p>
              )}
            </div>
            <div>
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">Challenges Conquered ({completedChallenges.length})</h2>
              {completedChallenges.length > 0 ? (
                <div className="space-y-3">
                  {completedChallenges.map((c) => (
                    <Link key={c.id} href={`/dashboard/challenges/${c.id}`}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.hobbyColor + "20" }}>
                          <svg className="w-5 h-5" style={{ color: c.hobbyColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{c.title}</p>
                          <p className="text-xs text-gray-400">{c.hobbyName}</p>
                        </div>
                        {c.completedDate && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(c.completedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No challenges completed yet.</p>
              )}
            </div>
            <div>
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">AI Celebrations</h2>
              {sessions.filter((s) => s.aiFeedback?.celebration).length > 0 ? (
                <div className="space-y-3">
                  {sessions.filter((s) => s.aiFeedback?.celebration).slice(0, 3).map((s) => (
                    <div key={s.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{moodEmojis[s.mood]?.emoji}</span>
                        <span className="text-xs text-gray-400">{s.hobbyName} &middot; {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <p className="text-sm text-gray-600 italic">&ldquo;{s.aiFeedback!.celebration}&rdquo;</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">AI celebrations will appear after your sessions are reviewed.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "reflections" && (
          <motion.div key="reflections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">How You&apos;ve Been Feeling</h2>
              {totalMoods > 0 ? (
                <div className="space-y-3">
                  {(Object.entries(moodCounts) as [Mood, number][]).filter(([, count]) => count > 0).sort(([, a], [, b]) => b - a).map(([mood, count]) => {
                    const pct = Math.round((count / totalMoods) * 100);
                    const { emoji, label } = moodEmojis[mood];
                    return (
                      <div key={mood}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{emoji} {label}</span>
                          <span className="text-xs text-gray-400">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-[var(--secondary)]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No mood data yet. Log sessions to see your mood trends!</p>
              )}
            </div>

            <div>
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">Recent Session Notes</h2>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 4).map((s) => (
                    <Link key={s.id} href={`/dashboard/sessions/${s.id}`}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{moodEmojis[s.mood]?.emoji}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.hobbyColor + "20", color: s.hobbyColor }}>
                            {s.hobbyName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{s.notes}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No sessions yet.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">Growth Highlights</h2>
              {sessions.filter((s) => s.aiFeedback?.growth && s.aiFeedback.growth.length > 0).length > 0 ? (
                <div className="space-y-3">
                  {sessions.filter((s) => s.aiFeedback?.growth && s.aiFeedback.growth.length > 0).slice(0, 3).flatMap((s) =>
                    s.aiFeedback!.growth.map((g, i) => (
                      <div key={`${s.id}-${i}`} className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-400 mt-1 flex-shrink-0">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                          </svg>
                        </span>
                        {g}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Growth insights will appear after AI reviews your sessions.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
