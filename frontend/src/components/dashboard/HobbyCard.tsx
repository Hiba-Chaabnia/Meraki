"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pause, Play, Flame } from "lucide-react";
import { updateHobbyStatus } from "@/app/actions/hobbies";
import type { ActiveHobby, Challenge } from "@/lib/dashboardData";
import type { SectionTheme } from "@/lib/sectionTheme";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface HobbyCardProps {
  hobby: ActiveHobby;
  activeChallengeCount: number;
  activeChallenge?: Challenge | null;
  onStatusChange?: () => void;
  onLog?: () => void;
  theme: SectionTheme;
  compact?: boolean;
}

function lastPracticedLabel(days: number | null | undefined): string {
  if (days === null || days === undefined) return "Never practiced";
  if (days === 0) return "Practiced today";
  if (days === 1) return "Practiced yesterday";
  return `${days} days ago`;
}

export function HobbyCard({ hobby, activeChallengeCount, activeChallenge, onStatusChange, onLog, theme, compact }: HobbyCardProps) {
  const [toggling, setToggling] = useState(false);

  const handleTogglePause = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    const nextStatus = hobby.status === "active" ? "paused" : "active";
    await updateHobbyStatus(hobby.userHobbyId, nextStatus);
    setToggling(false);
    onStatusChange?.();
  };

  const pauseButton = (
    <Button
      onClick={handleTogglePause}
      disabled={toggling}
      title={hobby.status === "active" ? "Pause hobby" : "Resume hobby"}
      variant="ghost"
      size="md"
      shape="pill"
      iconOnly
      className="bg-white shadow-sm text-gray-300 hover:text-[var(--primary)] flex-shrink-0"
    >
      {toggling ? (
        <Spinner size="xs" variant="subtle" />
      ) : hobby.status === "active" ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      )}
    </Button>
  );

  if (compact) {
    const challengeHref = activeChallenge
      ? `/dashboard/challenges/${activeChallenge.id}`
      : `/dashboard/hobby/${hobby.slug}`;
    const challengeLabel = activeChallenge ? "Continue Challenge" : "Get Challenge";

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl transition-all duration-200 overflow-hidden ${
          hobby.status === "paused" ? "bg-gray-50 opacity-75" : "bg-white border border-gray-100"
        }`}
      >
        {/* Top row — tapping navigates to hobby detail */}
        <Link href={`/dashboard/hobby/${hobby.slug}`} className="block p-4 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{hobby.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                {hobby.currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[var(--coral)]">
                    <Flame className="w-3 h-3" />
                    {hobby.currentStreak}d
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {lastPracticedLabel(hobby.lastSessionDaysAgo)}
                </span>
              </div>
            </div>
            {pauseButton}
          </div>
        </Link>

        {/* Quick actions row */}
        <div className="flex items-center gap-1 px-4 pb-3 pt-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLog?.(); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-center cursor-pointer"
          >
            Log
          </button>
          <Link
            href={challengeHref}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {challengeLabel}
          </Link>
          <Link
            href={`/discover/sampling/${hobby.slug}`}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
            onClick={(e) => e.stopPropagation()}
          >
            Explore
          </Link>
        </div>
      </motion.div>
    );
  }

  // Full card
  return (
    <Link href={`/dashboard/hobby/${hobby.slug}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 transition-shadow hover:shadow-md h-full flex flex-col justify-between"
        style={{ backgroundColor: theme.bg, borderColor: theme.border }}
      >
        <div className="flex justify-between items-start mb-4 gap-2">
          <h3 className="font-semibold text-gray-800 group-hover:text-gray-900 truncate">
            {hobby.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                hobby.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
              }`}
            >
              {hobby.status === "active" ? "Active" : "Paused"}
            </span>
            {pauseButton}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 mt-auto">
          <p className="text-xs text-gray-400">{hobby.totalSessions} Sessions</p>
          <p className="text-xs text-gray-400">{activeChallengeCount} Active Challenges</p>
        </div>
      </motion.div>
    </Link>
  );
}
