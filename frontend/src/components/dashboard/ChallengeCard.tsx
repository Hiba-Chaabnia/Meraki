"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Challenge, ChallengeStatus } from "@/lib/dashboardData";
import { difficultyConfig } from "@/lib/dashboardData";

const statusStyles: Record<ChallengeStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-blue-50", text: "text-blue-600", label: "In Progress" },
  upcoming: { bg: "bg-gray-50", text: "text-gray-500", label: "Up Next" },
  completed: { bg: "bg-green-50", text: "text-green-600", label: "Completed" },
  skipped: { bg: "bg-gray-50", text: "text-gray-400", label: "Skipped" },
};

interface ChallengeCardProps {
  challenge: Challenge;
  compact?: boolean;
}

export function ChallengeCard({ challenge, compact = false }: ChallengeCardProps) {
  const diff = difficultyConfig[challenge.difficulty];
  const status = statusStyles[challenge.status];

  return (
    <Link href={`/dashboard/challenges/${challenge.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* Top row: hobby badge + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="badge bg-gray-100 text-gray-700 font-bold">
            {challenge.hobbyName}
          </span>
          <span className={`badge-sm ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="card-heading mb-1">
          {challenge.title}
        </h3>

        {!compact && (
          <p className="body-sm line-clamp-2 mb-3">
            {challenge.description}
          </p>
        )}

        {/* Bottom row: difficulty + time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i >= diff.dots ? "bg-gray-200" : ""}`}
                  style={i < diff.dots ? { backgroundColor: diff.color } : undefined}
                />
              ))}
            </div>
            <span className="caption">{diff.label}</span>
          </div>
          <span className="caption flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {challenge.estimatedTime}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
