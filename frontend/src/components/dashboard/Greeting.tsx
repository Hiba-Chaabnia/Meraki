"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/components/ui/animations";
import type { DashboardHobby, DashboardVariant, StreakState } from "@/lib/dashboardHome";

/**
 * What the greeting needs for its subtitle: the message and nothing else.
 *
 * It renders as prose, so there is no urgency to colour by, no hobby eyebrow
 * (the sentence names it when it matters), and no control of its own — a button
 * or an × here would be the card treatment coming back one element at a time.
 * `deriveNudge` in lib/nudge.ts is what fills it.
 */
export interface NudgeView {
  message: string;
}

export interface GreetingProps {
  variant: DashboardVariant;
  firstName: string;
  hobbies: DashboardHobby[];
  streak: StreakState;
  nudge?: NudgeView | null;
}

/**
 * Every state gets a header, `active` included — it is the one users see daily,
 * and it used to open on a bare row count.
 *
 * Re-entry without guilt throughout: no "you broke your streak", no
 * lost-progress framing, and the ask is shrunk rather than raised.
 *
 * The name lands on every title. It is the same shape each time, which is a
 * deliberate choice for consistency over variety.
 *
 * Every branch is on `/preview/greeting`, with and without a nudge.
 */
const SUBTITLE = "mt-1 text-[13px] leading-[1.55] text-[#6b7280]";

export function Greeting({ variant, firstName, hobbies, streak, nudge }: GreetingProps) {
  const gapDays = hobbies
    .map((h) => h.lastSessionDaysAgo)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)[0];

  let title: string;
  let line: ReactNode;

  if (variant === "all-paused") {
    title = `Everything's on pause, ${firstName}`;
    line = "Resume one whenever you're ready, or try something new.";
  } else if (variant === "dormant") {
    if (gapDays === undefined) {
      title = `Ready when you are, ${firstName}`;
      line = "Nothing logged yet. Start as small as you like.";
    } else {
      /* Not "Welcome back": they have opened a dashboard, not practised, and
         congratulating a return that has not happened is the note that makes
         this state read as performed warmth. */
      title = `No rush, ${firstName}`;
      line = `It's been ${gapDays} days. Everything's where you left it.`;
    }
  } else if (streak.loggedToday) {
    // Today is already covered — acknowledge it and ask for nothing further.
    title = `That's today done, ${firstName}`;
    line = "Anything else you do today is a bonus.";
  } else {
    /* Running normally. This branch once carried "<hobby> was yesterday. Ten
       minutes today would be plenty", cut because the timer below already says
       the second half — but cutting the whole line left the state
       headline-only, which reads as the page having nothing to tell you.

       What stands here is an offer rather than a fact: `deriveNudge` returns
       null when there is no lapse to name, and a derived "Pottery was
       yesterday." would be filler occupying the slot. */
    title = `Good to see you, ${firstName}`;
    line = "Today's yours whenever you want it.";
  }

  /* The derived sentence supersedes the static one rather than sitting beside
     it. Both say "it has been a while, that is fine" — the difference is that
     one of them knows how long and what you were doing. Stacking them would be
     the same insistence the `active` branch above dropped its line to avoid. */
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="min-w-0">
      {/* Truncated for the same reason as the subtitle, and it is not
          hypothetical: `firstName` falls back to the email local-part when a
          profile has no name, so "hiba.chaabnia.pro" is a realistic value and
          pushes the longest title past the 358px mobile box. */}
      <p className="truncate text-[19px] font-semibold text-[var(--foreground)]">{title}</p>

      {/* One line, always. `truncate` is the guarantee; the copy is written to
          fit inside it so the ellipsis stays a backstop.

          The budget is 60 characters, measured rather than guessed: at 13px
          this face runs 5.89px per character, and the narrowest real container
          is a 390px viewport less the 32px page gutter — 358px. Every template
          is checked at that width with the longest hobby name in the fixtures
          ("Watercolor Painting") substituted in. */}
      <p className={`${SUBTITLE} truncate`}>{nudge ? nudge.message : line}</p>
    </motion.div>
  );
}
