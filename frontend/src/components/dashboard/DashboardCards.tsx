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
  /** Hobbies with no live challenge, as extra steps offering to build one.
   *  They sort after every real challenge — what you have comes before what you
   *  could have. */
  offers?: ChallengeOffer[];
  /** Tuning seam for the preview harness. Production leaves this alone. */
  wallpaper?: Wallpaper;
  /** Opens the challenge. Omitted leaves Continue inert (previews). */
  onOpen?: (challengeId: string) => void;
  /** Slugs with a challenge build in flight. */
  generatingSlugs?: Set<string>;
  /** Slug -> why the last build failed. */
  errors?: Record<string, string>;
  /** Build a challenge. Omitted leaves the offer steps out entirely. */
  onGenerate?: (hobbySlug: string) => void;
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

interface StepperItem {
  key: string;
  label: string;
}

interface ChallengeStepperProps {
  items: StepperItem[];
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
function ChallengeStepper({ items, activeIndex, onSelect }: ChallengeStepperProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {items.map((item, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(idx)}
            aria-label={`${idx + 1} of ${items.length}: ${item.label}`}
            aria-current={isActive ? "true" : undefined}
            className="cursor-pointer outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
          >
            {/* Cream, not the hobby's accent. The stepper sits on the blue
                panel now, where a primary-theme flower would vanish into the
                background — the same reason the hobby chip is not themed. */}
            <FlowerShape
              size={isActive ? 16 : 12}
              color={isActive ? "var(--background)" : "rgba(255,255,255,0.4)"}
              gradientId={`challenge-flower-${item.key}`}
            />
          </button>
        );
      })}
    </div>
  );
}

/** An active hobby with a roadmap but no live challenge — a step that offers one. */
export interface ChallengeOffer {
  userHobbyId: string;
  slug: string;
  name: string;
}

/**
 * One step of the focus slot: a challenge you have, or one you could build.
 *
 * Both are the same panel because they are the same slot. Splitting them into
 * two components meant generating a challenge for one hobby hid the offer for
 * every other — the slot flipped to `ActiveChallengeCard` and the two hobbies
 * still without one had no route from the dashboard at all.
 */
type Slot =
  | { kind: "challenge"; key: string; label: string; challenge: DashboardChallenge }
  | { kind: "offer"; key: string; label: string; offer: ChallengeOffer };

export function ActiveChallengeCard({
  challenges,
  offers = [],
  wallpaper = CHALLENGE_WALLPAPER,
  onOpen,
  generatingSlugs,
  errors,
  onGenerate,
}: ActiveChallengeCardProps) {
  const [index, setIndex] = useState(0);
  /* The hobby a build was just started for. Generating reorders the slots
     underneath you — the new challenge moves to the front and every offer
     shifts down — so holding a fixed index left you looking at a *different*
     hobby's offer and concluding nothing had been generated. */
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  /* Challenges first, offers after: the stepper reads as "here is what you are
     on", then "here is what else you could start". */
  const slots: Slot[] = [
    ...challenges.map(
      (c): Slot => ({ kind: "challenge", key: c.id, label: c.title, challenge: c }),
    ),
    ...(onGenerate
      ? offers.map(
          (o): Slot => ({
            kind: "offer",
            key: o.userHobbyId,
            label: o.name + " \u2014 no challenge yet",
            offer: o,
          }),
        )
      : []),
  ];

  if (slots.length === 0) return null;

  /* Follow the build to wherever it landed, then fall back to the chosen step.
     Derived rather than an effect: the slot the user should be looking at is a
     function of the list they were handed, not a correction applied after a
     render that already showed the wrong one. */
  const landedIndex = pendingSlug
    ? slots.findIndex((s) => s.kind === "challenge" && s.challenge.hobbySlug === pendingSlug)
    : -1;

  /* Clamped on the way out, not corrected in an effect: a poll that retires a
     challenge can shrink the list underneath a stale index. */
  const activeIndex = landedIndex >= 0 ? landedIndex : Math.min(index, slots.length - 1);
  const slot = slots[activeIndex];
  const multiple = slots.length > 1;

  const hobbyName = slot.kind === "challenge" ? slot.challenge.hobbyName : slot.offer.name;
  const generating = slot.kind === "offer" && Boolean(generatingSlugs?.has(slot.offer.slug));
  const error = slot.kind === "offer" ? errors?.[slot.offer.slug] : undefined;

  const openChallenge =
    slot.kind === "challenge" && onOpen ? () => onOpen(slot.challenge.id) : undefined;

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
            the app - those are clickable in full, and this being inert except
            for its small Continue button made the page's focal object the one
            thing you could not click. Deliberately not the whole panel: the
            stepper below switches between slots and must not open one. An offer
            step is not clickable through: its only action is its button. */}
        <motion.div
          key={slot.key}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          onClick={openChallenge}
          role={openChallenge ? "button" : undefined}
          tabIndex={openChallenge ? 0 : undefined}
          onKeyDown={
            openChallenge
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openChallenge();
                  }
                }
              : undefined
          }
          className={`relative z-10 ${openChallenge ? "cursor-pointer" : ""}`}
        >
          <div className="mb-2.5 flex items-center justify-between gap-3">
            {/* The landing header's outline button, borrowed: cream border and
                text on nothing. Not the hobby's accent - on a blue panel a blue
                accent disappears, and conditioning the chip on the theme would
                leave two hobbies looking like two different components. The
                hobby's colour is carried by its flower in the stepper below,
                which sits on cream and can hold it. */}
            <span
              className="min-w-0 truncate rounded-full border border-[var(--background)] px-2 py-1 font-medium text-[var(--background)]"
              style={{ fontSize: `var(--challenge-chip-size, ${CHIP_SIZE})` }}
            >
              {titleCase(hobbyName)}
            </span>
            {/* Naming the ask up front is the section 8 "shrink the ask" move -
                the time was already fetched and thrown away before now. An offer
                has no time to name: the challenge does not exist yet. */}
            {slot.kind === "challenge" && slot.challenge.estimatedTime && (
              <span
                className="flex flex-shrink-0 items-center gap-1 font-medium text-white/80"
                style={{ fontSize: `var(--challenge-time-size, ${TIME_SIZE})` }}
              >
                <ClockIcon className="h-3 w-3" />
                {slot.challenge.estimatedTime}
              </span>
            )}
          </div>

          <p
            className="break-words font-bold leading-[1.35]"
            style={{
              ...(slot.kind === "challenge"
                ? clampLines(TITLE_LINES, "--challenge-title-lines")
                : {}),
              fontSize: TITLE_FS,
            }}
          >
            {slot.kind === "challenge" ? slot.challenge.title : "No challenge on the go"}
          </p>

          {/* Held at its full clamp height while there is more than one slot, so
              stepping through does not bounce the flowers up and down under the
              cursor that is clicking them. */}
          <p
            className="mt-[7px] break-words leading-[1.5] text-white/80"
            style={{
              ...(slot.kind === "challenge"
                ? clampLines(DESC_LINES, "--challenge-desc-lines")
                : {}),
              fontSize: DESC_FS,
              ...(multiple
                ? {
                    minHeight: `calc(var(--challenge-desc-lines, ${DESC_LINES}) * ${DESC_LEADING} * ${DESC_FS})`,
                  }
                : {}),
            }}
          >
            {slot.kind === "challenge" ? (
              slot.challenge.description
            ) : (
              <>
                Want <em>something small to try</em>? One prompt, built around where you are on
                your path.
              </>
            )}
          </p>
        </motion.div>

        {/* One bottom row: stepper centred in the card, the action right, both
            sitting on the same baseline. It lives outside the keyed body
            because the stepper must not fade out and back in under the cursor
            that is clicking it - and the button has nothing to animate. */}
        <div className="relative z-10 mt-[13px] grid grid-cols-[1fr_auto_1fr] items-end">
          <span aria-hidden />
          {multiple ? (
            <ChallengeStepper
              items={slots}
              activeIndex={activeIndex}
              onSelect={(idx) => {
                setPendingSlug(null);
                setIndex(idx);
              }}
            />
          ) : (
            <span aria-hidden />
          )}
          <div className="flex justify-end">
            {slot.kind === "challenge" ? (
              <Button onClick={openChallenge} size="sm" variant="secondary">
                Continue
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={generating}
                onClick={
                  onGenerate
                    ? () => {
                        setPendingSlug(slot.offer.slug);
                        onGenerate(slot.offer.slug);
                      }
                    : undefined
                }
              >
                {generating ? "Building\u2026" : "Generate a challenge"}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p className="relative z-10 mt-2.5 rounded-xl bg-[var(--background)] p-2 text-[11.5px] leading-relaxed text-yellow-800">
            {error}
          </p>
        )}
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
