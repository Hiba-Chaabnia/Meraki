"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PracticeSession, ActiveHobby } from "@/lib/dashboardData";

interface StuckSuggestion {
  pattern: string;
  icon: string;
  message: string;
  suggestion: string;
  action?: { label: string; href: string };
}

function detectStuckPattern(sessions: PracticeSession[], hobbies: ActiveHobby[]): StuckSuggestion | null {
  const recent = sessions.slice(0, 3);
  if (recent.length < 2) return null;

  // Pattern: Frustrated/discouraged 2+ of last 3 sessions
  const frustrationCount = recent.filter(
    (s) => s.mood === "frustrated" || s.mood === "discouraged"
  ).length;
  if (frustrationCount >= 2) {
    return {
      pattern: "repeated-frustration",
      icon: "\u{1F33F}",
      message: "Looks like your last few sessions have been tough.",
      suggestion:
        "How about a low-pressure experiment? Try something playful with zero expectations — just explore for fun.",
      action: { label: "Try a Fun Challenge", href: "/dashboard/challenges" },
    };
  }

  // Pattern: Same hobby in all recent sessions (5+ overall)
  const hobbyCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    hobbyCounts[s.hobbySlug] = (hobbyCounts[s.hobbySlug] || 0) + 1;
  });
  const dominantHobby = Object.entries(hobbyCounts).find(([, count]) => count >= 5);
  if (dominantHobby && hobbies.length > 1) {
    const otherHobby = hobbies.find((h) => h.slug !== dominantHobby[0]);
    return {
      pattern: "same-hobby-loop",
      icon: "\u{1F500}",
      message: `You\u2019ve been deep into one hobby. That\u2019s great dedication!`,
      suggestion: otherHobby
        ? `Why not shake things up? A quick ${otherHobby.name} session might spark fresh inspiration.`
        : "Try a different aspect of your hobby — new technique, new subject, or new materials.",
      action: { label: "Explore Something New", href: "/discover" },
    };
  }

  return null;
}

interface StuckHelperProps {
  sessions: PracticeSession[];
  hobbies: ActiveHobby[];
}

export function StuckHelper({ sessions, hobbies }: StuckHelperProps) {
  const suggestion = detectStuckPattern(sessions, hobbies);
  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5"
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">{suggestion.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {suggestion.message}
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {suggestion.suggestion}
          </p>
          {suggestion.action && (
            <Link
              href={suggestion.action.href}
              className="inline-block mt-3 text-sm font-semibold text-[var(--secondary)] hover:underline"
            >
              {suggestion.action.label} &rarr;
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
