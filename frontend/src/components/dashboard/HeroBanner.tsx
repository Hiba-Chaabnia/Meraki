"use client";

import { motion } from "framer-motion";

import { Flame, Calendar } from "lucide-react";
import { getGreeting } from "@/lib/dashboardData";
import type { UserStats } from "@/lib/dashboardData";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface HeroBannerProps {
  displayName: string;
  stats: UserStats;
  onLogPractice: () => void;
}

export function HeroBanner({ displayName, stats, onLogPractice }: HeroBannerProps) {
  return (
    <div className="w-full pt-6 pb-8 md:pt-10 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Left Content: Greeting & Stats */}
        <div className="flex-1 space-y-3">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 leading-tight">
              {getGreeting(displayName)}
            </h1>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium"
          >
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
              <Calendar className="w-4 h-4 text-[var(--primary)]" />
              Day {stats.daysSinceJoining}
            </span>

            {stats.currentStreak > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                <Flame className="w-4 h-4 text-[var(--coral)]" />
                {stats.currentStreak}-day streak
              </span>
            )}

            <span className="hidden sm:inline-block px-2">•</span>
            <span>{stats.totalSessions} sessions completed</span>
          </motion.div>
        </div>

        {/* Right Content: Action Button */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
        >
          <button
            onClick={onLogPractice}
            className="px-8 py-3 bg-[var(--secondary)] text-[#1a1a1a] font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Log Practice
          </button>
        </motion.div>
      </div>
    </div>
  );
}
