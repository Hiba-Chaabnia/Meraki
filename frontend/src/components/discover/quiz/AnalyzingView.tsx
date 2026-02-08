"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FlowerSpinner } from "@/components/ui/FlowerSpinner";
import { AnalyzingSteps } from "./AnalyzingSteps";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { DISCOVERY_STEPS } from "@/lib/discovery";

const stagger = staggerContainer(0.08);

export interface AnalyzingViewProps {
  completedSteps: number;
  /** Swaps the reassurance line once a run outlives the expected window. */
  slow?: boolean;
  /**
   * Terminal state. Drops the loading furniture entirely: no spinner, no
   * headline, no motion — mirrors app/discover/error.tsx.
   */
  failed?: boolean;
  onRetry: () => void;
  quizHref: string;
}

export function AnalyzingView({
  completedSteps,
  slow = false,
  failed = false,
  onRetry,
  quizHref,
}: AnalyzingViewProps) {
  if (failed) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex justify-center"
        >
          <ErrorState
            message="Match failed. Your answers are saved. Please try again."
            actions={
              <>
                <Button onClick={onRetry} variant="secondary">
                  Try again
                </Button>
                <Button href={quizHref} variant="ghost">
                  Retake the quiz
                </Button>
              </>
            }
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="text-center max-w-md w-full"
      >
        <motion.div variants={fadeUp} className="flex justify-center mb-8">
          <FlowerSpinner size={72} color="var(--secondary)" />
        </motion.div>

        <motion.h1 variants={fadeUp} className="page-title mb-6">
          Finding your <em>creative</em> match
        </motion.h1>

        <motion.div variants={fadeUp}>
          {/* Always `running` here: this branch only renders while work is
              underway, and "Reading your answers" is honest from the moment
              we mount — triggerDiscovery() is literally fetching them. */}
          <AnalyzingSteps steps={DISCOVERY_STEPS} completed={completedSteps} running />
        </motion.div>

        <motion.p variants={fadeUp} className="caption mt-6">
          {slow
            ? "Still working — this one's taking a little longer than usual."
            : "Good matches take a moment."}
        </motion.p>
      </motion.div>
    </div>
  );
}
