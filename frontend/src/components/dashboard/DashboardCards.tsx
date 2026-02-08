"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FlowerShape } from "@/components/ui/FlowerShape";
import HeroIconPattern from "@/components/ui/HeroIconPattern";
import { ClockIcon } from "@/components/ui/Icons";
import { fadeUp } from "@/components/ui/animations";
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

/**
 * Line caps for the two AI-written strings.
 *
 * The title had none, so a long one grew the panel downward and pushed
 * `Continue` off the fold — it comes from the challenge crew, so its length is
 * not ours to assume. Both are CSS vars rather than Tailwind's `line-clamp-N`,
 * because the class needs the number at build time and `/preview/challenge-card`
 * has to vary it.
 */
const TITLE_LINES = 1;
const DESC_LINES = 2;
const DESC_LEADING = 1.5;

/**
 * Type scale inside the panel. Tune on `/preview/challenge-card`.
 *
 * Title and description are fluid: `cqi` is 1% of the *card's* inline size, not
 * the viewport's, which is what this needs — the card is 7/12 of the content on
 * desktop and full width on a phone, so a `vw` ramp would misread both. The var
 * supplies the ceiling, the ramp supplies everything below it, and the floor
 * stops a narrow column shrinking the copy past reading size.
 *
 * The chip and the time stay fixed. At 11px they are already at the floor, and
 * scaling them would buy a pixel at the cost of legibility.
 */
const TITLE_SIZE = "18px";
const DESC_SIZE = "14px";
const CHIP_SIZE = "11px";
const TIME_SIZE = "11px";

const TITLE_FS = `clamp(14px, calc(9px + 1.3cqi), var(--challenge-title-size, ${TITLE_SIZE}))`;
const DESC_FS = `clamp(11.5px, calc(8px + 0.9cqi), var(--challenge-desc-size, ${DESC_SIZE}))`;

function clampLines(lines: number, cssVar: string) {
  return {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: `var(${cssVar}, ${lines})`,
    overflow: "hidden",
  };
}

interface ActiveChallengeCardProps {
  /** Every live challenge. One shows at a time; the stepper moves between them. */
  challenges: DashboardChallenge[];
  /** Tuning seam for the preview harness. Production leaves this alone. */
  wallpaper?: Wallpaper;
  /** Opens the challenge. Omitted leaves Continue inert (previews). */
  onOpen?: (challengeId: string) => void;
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
 * One flower per live challenge, along the bottom of the panel.
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
    <div className="flex items-center justify-center gap-1.5">
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
            {/* Cream, not the hobby's accent. The stepper sits on the blue
                panel now, where a primary-theme flower would vanish into the
                background — the same reason the hobby chip is not themed. */}
            <FlowerShape
              size={isActive ? 16 : 12}
              color={isActive ? "var(--background)" : "rgba(255,255,255,0.4)"}
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
  onOpen,
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
      <div
        className="relative overflow-hidden rounded-2xl bg-[var(--primary)] p-[18px] text-white"
        style={{ containerType: "inline-size" }}
      >
        <HeroIconPattern
          useMask={false}
          iconSet="primary"
          iconOpacity={wallpaper.opacity}
          iconSpacing={wallpaper.spacing}
          iconSize={wallpaper.size}
        />

        {/* The body opens the challenge, matching every other challenge card in
            the app — those are clickable in full, and this being inert except
            for its small Continue button made the page's focal object the one
            thing you could not click. Deliberately not the whole panel: the
            stepper below switches between challenges and must not open one. */}
        <motion.div
          key={challenge.id}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          onClick={onOpen ? () => onOpen(challenge.id) : undefined}
          role={onOpen ? "button" : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onKeyDown={
            onOpen
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(challenge.id);
                  }
                }
              : undefined
          }
          className={`relative z-10 ${onOpen ? "cursor-pointer" : ""}`}
        >
          <div className="mb-2.5 flex items-center justify-between gap-3">
            {/* The landing header's outline button, borrowed: cream border and
                text on nothing. Not the hobby's accent — on a blue panel a blue
                accent disappears, and conditioning the chip on the theme would
                leave two hobbies looking like two different components. The
                hobby's colour is carried by its flower in the stepper below,
                which sits on cream and can hold it. */}
            <span
              className="min-w-0 truncate rounded-full border border-[var(--background)] px-2 py-1 font-medium text-[var(--background)]"
              style={{ fontSize: `var(--challenge-chip-size, ${CHIP_SIZE})` }}
            >
              {titleCase(challenge.hobbyName)}
            </span>
            {/* Naming the ask up front is the §8 "shrink the ask" move — the time
                was already fetched and thrown away before now. */}
            {challenge.estimatedTime && (
              <span
                className="flex flex-shrink-0 items-center gap-1 font-medium text-white/80"
                style={{ fontSize: `var(--challenge-time-size, ${TIME_SIZE})` }}
              >
                <ClockIcon className="h-3 w-3" />
                {challenge.estimatedTime}
              </span>
            )}
          </div>

          <p
            className="break-words font-bold leading-[1.35]"
            style={{
              ...clampLines(TITLE_LINES, "--challenge-title-lines"),
              fontSize: TITLE_FS,
            }}
          >
            {challenge.title}
          </p>
          {/* Held at its full clamp height while there is more than one
              challenge, so stepping through does not bounce the flowers up and
              down under the cursor that is clicking them. Skipped when there is
              no description — a floor under nothing is just a void. */}
          <p
            className="mt-[7px] break-words leading-[1.5] text-white/80"
            style={{
              ...clampLines(DESC_LINES, "--challenge-desc-lines"),
              fontSize: DESC_FS,
              ...(multiple && challenge.description
                ? {
                    minHeight: `calc(var(--challenge-desc-lines, ${DESC_LINES}) * ${DESC_LEADING} * ${DESC_FS})`,
                  }
                : {}),
            }}
          >
            {challenge.description}
          </p>

        </motion.div>

        {/* One bottom row: stepper centred in the card, Continue right, both
            sitting on the same baseline. It lives outside the keyed body
            because the stepper must not fade out and back in under the cursor
            that is clicking it — and Continue has nothing to animate. */}
        <div className="relative z-10 mt-[13px] grid grid-cols-[1fr_auto_1fr] items-end">
          <span aria-hidden />
          {multiple ? (
            <ChallengeStepper
              challenges={challenges}
              activeIndex={activeIndex}
              onSelect={setIndex}
            />
          ) : (
            <span aria-hidden />
          )}
          <div className="flex justify-end">
            <Button onClick={onOpen ? () => onOpen(challenge.id) : undefined} size="sm" variant="secondary">
              Continue
            </Button>
          </div>
        </div>
      </div>
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
