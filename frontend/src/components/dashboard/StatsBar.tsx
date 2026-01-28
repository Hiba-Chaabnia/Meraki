"use client";

import { Zap, CalendarDays, CheckCircle2, Trophy, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import HeroIconPattern from "@/components/ui/HeroIconPattern";
import { Button } from "@/components/ui/Button";

interface StatsBarProps {
  currentStreak: number;
  daysSinceJoining: number;
  totalSessions: number;
  challengesCompleted: number;
  hasHobbies: boolean;
  onLogPractice: () => void;
}

function StatItem({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-2 ${iconColor}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl md:text-3xl font-serif">{value}</p>
    </div>
  );
}

export function StatsBar({
  currentStreak,
  daysSinceJoining,
  totalSessions,
  challengesCompleted,
  hasHobbies,
  onLogPractice,
}: StatsBarProps) {
  return (
    <div className="bg-[var(--primary)] text-[var(--background)] p-6 md:p-8 rounded-3xl mb-8 relative overflow-hidden">
      {/* Background pattern */}
      <HeroIconPattern
        useMask={false}
        iconSet="primary"
        iconOpacity={0.8}
        iconSize={40}
        cols={12}
        rows={5}
      />

      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full xl:w-auto flex-1">
          <StatItem
            icon={Zap}
            label="Streak Days"
            value={`${currentStreak}`}
            iconColor="text-[var(--background)]"
          />
          <StatItem
            icon={CalendarDays}
            label="Active Days"
            value={String(daysSinceJoining)}
            iconColor="text-[var(--background)]"
          />
          <StatItem
            icon={CheckCircle2}
            label="Practice Sessions"
            value={String(totalSessions)}
            iconColor="text-[var(--background)]"
          />
          <StatItem
            icon={Trophy}
            label="Completed Challenges"
            value={String(challengesCompleted)}
            iconColor="text-[var(--background)]"
          />
        </div>
        {hasHobbies && (
          <Button
            onClick={onLogPractice}
            variant="ghost"
            size="md"
            className="w-full xl:w-auto bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--background)]/90 flex-shrink-0"
          >
            Log Practice
          </Button>
        )}
      </div>
    </div>
  );
}
