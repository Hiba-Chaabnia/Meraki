"use client";

import { motion } from "framer-motion";
import type { ActiveHobby, Challenge } from "@/lib/dashboardData";
import type { NudgeData } from "@/app/actions/nudges";
import { Button } from "@/components/ui/Button";

interface TodaysFocusProps {
  hobbies: ActiveHobby[];
  activeChallenges: Challenge[];
  nudge: NudgeData | null;
  onDismissNudge: () => void;
}

export function TodaysFocus({ hobbies, activeChallenges, nudge, onDismissNudge }: TodaysFocusProps) {
  // Priority 1: No hobbies — onboarding prompt
  if (hobbies.length === 0) {
    return (
      <FocusCard title="Start your creative journey" description="Discover hobbies tailored to your personality and interests.">
        <div className="mt-4">
          <Button href="/discover/quiz" variant="primary">Take the Quiz</Button>
        </div>
      </FocusCard>
    );
  }

  // Priority 2: Motivation nudge
  if (nudge) {
    return (
      <FocusCard title={nudge.message} description={nudge.suggested_action} borderColor="var(--secondary)">
        <div className="flex flex-wrap gap-3 mt-4">
          {nudge.action_data && (
            <Button href={nudge.action_data} variant="primary">Let&apos;s Go</Button>
          )}
          <button
            onClick={onDismissNudge}
            className="body-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer px-3"
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
      <FocusCard title={activeChallenge.title} description={activeChallenge.description} borderColor="#374151">
        <div className="mt-4">
          <Button href={`/dashboard/challenges/${activeChallenge.id}`} variant="primary">
            Continue Challenge
          </Button>
        </div>
      </FocusCard>
    );
  }

  // Nothing actionable — hide the banner entirely
  return null;
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
      <h3 className="font-serif text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      {children}
    </motion.div>
  );
}
