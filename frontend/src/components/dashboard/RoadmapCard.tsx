"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import type { Roadmap } from "@/lib/dashboardData";
import { Card } from "@/components/ui/Card";
import { fadeUp } from "@/components/ui/animations";

interface RoadmapCardProps {
  roadmap: Roadmap;
}

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const phase = roadmap.phases[roadmap.currentPhase];
  const progress = roadmap.totalPhases > 0
    ? ((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100
    : 0;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card variant="bordered" radius="2xl" padding="lg" borderColor="var(--color-gray-300, #D1D5DB)">
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
              className="h-full rounded-full bg-gray-700 transition-all duration-500"
              style={{ width: `${progress}%` }}
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
          className="text-sm font-medium text-gray-700 hover:underline flex items-center gap-1"
        >
          View Roadmap &rarr;
        </Link>
      </Card>
    </motion.div>
  );
}
