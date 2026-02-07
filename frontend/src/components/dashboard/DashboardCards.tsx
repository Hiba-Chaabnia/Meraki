"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { ClockIcon } from "@/components/ui/Icons";
import { themeFor } from "@/lib/sectionTheme";
import type { DashboardChallenge } from "@/lib/dashboardHome";

interface ActiveChallengeCardProps {
  challenge: DashboardChallenge;
  /** Live challenges beyond this one — surfaced as a link, not a second card. */
  moreCount?: number;
}

/**
 * The dark card. Restrained on purpose: no scallops, no flower — brand presence
 * on this screen comes from colour and the hobby icon set.
 *
 * One action only. A "Swap" button used to sit beside Continue, regenerating the
 * challenge from the AI; it was a 90-second wait triggered from the home screen,
 * competing with Continue on the page's focal card. Regenerating still lives on
 * the hobby page, which is where a decision that slow belongs.
 */
export function ActiveChallengeCard({ challenge, moreCount = 0 }: ActiveChallengeCardProps) {
  return (
    <div>
      <div className="rounded-2xl bg-[var(--foreground)] p-4 text-white">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          {/* The hobby, and only the hobby. The day count rode along here as
              "· day 2" and was the least useful thing on the card's busiest
              line — the challenge page carries it. Translucent white rather
              than a tint of the accent: theme colours are var() strings and
              cannot be given an alpha (§2.2). */}
          <span
            className="min-w-0 truncate rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.06em]"
            style={{
              color: themeFor(challenge.theme).accent,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            {challenge.hobbyName}
          </span>
          {/* Naming the ask up front is the §8 "shrink the ask" move — the time
              was already fetched and thrown away before now. */}
          {challenge.estimatedTime && (
            <span className="flex flex-shrink-0 items-center gap-1 text-[10.5px] font-medium text-white/[.62]">
              <ClockIcon className="h-3 w-3" />
              {challenge.estimatedTime}
            </span>
          )}
        </div>

        <p className="text-[14.5px] font-bold leading-[1.35]">{challenge.title}</p>
        <p className="mt-[7px] line-clamp-3 text-[11.5px] leading-[1.5] text-white/[.62]">
          {challenge.description}
        </p>

        <div className="mt-[13px] flex justify-end">
          <Button href={`/dashboard/challenges/${challenge.id}`} size="sm" variant="secondary">
            Continue
          </Button>
        </div>
      </div>

      {moreCount > 0 && (
        <Link
          href="/dashboard/challenges"
          className="mt-2 inline-block text-[11.5px] font-bold text-[var(--primary)] hover:underline"
        >
          +{moreCount} more challenge{moreCount > 1 ? "s" : ""} →
        </Link>
      )}
    </div>
  );
}

interface ReEntryCardProps {
  hobbyName: string;
  hobbySlug: string;
}

/**
 * Dormant state. Deliberately smaller than a real challenge — the ask has to
 * feel trivial, so it never mentions the gap or what was lost.
 */
export function ReEntryCard({ hobbyName, hobbySlug }: ReEntryCardProps) {
  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--primary-lighter)] bg-[var(--primary-theme-bg)] p-4">
      <p className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-[.06em] text-[var(--primary)]">
        {hobbyName} · smallest step
      </p>
      {/* Design copy was watercolour-specific ("Ten minutes, one colour"); this
          reads the same but survives any hobby the user actually has. */}
      <p className="text-sm font-bold leading-[1.35] text-[var(--foreground)]">
        Ten minutes, nothing to finish
      </p>
      <p className="mt-1.5 text-[11.5px] leading-[1.55] text-[#6b7280]">
        No goal, no finished piece. Just get your hands <em>moving</em> again.
      </p>
      <Button href={`/dashboard/hobby/${hobbySlug}`} size="sm" className="mt-3">
        Start
      </Button>
    </div>
  );
}

/** All-paused state — replaces the challenge slot rather than showing it empty. */
export function RetakeQuizCard() {
  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--secondary-theme-accent)] bg-[var(--secondary-theme-bg)] p-[18px]">
      <FlowerShape size={30} color="var(--secondary)" />
      <p className="mt-2.5 text-sm font-bold leading-[1.35] text-[var(--foreground)]">
        Your taste may have moved on
      </p>
      <p className="mt-1.5 text-[11.5px] leading-[1.55] text-[#6b7280]">
        <em>Retake the quiz</em> — it takes two minutes and reads you as you are now, not last
        spring.
      </p>
      {/* Inline style, not a class: a bg utility here would race the variant's own. */}
      <Button
        href="/discover/quiz"
        size="sm"
        variant="secondary"
        className="mt-3"
        style={{ backgroundColor: "var(--foreground)", color: "#fff" }}
      >
        Retake the quiz
      </Button>
    </div>
  );
}
