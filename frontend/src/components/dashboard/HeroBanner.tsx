"use client";

import { motion } from "framer-motion";
import { Flame, Calendar } from "lucide-react";
import { getGreeting } from "@/lib/dashboardData";
import type { UserStats } from "@/lib/dashboardData";
import { fadeUp } from "@/components/ui/animations";
import { Button } from "@/components/ui/Button";

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
          <motion.div variants={fadeUp} initial="hidden" animate="show">
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
            <span className="stat-chip">
              <Calendar className="w-4 h-4 text-[var(--primary)]" />
              Day {stats.daysSinceJoining}
            </span>

            {stats.currentStreak > 0 && (
              <span className="stat-chip">
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
          <Button
            onClick={onLogPractice}
            variant="secondary"
            size="lg"
            shape="pill"
            className="shadow-md hover:shadow-lg font-bold"
          >
            Log Practice
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
