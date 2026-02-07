"use client";

import { themeFor } from "@/lib/sectionTheme";
import {
  weekBarFractions,
  weekScaleMinutes,
  type HobbyTheme,
  type StreakState,
  type WeekDay,
} from "@/lib/dashboardHome";
import { StreakChip } from "./StreakChip";
import { OPEN_TODAY } from "./dashboardTokens";

const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface PracticeWeekProps {
  days: WeekDay[];
  /** Every active hobby, so the legend names them even before anything is logged. */
  legend: { name: string; theme: HobbyTheme }[];
  streak: StreakState;
}

/** 45 → "45m", 135 → "2h 15m", 120 → "2h". */
function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function dayLabel(day: WeekDay, index: number): string {
  if (day.entries.length === 0) {
    return `${DAY_NAMES[index]} — nothing logged`;
  }
  const parts = day.entries.map((e) => `${e.name} ${formatMinutes(e.minutes)}`);
  return `${DAY_NAMES[index]} — ${parts.join(", ")}`;
}

/**
 * Seven pillars whose height is the time practised, stacked one segment per
 * hobby. The strip used to be seven flat 34px blocks that said only *whether*
 * you showed up; `session.duration` was fetched and thrown away. Height is what
 * makes a 90-minute Saturday read differently from a 10-minute one.
 *
 * With only two theme colours, a third hobby reuses one — so colour alone can
 * never disambiguate. Names do that job instead: the legend lists every active
 * hobby whether or not it was practised, and each pillar carries a label naming
 * that day's hobbies and minutes.
 *
 * This card owns the streak. It used to sit as a chip in the page header while
 * the card closed on "N of 7 days" — two readings of one week, in opposite
 * corners, that read as a contradiction ("12-day streak" / "1 of 7 days"). The
 * pillars already say how much; the chip says how the run is going.
 */
export function PracticeWeek({ days, legend, streak }: PracticeWeekProps) {
  const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
  const nothingLogged = days.every((d) => d.entries.length === 0);
  const scale = weekScaleMinutes(days);

  // A dead streak is not worth a chip — when there is also nothing in the week,
  // the sentence carries it, and "No active streak" would only pile on.
  const showStreak = streak.days > 0;

  return (
    <div className="rounded-2xl border border-[var(--white-muted)] bg-white p-[15px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* Total time, never "N of 7 days" — a day count next to a streak count
            is the contradiction this card was rebuilt to remove. */}
        <p className="text-[11.5px] text-[#6b7280]">
          {nothingLogged ? (
            <>
              Nothing logged yet —{" "}
              <strong className="font-bold text-[var(--foreground)]">
                today&rsquo;s still open.
              </strong>
            </>
          ) : (
            <>
              <strong className="font-bold text-[var(--foreground)]">
                {formatMinutes(totalMinutes)}
              </strong>{" "}
              this week
            </>
          )}
        </p>
        {showStreak && <StreakChip days={streak.days} loggedToday={streak.loggedToday} />}
      </div>

      <div className="flex gap-1.5">
        {days.map((day, i) => {
          const empty = day.entries.length === 0;
          // Today with nothing on it is an invitation, not a warning — unless the
          // whole week is empty, in which case it goes quiet grey instead of amber.
          const openToday = day.isToday && empty && !nothingLogged;
          const fractions = weekBarFractions(day, scale);

          let trackStyle: React.CSSProperties = { background: "var(--white-muted)" };
          if (openToday) {
            trackStyle = {
              background: OPEN_TODAY.bg,
              border: `1.5px dashed ${OPEN_TODAY.border}`,
            };
          } else if (day.isToday && empty) {
            trackStyle = {
              background: "var(--white-muted)",
              boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px #d8d1c9",
            };
          } else if (empty) {
            trackStyle = { background: "var(--white-muted)", opacity: day.isFuture ? 0.6 : 1 };
          } else if (day.isToday) {
            trackStyle = {
              background: "var(--white-muted)",
              boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px var(--primary)",
            };
          }

          return (
            <div key={day.date} className="min-w-0 flex-1 text-center">
              <div
                className="box-border flex h-[110px] flex-col justify-end gap-1 overflow-hidden rounded-xl p-1"
                style={trackStyle}
                title={dayLabel(day, i)}
                aria-label={dayLabel(day, i)}
              >
                {openToday && (
                  <span
                    className="mb-auto mt-auto text-[9px] font-extrabold uppercase tracking-wider"
                    style={{ color: OPEN_TODAY.text }}
                  >
                    Today
                  </span>
                )}
                {day.entries.map((entry, entryIndex) => (
                  <div
                    key={entry.slug}
                    className="w-full flex-shrink-0 rounded-md transition-[height] duration-500"
                    style={{
                      height: `${fractions[entryIndex] * 100}%`,
                      background: themeFor(entry.theme).accent,
                    }}
                  />
                ))}
              </div>
              <p
                className="mt-[5px] text-[10px] font-bold"
                style={{ color: day.isToday ? OPEN_TODAY.text : "#6b7280" }}
              >
                {DAY_INITIALS[i]}
              </p>
            </div>
          );
        })}
      </div>

      {legend.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-[var(--white-muted)] pt-3">
          {legend.map((item) => (
            <span
              key={item.name}
              className="inline-flex min-w-0 items-center gap-1.5 text-[10.5px] text-[#6b7280]"
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-sm"
                style={{ background: themeFor(item.theme).accent }}
              />
              <span className="truncate">{item.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
