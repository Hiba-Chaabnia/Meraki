"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getUserRoadmaps, advanceRoadmapPhase } from "@/app/actions/roadmap";
import { getUserHobbies } from "@/app/actions/hobbies";
import { toRoadmap } from "@/lib/transformData";
import type { Roadmap } from "@/lib/dashboardData";
import { ArrowLeft, Check, ChevronRight, Target } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const fetchRoadmap = async () => {
    try {
      const [roadmapsRes, hobbiesRes] = await Promise.all([
        getUserRoadmaps(),
        getUserHobbies(),
      ]);
      if (roadmapsRes.data && hobbiesRes.data) {
        const all = roadmapsRes.data.map((r: any) => toRoadmap(r, hobbiesRes.data));
        const found = all.find((r: Roadmap) => r.userRoadmapId === id);
        if (found) setRoadmap(found);
      }
    } catch (e) {
      console.error("Failed to load roadmap:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoadmap(); }, [id]);

  const handleAdvance = async () => {
    if (!roadmap || advancing) return;
    setAdvancing(true);
    const res = await advanceRoadmapPhase(roadmap.userRoadmapId);
    if (!res.error) {
      setRoadmap({ ...roadmap, currentPhase: roadmap.currentPhase + 1 });
    }
    setAdvancing(false);
  };

  if (isLoading) return <PageSkeleton />;

  if (!roadmap) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Roadmap not found.</p>
        <Link href="/dashboard" className="text-sm text-[var(--secondary)] mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const currentPhaseData = roadmap.phases[roadmap.currentPhase];
  const isLastPhase = roadmap.currentPhase >= roadmap.totalPhases - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: roadmap.hobbyColor + "25", color: roadmap.hobbyColor }}
          >
            {roadmap.hobbyName}
          </span>
        </div>
        <h1 className="!text-2xl md:!text-3xl font-serif mb-2">{roadmap.title}</h1>
        <p className="text-sm text-gray-500">{roadmap.description}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Phase {roadmap.currentPhase + 1} of {roadmap.totalPhases}</span>
            <span>{Math.round(((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100}%`,
                backgroundColor: roadmap.hobbyColor,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Phases */}
      <div className="space-y-4">
        {roadmap.phases.map((phase, idx) => {
          const isCurrent = idx === roadmap.currentPhase;
          const isComplete = idx < roadmap.currentPhase;
          const isFuture = idx > roadmap.currentPhase;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
              className={`rounded-2xl border-2 p-6 transition-all ${
                isCurrent
                  ? "border-current shadow-md"
                  : isComplete
                  ? "border-gray-200 bg-gray-50/50"
                  : "border-gray-100 opacity-60"
              }`}
              style={isCurrent ? { borderColor: roadmap.hobbyColor } : undefined}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isComplete
                      ? "bg-green-100 text-green-600"
                      : isCurrent
                      ? "text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  style={isCurrent ? { backgroundColor: roadmap.hobbyColor } : undefined}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : phase.phase_number}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{phase.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{phase.description}</p>

                  {(isCurrent || isComplete) && (
                    <>
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Goals</p>
                        <ul className="space-y-1">
                          {phase.goals.map((g, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <Target className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: roadmap.hobbyColor }} />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Activities</p>
                        <ul className="space-y-1">
                          {phase.suggested_activities.map((a, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-300" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-gray-400">Time: {phase.time_per_week}/week</p>
                    </>
                  )}

                  {isFuture && (
                    <p className="text-xs text-gray-400">{phase.time_per_week}/week</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Advance button */}
      {!isLastPhase && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mt-8 text-center">
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: roadmap.hobbyColor }}
          >
            {advancing ? "Advancing..." : `Complete Phase ${roadmap.currentPhase + 1} & Advance`}
          </button>
        </motion.div>
      )}

      {isLastPhase && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mt-8 text-center">
          <div className="rounded-2xl p-6" style={{ backgroundColor: roadmap.hobbyColor + "12" }}>
            <p className="text-sm font-medium" style={{ color: roadmap.hobbyColor }}>
              You&apos;re on the final phase! Complete it to finish your roadmap.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
