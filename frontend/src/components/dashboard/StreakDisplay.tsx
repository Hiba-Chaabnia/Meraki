"use client";

import { motion } from "framer-motion";
import type { StreakDay } from "@/lib/dashboardData";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface StreakDisplayProps {
  days: StreakDay[];
  currentStreak: number;
  accentColor?: string;
}

/* Thought bubble mini-icon */
const ThoughtIcon = () => (
  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3c-4.97 0-9 3.13-9 7 0 2.38 1.41 4.5 3.6 5.77-.2 1.6-1.1 3.03-1.12 3.05a.5.5 0 00.45.72c2.2 0 3.88-1.1 4.7-1.84.43.06.88.1 1.37.1 4.97 0 9-3.13 9-7s-4.03-7-9-7z" />
  </svg>
);

export function StreakDisplay({
  days,
  currentStreak,
  accentColor = "var(--secondary)",
}: StreakDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {days.map((status, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium">
              {DAY_LABELS[i]}
            </span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400 }}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={
                status === "practiced"
                  ? { backgroundColor: accentColor }
                  : status === "thought"
                  ? { backgroundColor: accentColor, opacity: 0.45 }
                  : { backgroundColor: "transparent", border: "2px solid #e5e7eb" }
              }
            >
              {status === "practiced" && (
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
              {status === "thought" && <ThoughtIcon />}
            </motion.div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        <span className="font-bold" style={{ color: accentColor }}>
          {currentStreak}
        </span>{" "}
        day streak
      </p>
    </div>
  );
}
