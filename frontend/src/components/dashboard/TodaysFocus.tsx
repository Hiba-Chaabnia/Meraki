"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ScallopedButton } from "@/components/ui/ScallopedButton";
import { Sparkles, Target, Compass, Zap } from "lucide-react";
import type { ActiveHobby, Challenge, Roadmap } from "@/lib/dashboardData";
import type { NudgeData } from "@/app/actions/nudges";

interface TodaysFocusProps {
  hobbies: ActiveHobby[];
  activeChallenges: Challenge[];
  nudge: NudgeData | null;
  roadmap: Roadmap | null;
  onGenerateChallenge: () => void;
  generatingChallenge: boolean;
  onDismissNudge: () => void;
}

export function TodaysFocus({
  hobbies,
  activeChallenges,
  nudge,
  roadmap,
  onGenerateChallenge,
  generatingChallenge,
  onDismissNudge,
}: TodaysFocusProps) {
  // Priority 1: No hobbies
  if (hobbies.length === 0) {
    return (
      <FocusCard
        title="Start your creative journey"
        description="Discover hobbies tailored to your personality and interests."
      >
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/discover/quiz">
            <ScallopedButton bgColor="var(--primary)" textColor="#fff" scallopSize="sm">
              Take the Quiz
            </ScallopedButton>
          </Link>
        </div>
      </FocusCard>
    );
  }

  // Priority 2: Motivation nudge
  if (nudge) {
    return (
      <FocusCard
        title={nudge.message}
        description={nudge.suggested_action}
        borderColor="var(--secondary)"
      >
        <div className="flex flex-wrap gap-3 mt-4">
          {nudge.action_data && (
            <Link href={nudge.action_data}>
              <ScallopedButton bgColor="var(--secondary)" textColor="#fff" scallopSize="sm">
                Let&apos;s Go
              </ScallopedButton>
            </Link>
          )}
          <button
            onClick={onDismissNudge}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer px-3"
          >
            Dismiss
          </button>
        </div>
      </FocusCard>
    );
  }

  // Priority 3: Active challenge
  const activeChallenge = activeChallenges.find((c) => c.status === "active");
  if (activeChallenge) {
    return (
      <FocusCard
        title={activeChallenge.title}
        description={activeChallenge.description}
        borderColor={activeChallenge.hobbyColor}
      >
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href={`/dashboard/challenges/${activeChallenge.id}`}>
            <ScallopedButton bgColor={activeChallenge.hobbyColor} textColor="#fff" scallopSize="sm">
              Continue Challenge
            </ScallopedButton>
          </Link>
        </div>
      </FocusCard>
    );
  }

  // Priority 4: Has roadmap, show current phase
  if (roadmap && roadmap.phases.length > 0) {
    const phase = roadmap.phases[roadmap.currentPhase];
    if (phase) {
      return (
        <FocusCard
          title={`Current focus: ${phase.title}`}
          description={phase.description}
          borderColor={roadmap.hobbyColor}
        >
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href={`/dashboard/roadmap/${roadmap.userRoadmapId}`} className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: roadmap.hobbyColor }}>
              View Roadmap

            </Link>
          </div>
        </FocusCard>
      );
    }
  }

  // Priority 5: Default — generate challenge
  return (
    <FocusCard
      title="Ready for a challenge?"
      description="Get a personalized creative challenge based on your practice history."
    >
      <div className="mt-4 flex items-center justify-center">
        <button
          onClick={onGenerateChallenge}
          disabled={generatingChallenge}
          className="px-6 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 transition-all duration-200"
        >
          {generatingChallenge ? "Generating..." : "Generate Challenge"}
        </button>
      </div>
    </FocusCard>
  );
}

function FocusCard({
  title,
  description,
  borderColor,
  children,
}: {
  title: string;
  description: string;
  borderColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border-2 bg-white p-6 shadow-sm"
      style={{ borderColor: borderColor ?? "var(--primary)" }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
