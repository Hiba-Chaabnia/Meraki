"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFocusTimer } from "@/lib/hooks/useFocusTimer";
import type { DashboardHobby } from "@/lib/dashboardHome";

/** Multiples of 5, so they land cleanly on the logger's step-5 slider. */
const PRESETS = [10, 20, 30];

interface FocusTimerCardProps {
  /** Active hobbies only — you cannot practise a paused one. */
  hobbies: DashboardHobby[];
  /** The dashboard's suggested hobby, so the picker usually needs no touching. */
  defaultHobbyId: string | null;
  onComplete: (hobbySlug: string, minutes: number) => void;
}

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${`${s}`.padStart(2, "0")}`;
}

/**
 * "Ten minutes is plenty" as a button.
 *
 * The card's real job is the finish, not the countdown: at zero it hands the
 * hobby and the duration straight to the session logger, so a practised session
 * records itself instead of being estimated from memory later.
 */
export function FocusTimerCard({ hobbies, defaultHobbyId, onComplete }: FocusTimerCardProps) {
  const { state, remainingMs, start, pause, resume, reset } = useFocusTimer(onComplete);

  const suggested = hobbies.find((h) => h.userHobbyId === defaultHobbyId) ?? hobbies[0] ?? null;
  const [slug, setSlug] = useState(suggested?.slug ?? "");
  const [minutes, setMinutes] = useState(PRESETS[0]);

  if (hobbies.length === 0) return null;

  const chosen = hobbies.find((h) => h.slug === slug) ?? suggested;
  const running = state.status === "running";
  const active = running || state.status === "paused";
  const activeHobby = active
    ? (hobbies.find((h) => h.slug === state.hobbySlug)?.name ?? "your hobby")
    : null;

  return (
    <div className="rounded-2xl border border-[var(--white-muted)] bg-white p-[15px]">
      {active ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[32px] font-semibold leading-none tabular-nums text-[var(--foreground)]">
              {formatClock(remainingMs)}
            </p>
            <p className="mt-1.5 truncate text-[11.5px] text-[#6b7280]">
              {activeHobby}
              {running ? "" : " · paused"}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Button size="sm" onClick={running ? pause : resume}>
              {running ? "Pause" : "Resume"}
            </Button>
            {/* Reset logs nothing — an abandoned session is not a session. */}
            <Button
              size="sm"
              variant="outline"
              outlineColor="#d1d5db"
              outlineHoverColor="#6b7280"
              onClick={reset}
            >
              Reset
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-[12.5px] text-[#6b7280]">
              <em>Ten minutes</em> is plenty.
            </p>
            <div className="flex items-center gap-1.5">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  aria-pressed={minutes === m}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 active:scale-95 ${
                    minutes === m
                      ? "bg-[var(--foreground)] text-white"
                      : "bg-[var(--white-muted)] text-[#6b7280] hover:text-[var(--foreground)]"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* A picker only where there is a choice; one hobby needs no menu. */}
            {hobbies.length > 1 ? (
              <select
                value={chosen?.slug ?? ""}
                onChange={(e) => setSlug(e.target.value)}
                aria-label="Hobby to practise"
                className="min-w-0 flex-1 cursor-pointer rounded-xl border border-[var(--white-muted)] bg-white px-3 py-2 text-[12.5px] font-medium text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {hobbies.map((h) => (
                  <option key={h.userHobbyId} value={h.slug}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--foreground)]">
                {chosen?.name}
              </p>
            )}

            <Button
              size="sm"
              disabled={!chosen}
              onClick={() => chosen && start(chosen.slug, minutes)}
              className="flex-shrink-0"
            >
              Start
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
