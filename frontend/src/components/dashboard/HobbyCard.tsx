"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { updateHobbyStatus } from "@/app/actions/hobbies";
import type { ActiveHobby } from "@/lib/dashboardData";
import type { SectionTheme } from "@/lib/sectionTheme";
import { Button } from "@/components/ui/Button";

interface HobbyCardProps {
  hobby: ActiveHobby;
  activeChallengeCount: number;
  onStatusChange?: () => void;
  theme: SectionTheme;
  compact?: boolean;
}

export function HobbyCard({ hobby, activeChallengeCount, onStatusChange, theme, compact }: HobbyCardProps) {
  const [toggling, setToggling] = useState(false);

  const handleTogglePause = async (e: React.MouseEvent) => {
    e.preventDefault();
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
        <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-300/40 border-t-gray-400 rounded-full" />
      ) : hobby.status === "active" ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      )}
    </Button>
  );

  if (compact) {
    const initial = hobby.name.charAt(0).toUpperCase();
    const sessionPct = Math.min((hobby.totalSessions / 20) * 100, 100);

    return (
      <Link href={`/dashboard/hobby/${hobby.slug}`} className="block group">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden p-4 rounded-2xl transition-all duration-200 hover:shadow-md ${
            hobby.status === "paused"
              ? "bg-gray-50 opacity-75"
              : "bg-white border border-gray-100"
          }`}
        >
          {/* Hover tint */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl pointer-events-none"
            style={{ backgroundColor: hobby.color }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{hobby.name}</h4>
                  <p className="text-xs text-gray-500">
                    {hobby.status === "paused"
                      ? "Paused"
                      : `${hobby.totalSessions} sessions · ${activeChallengeCount} challenges`}
                  </p>
                </div>
              </div>
              {pauseButton}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Full card (used outside dashboard)
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
