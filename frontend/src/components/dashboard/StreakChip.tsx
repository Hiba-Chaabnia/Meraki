"use client";

import type { StreakState } from "@/lib/dashboardHome";
import { OPEN_TODAY } from "./dashboardTokens";

const BASE = "inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12.5px]";

/**
 * Three variants, and this is load-bearing: the chip is the only place the page
 * says whether today is still open. Derived from the streak, never stored.
 *
 * It lives inside <PracticeWeek>, not the page header — it describes the same
 * week the blocks draw, and the two used to sit in opposite corners.
 */
export function StreakChip({ days, loggedToday }: StreakState) {
  if (days === 0) {
    return (
      <span className={`${BASE} bg-[var(--white-muted)] font-semibold text-[#6b7280]`}>
        No active streak
      </span>
    );
  }

  if (!loggedToday) {
    return (
      <span
        className={`${BASE} border border-[#FBD9A5] font-bold`}
        style={{ backgroundColor: OPEN_TODAY.bg, color: OPEN_TODAY.text }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: OPEN_TODAY.border }}
        />
        {days}-day streak · today&rsquo;s still open
      </span>
    );
  }

  return (
    <span className={`${BASE} bg-[#FFF1E8] font-bold text-[var(--coral)]`}>
      🔥 {days}-day streak
    </span>
  );
}
