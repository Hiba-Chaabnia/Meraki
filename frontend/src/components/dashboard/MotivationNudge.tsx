"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { NudgeMessage } from "@/lib/dashboardData";

const nudgeIcons: Record<NudgeMessage["type"], string> = {
  streak: "\u{1F525}",
  comeback: "\u{1F44B}",
  challenge: "\u{1F3AF}",
  encouragement: "\u{2728}",
};

interface MotivationNudgeProps {
  nudge: NudgeMessage;
}

export function MotivationNudge({ nudge }: MotivationNudgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
    >
      <span className="text-2xl flex-shrink-0">{nudgeIcons[nudge.type]}</span>
      <p className="text-sm text-gray-600 flex-1">{nudge.message}</p>
      {nudge.action && (
        <Link
          href={nudge.action.href}
          className="flex-shrink-0 text-sm font-semibold text-[var(--secondary)] hover:underline"
        >
          {nudge.action.label}
        </Link>
      )}
    </motion.div>
  );
}
