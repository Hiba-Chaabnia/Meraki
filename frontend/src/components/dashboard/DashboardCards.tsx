"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FlowerShape } from "@/components/ui/FlowerShape";
import HeroIconPattern from "@/components/ui/HeroIconPattern";
import { ClockIcon } from "@/components/ui/Icons";
import { fadeUp } from "@/components/ui/animations";
import { themeFor } from "@/lib/sectionTheme";
import type { DashboardChallenge } from "@/lib/dashboardHome";

/**
 * How the icon wallpaper is drawn. The three numbers trade against each other —
 * shrinking the icons thins their strokes, which costs contrast that has to come
 * back as opacity — so they are tuned together on `/preview/challenge-card`
 * rather than one at a time.
 */
export interface Wallpaper {
  opacity: number;
  /** Target gap in px between icon centres. */
  spacing: number;
  /** Icon edge in px. */
  size: number;
}

export const CHALLENGE_WALLPAPER: Wallpaper = { opacity: 0.65, spacing: 56, size: 42 };

interface ActiveChallengeCardProps {
  /** Every live challenge. One shows at a time; the stepper moves between them. */
  challenges: DashboardChallenge[];
  /** Tuning seam for the preview harness. Production leaves this alone. */
  wallpaper?: Wallpaper;
}

/**
 * "watercolor painting" → "Watercolor Painting". Only the first letter of each
 * word is touched, never the rest, so a name that arrives with deliberate inner
 * capitals — "DIY Crafts" — survives. Hobby names reach us from the quiz and the
 * AI, so their case cannot be assumed; the chip used to hide the question behind
 * `uppercase`.
 */
function titleCase(text: string): string {
  return text.replace(/(^|\s)(\S)/g, (_, lead: string, char: string) => lead + char.toUpperCase());
}

interface ChallengeStepperProps {
  challenges: DashboardChallenge[];
  activeIndex: number;
  onSelect: (idx: number) => void;
}

/**
 * One flower per live challenge, sitting under the card on the cream.
 *
 * **Manual only — deliberately no timer.** An auto-advancing card would move
 * `Continue` out from under a pointer already travelling towards it, so the user
 * opens a challenge they were not reading. Reading time is not uniform either
 * (descriptions clamp at three lines but often run one), and anything that
 * auto-moves for more than five seconds owes the user a pause control under
 * WCAG 2.2.2. Letting them click earns none of that debt.
 */
function ChallengeStepper({ challenges, activeIndex, onSelect }: ChallengeStepperProps) {
  return (
    <div className="mt-2.5 flex items-center justify-center gap-1.5">
      {challenges.map((c, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(idx)}
            aria-label={`Challenge ${idx + 1} of ${challenges.length}: ${c.title}`}
            aria-current={isActive ? "true" : undefined}
            className="cursor-pointer outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
          >
            {/* Each flower wears its own hobby's colour, so the row reads as
                "which hobby" and not just "which slide". Inactive drops to the
                warm neutral rather than a grey, which would go cold on cream. */}
            <FlowerShape
              size={isActive ? 18 : 13}
              color={isActive ? themeFor(c.theme).accent : "var(--white-dim)"}
              gradientId={`challenge-flower-${c.id}`}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The focal card, carrying the immersive-panel treatment from the landing hero
 * and `/discover` (§5.1 archetype A): a blue panel under the hobby icon
 * wallpaper, with the lime CTA on top — the "blue is surface, lime is action"
 * pairing from §2.3. It keeps the card radius rather than the scalloped edge
 * those pages use; the scallop belongs to full-bleed panels, not to one card in
 * a column of them.
 *
 * The wallpaper is scaled down rather than copied — see `CHALLENGE_WALLPAPER`.
 * Its pitch is measured from the card's own box because the shared pattern
 * otherwise sizes its grid from the *window*, which would both cram a
 * 14-column field in here and change density at every breakpoint.
 *
 * One action only. A "Swap" button used to sit beside Continue, regenerating the
 * challenge from the AI; it was a 90-second wait triggered from the home screen,
 * competing with Continue on the page's focal card. Regenerating still lives on
 * the hobby page, which is where a decision that slow belongs.
 */
export function ActiveChallengeCard({
  challenges,
  wallpaper = CHALLENGE_WALLPAPER,
}: ActiveChallengeCardProps) {
  const [index, setIndex] = useState(0);

  if (challenges.length === 0) return null;

  /* Clamped on the way out, not corrected in an effect: a poll that retires a
     challenge can shrink the list underneath a stale index. */
  const activeIndex = Math.min(index, challenges.length - 1);
  const challenge = challenges[activeIndex];
  const multiple = challenges.length > 1;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)] p-[18px] text-white">
        <HeroIconPattern
          useMask={false}
          iconSet="primary"
          iconOpacity={wallpaper.opacity}
          iconSpacing={wallpaper.spacing}
          iconSize={wallpaper.size}
        />

        {/* Keyed so switching remounts the body and it fades in. The panel
            stays put — only its contents change. */}
        <motion.div
          key={challenge.id}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative z-10"
        >
          <div className="mb-2.5 flex items-center justify-between gap-3">
            {/* The landing header's outline button, borrowed: cream border and
                text on nothing. Not the hobby's accent — on a blue panel a blue
                accent disappears, and conditioning the chip on the theme would
                leave two hobbies looking like two different components. The
                hobby's colour is carried by its flower in the stepper below,
                which sits on cream and can hold it. */}
            <span className="min-w-0 truncate rounded-lg border border-[var(--background)] px-2 py-1 text-[11px] font-medium text-[var(--background)]">
              {titleCase(challenge.hobbyName)}
            </span>
            {/* Naming the ask up front is the §8 "shrink the ask" move — the time
                was already fetched and thrown away before now. */}
            {challenge.estimatedTime && (
              <span className="flex flex-shrink-0 items-center gap-1 text-[10.5px] font-medium text-white/80">
                <ClockIcon className="h-3 w-3" />
                {challenge.estimatedTime}
              </span>
            )}
          </div>

          <p className="text-[15px] font-bold leading-[1.35]">{challenge.title}</p>
          {/* Held at three lines (11.5px × 1.5 × 3) while there is more than one
              challenge, so stepping through does not bounce the flowers up and
              down under the cursor that is clicking them. */}
          <p
            className="mt-[7px] line-clamp-3 text-[11.5px] leading-[1.5] text-white/80"
            style={multiple ? { minHeight: 52 } : undefined}
          >
            {challenge.description}
          </p>

          <div className="mt-[13px] flex justify-end">
            <Button href={`/dashboard/challenges/${challenge.id}`} size="sm" variant="secondary">
              Continue
            </Button>
          </div>
        </motion.div>
      </div>

      {multiple && (
        <ChallengeStepper
          challenges={challenges}
          activeIndex={activeIndex}
          onSelect={setIndex}
        />
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
