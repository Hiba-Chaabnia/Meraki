"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import type { Roadmap } from "@/lib/dashboardData";

interface RoadmapCardProps {
  roadmap: Roadmap;
}

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const phase = roadmap.phases[roadmap.currentPhase];
  const progress = roadmap.totalPhases > 0
    ? ((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 shadow-sm p-6"
      style={{ borderColor: roadmap.hobbyColor }}
    >
      <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Map className="w-5 h-5 text-gray-400" />
        My Roadmap
      </h2>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{roadmap.title}</span>
          <span className="text-xs text-gray-400">
            Phase {roadmap.currentPhase + 1}/{roadmap.totalPhases}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: roadmap.hobbyColor }}
          />
        </div>
      </div>

      {phase && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          <span className="font-medium text-gray-600">{phase.title}</span>
          {" — "}
          {phase.description}
        </p>
      )}

      <Link
        href={`/dashboard/roadmap/${roadmap.userRoadmapId}`}
        className="text-sm font-medium hover:underline flex items-center gap-1"
        style={{ color: roadmap.hobbyColor }}
      >
        View Roadmap &rarr;
      </Link>
    </motion.div>
  );
}
