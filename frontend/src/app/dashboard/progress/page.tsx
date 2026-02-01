"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { SessionLoggerModal, LogPracticeFAB } from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { getUserStats, getHeatmapData, getUserMilestones } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions, createSession } from "@/app/actions/sessions";
import { triggerPracticeFeedback } from "@/app/actions/feedback";
import { checkAndAwardMilestones } from "@/app/actions/milestones";
import { toUserStats, toActiveHobby, toPracticeSession, toMilestone } from "@/lib/transformData";
import { milestoneRules } from "@/lib/milestoneRules";
import { moodEmojis } from "@/lib/dashboardData";
import type { UserStats, ActiveHobby, PracticeSession, Milestone } from "@/lib/dashboardData";

import { fadeUp, staggerContainer } from "@/components/ui/animations";

const stagger = staggerContainer(0.06);

const heatColors: Record<number, string> = {
  0: "#f3f4f6",
  1: "#FFECDB",
  2: "#FFB87A",
  3: "#FF9149",
};
const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];

function HeatmapGrid({ data }: { data: (0 | 1 | 2 | 3)[] }) {
  const weeks: (0 | 1 | 2 | 3)[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  return (
    <div className="flex gap-1">
      <div className="flex flex-col gap-1 mr-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="w-3 h-3 flex items-center justify-center">
            <span className="text-[8px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((val, di) => (
            <motion.div
              key={di}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (wi * 7 + di) * 0.005 }}
              className="w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: heatColors[val] }}
              title={`${val} session${val !== 1 ? "s" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [heatmap, setHeatmap] = useState<(0 | 1 | 2 | 3)[]>([]);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loggerOpen, setLoggerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, heatRes, hobbiesRes, sessionsRes, milestonesRes] = await Promise.all([
        getUserStats(), getHeatmapData(), getUserHobbies(), getSessions(), getUserMilestones(),
      ]);
      if (statsRes.data) setStats(toUserStats(statsRes.data));
      if (heatRes.data) setHeatmap(heatRes.data);
      if (hobbiesRes.data) setHobbies(hobbiesRes.data.filter((h: any) => h.status === "active" || h.status === "paused").map(toActiveHobby));
      if (sessionsRes.data) setSessions(sessionsRes.data.map(toPracticeSession));
      if (milestonesRes.data) setMilestones(milestonesRes.data.map(toMilestone));
    } catch (e) { console.error("Failed to load progress:", e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
        console.error("[Progress] Failed to trigger feedback:", e)
      );
    }
    checkAndAwardMilestones().catch((e) =>
      console.error("[Progress] Milestone check failed:", e)
    );
    fetchData();
  };

  if (isLoading) return <PageSkeleton />;

  const displayStats = stats ?? { currentStreak: 0, longestStreak: 0, totalSessions: 0, totalHours: 0, challengesCompleted: 0, hobbiesExplored: 0, daysSinceJoining: 0 };
  const earnedMilestones = milestones.filter((m) => m.earned);
  const unearnedMilestones = milestones.filter((m) => !m.earned);

  return (
    <>
    <SessionLoggerModal
      isOpen={loggerOpen}
      onClose={() => setLoggerOpen(false)}
      onSave={handleSaveSession}
      hobbies={hobbies}
    />
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Your Progress</h1>
          <p className="text-gray-500 text-sm">{displayStats.daysSinceJoining} days of creative exploration</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Sessions", value: String(displayStats.totalSessions) },
          { label: "Hours Practiced", value: `${displayStats.totalHours}h` },
          { label: "Current Streak", value: `${displayStats.currentStreak} days` },
          { label: "Longest Streak", value: `${displayStats.longestStreak} days` },
          { label: "Challenges Done", value: String(displayStats.challengesCompleted) },
          { label: "Hobbies Explored", value: String(displayStats.hobbiesExplored) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="card-heading mb-4">Practice Activity</h2>
        {heatmap.length > 0 ? (
          <>
            <div className="overflow-x-auto pb-2"><HeatmapGrid data={heatmap} /></div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-gray-400">Less</span>
              {[0, 1, 2, 3].map((v) => (
                <div key={v} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: heatColors[v] }} />
              ))}
              <span className="text-[10px] text-gray-400">More</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No activity data yet. Start practicing!</p>
        )}
      </motion.div>

      {hobbies.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="card-heading mb-4">Hobby Breakdown</h2>
          <div className="space-y-4">
            {hobbies.map((h) => {
              const pct = displayStats.totalSessions > 0 ? Math.round((h.totalSessions / displayStats.totalSessions) * 100) : 0;
              return (
                <div key={h.slug}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-700" />
                      <span className="text-sm font-medium text-gray-700">{h.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{h.totalSessions} sessions ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" as const }} className="h-full rounded-full bg-gray-700" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {sessions.length >= 2 && (() => {
        const firstSession = sessions[sessions.length - 1];
        const latestSession = sessions[0];
        return (
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="card-heading mb-5">Your Journey</h2>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Day 1</p>
                <span className="text-3xl block mb-2">{moodEmojis[firstSession.mood]?.emoji}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {firstSession.hobbyName}
                </span>
                <p className="text-xs text-gray-400 mt-2">{firstSession.duration} min</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{firstSession.notes}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-[var(--secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="text-[10px] text-gray-400">{displayStats.daysSinceJoining} days</span>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <p className="text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Now</p>
                <span className="text-3xl block mb-2">{moodEmojis[latestSession.mood]?.emoji}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {latestSession.hobbyName}
                </span>
                <p className="text-xs text-gray-400 mt-2">{latestSession.duration} min</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{latestSession.notes}</p>
              </div>
            </div>
          </motion.div>
        );
      })()}

      <motion.div variants={fadeUp} className="mb-8">
        <h2 className="card-heading mb-4">Milestones</h2>
        {earnedMilestones.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {earnedMilestones.map((m) => (
              <motion.div key={m.id} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <span className="text-3xl block mb-2">{milestoneRules.find((r) => r.slug === m.slug)?.icon ?? "🏅"}</span>
                <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>
                {m.earnedDate && (
                  <p className="text-[10px] text-green-500 mt-1 font-medium">
                    Earned {new Date(m.earnedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-6">No milestones earned yet. Keep practicing!</p>
        )}

        {unearnedMilestones.length > 0 && (
          <>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Up Next</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {unearnedMilestones.map((m) => (
                <motion.div key={m.id} variants={fadeUp} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center opacity-60">
                  <span className="text-3xl block mb-2 grayscale">{milestoneRules.find((r) => r.slug === m.slug)?.icon ?? "🏅"}</span>
                  <p className="text-sm font-semibold text-gray-500">{m.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Session Log */}
      {sessions.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="card-heading mb-4">Session Log</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {sessions.map((s) => (
              <Link key={s.id} href={`/dashboard/sessions/${s.id}`}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-gray-100"
                  >
                    {moodEmojis[s.mood]?.emoji ?? ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{s.hobbyName}</p>
                    <p className="text-xs text-gray-400 truncate">{s.notes || `${s.duration} min practice`}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">{s.duration} min</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
    <LogPracticeFAB onClick={() => setLoggerOpen(true)} />
    </>
  );
}
