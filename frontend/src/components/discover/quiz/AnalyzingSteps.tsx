"use client";

import { motion } from "framer-motion";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { CheckCircleIcon } from "@/components/ui/Icons";
import { THEME_PRIMARY } from "@/lib/sectionTheme";

type StepState = "done" | "active" | "pending";

/**
 * The shape stays a flower throughout — as in QuizStepper, state reads from
 * colour and size — with a cream check dropped inside the completed ones.
 *
 *   done     solid primary, 20px, check inside, label recedes to primary
 *   active   lime (the "action" colour), 26px, spin + gentle breath
 *   pending  pale primary, 16px, muted label
 *
 * Active is the largest so activity outranks completion at a glance.
 */
const SIZE: Record<StepState, number> = {
  done: 20,
  active: 26,
  pending: 16,
};

const COLOR: Record<StepState, string> = {
  done: "var(--primary)",
  active: "var(--secondary)",
  pending: "var(--primary-lighter)",
};

const LABEL: Record<StepState, string> = {
  done: "text-[var(--primary)]",
  active: "text-[var(--foreground)] font-medium",
  pending: "text-gray-400",
};

/** Rail must fit the largest marker so labels stay aligned across states. */
const RAIL = Math.max(24, ...Object.values(SIZE));

/**
 * Matches the outer flower of the page's FlowerSpinner (3s per revolution,
 * clockwise) so the two turn at the same rate. Keep these in sync — if
 * FlowerSpinner's outer spinDuration changes, change this with it.
 */
const SPIN_DURATION_S = 3;

interface AnalyzingStepsProps {
  steps: readonly string[];
  /** How many steps the backend reports as finished. */
  completed: number;
  /**
   * Whether the job is actively running. When false (still queued), no step is
   * marked active — we don't claim work has started before it has.
   */
  running: boolean;
  /** Tinted card (default) or bare list on the page background. */
  container?: "card" | "plain";
  /**
   * Row alignment. "left" keeps every marker on a shared vertical axis;
   * "center" centres each marker+label pair, so markers no longer line up.
   */
  align?: "left" | "center";
}

export function AnalyzingSteps({
  steps,
  completed,
  running,
  container = "card",
  align = "left",
}: AnalyzingStepsProps) {
  const done = Math.max(0, Math.min(completed, steps.length));
  const isCard = container === "card";

  return (
    <ol
      className={[
        "space-y-3",
        isCard ? "rounded-2xl border p-5" : "",
        align === "center" ? "text-center" : "text-left",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        isCard
          ? {
              backgroundColor: THEME_PRIMARY.bg,
              borderColor: THEME_PRIMARY.accent,
            }
          : undefined
      }
    >
      {steps.map((step, i) => {
        const state: StepState =
          i < done ? "done" : running && i === done ? "active" : "pending";
        const size = SIZE[state];

        return (
          <li
            key={step}
            className={`flex items-center gap-3 ${
              align === "center" ? "justify-center" : ""
            }`}
            aria-current={state === "active" ? "step" : undefined}
          >
            <span
              className="flex items-center justify-center flex-shrink-0 relative"
              style={{ width: RAIL, height: RAIL }}
            >
              {state === "active" ? (
                /* Outer element breathes, inner one spins — separate
                   transforms on separate nodes so they compose cleanly. */
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex"
                >
                  <FlowerShape
                    size={size}
                    color={COLOR[state]}
                    spin
                    spinDuration={SPIN_DURATION_S}
                    spinDirection="clockwise"
                    gradientId={`analyzing-step-${i}`}
                  />
                </motion.span>
              ) : (
                <FlowerShape
                  size={size}
                  color={COLOR[state]}
                  gradientId={`analyzing-step-${i}`}
                />
              )}

              {state === "done" && (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <CheckCircleIcon
                    className="text-[var(--background)]"
                    style={{ width: Math.round(size * 0.55), height: Math.round(size * 0.55) }}
                    aria-hidden="true"
                  />
                </motion.span>
              )}
            </span>

            <span className={`text-sm transition-colors duration-500 ${LABEL[state]}`}>
              {step}
              {/* The marker carries state visually; spell it out for AT */}
              {state !== "pending" && (
                <span className="sr-only">
                  {state === "done" ? " — done" : " — in progress"}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
