"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Flame, Map, Tv, MapPin, Zap } from "lucide-react";
import { ChallengeCard, SessionLoggerModal, LogPracticeFAB } from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions, createSession } from "@/app/actions/sessions";
import { getUserChallenges, triggerChallengeGeneration, pollChallengeGenStatus } from "@/app/actions/challenges";
import { getUserRoadmap, triggerRoadmapGeneration, pollRoadmapStatus } from "@/app/actions/roadmap";
import { triggerPracticeFeedback } from "@/app/actions/feedback";
import { checkAndAwardMilestones } from "@/app/actions/milestones";
import { toActiveHobbies, toSessionsForHobby, toChallengesForHobby, toRoadmap } from "@/lib/transformData";
import { formatSlug } from "@/lib/hobbyData";
import { moodEmojis } from "@/lib/dashboardData";
import type { ActiveHobby, PracticeSession, Challenge, Roadmap } from "@/lib/dashboardData";
import type { PracticeFeedback } from "@/app/actions/feedback";
import { getSessionFeedback } from "@/app/actions/feedback";
import { fadeUp, staggerContainer } from "@/components/ui/animations";

const stagger = staggerContainer(0.08);

export default function HobbyJourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const meta = { name: formatSlug(slug), color: "#374151", lightColor: "#F3F4F6" };

  const [hobby, setHobby] = useState<ActiveHobby | null>(null);
  const [allHobbies, setAllHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, PracticeFeedback>>({});
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingChallenge, setGeneratingChallenge] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [hobbiesRes, sessionsRes, challengesRes, roadmapRes] = await Promise.all([
        getUserHobbies(),
        getSessions(),
        getUserChallenges(),
        getUserRoadmap(slug),
      ]);

      const active = toActiveHobbies(hobbiesRes.data ?? null);
      setAllHobbies(active);
      const matched = active.find((h) => h.slug === slug);
      if (matched) setHobby(matched);

      if (sessionsRes.data) {
        const hobbySessions = toSessionsForHobby(sessionsRes.data, slug);
        setSessions(hobbySessions);

        const last3 = hobbySessions.slice(0, 3);
        const fbResults: Record<string, PracticeFeedback> = {};
        const feedbackResponses = await Promise.all(last3.map((s) => getSessionFeedback(s.id)));
        feedbackResponses.forEach((res, i) => {
          if (res.data) fbResults[last3[i].id] = res.data;
        });
        setFeedbackMap(fbResults);
      }

      setChallenges(toChallengesForHobby(challengesRes.data ?? null, slug));

      if (roadmapRes.data) setRoadmap(toRoadmap(roadmapRes.data));
    } catch (e) {
      console.error("Failed to load hobby page:", e);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  const totalMinutes = sessions.reduce((s, r) => s + r.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const activeChallenges = challenges.filter((c) => c.status === "active");
  const completedChallenges = challenges.filter((c) => c.status === "completed");
  const recentSessions = sessions.slice(0, 5);

  const handleSaveSession = async (data: SessionFormData) => {
    const h = allHobbies.find((h) => h.slug === data.hobbySlug);
    if (!h) return;
    const result = await createSession({
      userHobbyId: h.userHobbyId,
      sessionType: data.type,
      duration: data.duration,
      mood: data.mood,
      notes: data.notes,
      imageUrl: data.imageUrl,
    });
    if (result.data?.id) {
      triggerPracticeFeedback(result.data.id).catch((e) =>
        console.error("[HobbyPage] Failed to trigger feedback:", e)
      );
    }
    checkAndAwardMilestones().catch((e) =>
      console.error("[HobbyPage] Milestone check failed:", e)
    );
    fetchData();
  };

  const handleGenerateRoadmap = async () => {
    if (generatingRoadmap) return;
    setGeneratingRoadmap(true);
    const { job_id } = await triggerRoadmapGeneration(slug);
    if (!job_id) { setGeneratingRoadmap(false); return; }
    const poll = setInterval(async () => {
      const s = await pollRoadmapStatus(job_id);
      if (s.status === "completed" || s.status === "failed") {
        clearInterval(poll);
        setGeneratingRoadmap(false);
        fetchData();
      }
    }, 2500);
  };

  const handleGenerateChallenge = async () => {
    if (generatingChallenge) return;
    setGeneratingChallenge(true);
    const { job_id } = await triggerChallengeGeneration(slug);
    if (!job_id) { setGeneratingChallenge(false); return; }
    const poll = setInterval(async () => {
      const s = await pollChallengeGenStatus(job_id);
      if (s.status === "completed" || s.status === "failed") {
        clearInterval(poll);
        setGeneratingChallenge(false);
        fetchData();
      }
    }, 2500);
  };

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveSession}
        hobbies={allHobbies}
        activeChallenges={challenges}
        initialHobbySlug={slug}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Back link → Hobbies */}
        <motion.div variants={fadeUp} className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Hobbies
          </Link>
        </motion.div>

        {/* Hobby banner */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl overflow-hidden mb-8"
          style={{ backgroundColor: meta.lightColor }}
        >
          <div className="px-6 py-8 md:px-10 md:py-12 relative flex items-start justify-between gap-4">
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
              style={{ backgroundColor: meta.color }}
            />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-4xl font-medium text-gray-900 leading-tight mb-2">{meta.name}</h1>
              <p className="text-gray-600">
                {hobby?.status === "active" ? "Active" : "Paused"} &middot; Day {hobby?.daysSinceStart ?? 0} of your journey
              </p>
            </div>
            <Button
              onClick={() => setLoggerOpen(true)}
              variant="secondary"
              shape="pill"
              size="sm"
              className="relative z-10 flex-shrink-0 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Log Practice
            </Button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Sessions", value: String(sessions.length) },
            { label: "Hours", value: `${totalHours}h` },
            { label: "Streak", value: `${hobby?.currentStreak ?? 0}d`, icon: <Flame className="w-4 h-4 text-[var(--secondary)]" /> },
            { label: "Challenges", value: String(completedChallenges.length) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              {s.icon && <div className="flex justify-center mb-1">{s.icon}</div>}
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Current Challenge */}
        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="card-heading mb-4">Current Challenge</h2>
          {activeChallenges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">No active challenge</p>
              <button
                onClick={handleGenerateChallenge}
                disabled={generatingChallenge}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: meta.color }}
              >
                {generatingChallenge ? (
                  <><div className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />Generating...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" />Generate a Challenge</>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Learning Roadmap */}
        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="card-heading mb-4">Learning Roadmap</h2>
          {roadmap ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <Map className="w-5 h-5" style={{ color: meta.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{roadmap.title}</p>
                  <p className="text-xs text-gray-400">Phase {roadmap.currentPhase + 1} of {roadmap.totalPhases}</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100}%`, backgroundColor: meta.color }}
                />
              </div>
              {roadmap.phases[roadmap.currentPhase] && (
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-medium text-gray-600">{roadmap.phases[roadmap.currentPhase].title}</span>
                  {" — "}{roadmap.phases[roadmap.currentPhase].description}
                </p>
              )}
              <Link href={`/dashboard/roadmap/${roadmap.userRoadmapId}`} className="text-sm font-medium hover:underline" style={{ color: meta.color }}>
                View full roadmap &rarr;
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">No roadmap yet for {meta.name}</p>
              <button
                onClick={handleGenerateRoadmap}
                disabled={generatingRoadmap}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: meta.color }}
              >
                {generatingRoadmap ? (
                  <><div className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />Generating Roadmap...</>
                ) : (
                  <><Map className="w-3.5 h-3.5" />Generate Roadmap</>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Recent Sessions */}
        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="card-heading mb-4">Recent Sessions</h2>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const mood = moodEmojis[s.mood] ?? { emoji: "", label: "" };
                const fb = feedbackMap[s.id];
                return (
                  <Link key={s.id} href={`/dashboard/sessions/${s.id}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ backgroundColor: meta.color + "20" }}>
                          {mood.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-700">{s.duration} min</p>
                            <span className="text-xs text-gray-400">
                              {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{s.notes || "No notes"}</p>
                        </div>
                      </div>
                      {fb?.celebration && (
                        <p className="mt-2 text-xs italic pl-14" style={{ color: meta.color }}>{fb.celebration}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400">No sessions yet for {meta.name}.</p>
            </div>
          )}
        </motion.div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="card-heading mb-4">Completed Challenges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
            </div>
          </motion.div>
        )}

        {/* Go deeper */}
        <motion.div variants={fadeUp}>
          <h2 className="card-heading mb-4">Go deeper with {meta.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href={`/discover/sampling/${slug}/watch`} className="group">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.color + "15" }}>
                  <Tv className="w-5 h-5" style={{ color: meta.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Watch</p>
                  <p className="text-xs text-gray-400">Videos &amp; tutorials</p>
                </div>
              </div>
            </Link>
            <Link href={`/discover/sampling/${slug}/micro`} className="group">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.color + "15" }}>
                  <Zap className="w-5 h-5" style={{ color: meta.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Micro</p>
                  <p className="text-xs text-gray-400">Quick exercises</p>
                </div>
              </div>
            </Link>
            <Link href={`/discover/sampling/${slug}/local`} className="group">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.color + "15" }}>
                  <MapPin className="w-5 h-5" style={{ color: meta.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Local</p>
                  <p className="text-xs text-gray-400">Venues near you</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating log button */}
      <LogPracticeFAB onClick={() => setLoggerOpen(true)} />
    </>
  );
}
