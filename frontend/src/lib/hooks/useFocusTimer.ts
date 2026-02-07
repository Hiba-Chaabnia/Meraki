"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "meraki-focus-timer";
/** The interval only forces a re-render; it is never the clock itself. */
const TICK_MS = 1000;

export type TimerState =
  | { status: "idle" }
  | { status: "running"; hobbySlug: string; endsAt: number; totalMinutes: number }
  | { status: "paused"; hobbySlug: string; remainingMs: number; totalMinutes: number };

const IDLE: TimerState = { status: "idle" };

function readStored(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimerState;
    if (parsed?.status === "running" || parsed?.status === "paused") return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStored(state: TimerState) {
  try {
    if (state.status === "idle") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — the timer still works for this page view */
  }
}

/** Milliseconds left, derived. Never accumulated. */
function remainingFor(state: TimerState, now: number): number {
  if (state.status === "running") return Math.max(0, state.endsAt - now);
  if (state.status === "paused") return state.remainingMs;
  return 0;
}

export interface FocusTimer {
  state: TimerState;
  remainingMs: number;
  start: (hobbySlug: string, minutes: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * A countdown that survives navigation and refresh.
 *
 * The clock is `endsAt - Date.now()`, not a tick counter. That is what makes it
 * correct — no drift, and a backgrounded tab (where browsers throttle timers to
 * once a minute) comes back showing the right number rather than a stale one.
 * It is also less code than counting down in state.
 *
 * @param onComplete Fired once, when a running timer reaches zero. The dashboard
 *   passes a handler that opens the session logger pre-filled. Abandoning a
 *   timer with `reset()` never fires it — an abandoned session is not a session.
 */
export function useFocusTimer(
  onComplete: (hobbySlug: string, minutes: number) => void,
): FocusTimer {
  const [state, setState] = useState<TimerState>(IDLE);
  const [now, setNow] = useState(() => Date.now());

  // Ref so a new callback identity never restarts the interval.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Guards against a re-render firing completion twice for one timer.
  const completedRef = useRef(false);

  /* Rehydrate in an effect, not a lazy useState initialiser: reading storage
     during render happens on the server too, where localStorage does not
     exist, and mismatches on hydration when it does. */
  useEffect(() => {
    const stored = readStored();
    if (!stored) return;

    // A timer that ran out while the tab was closed is over, not due. Firing
    // the logger for a session the user may never have practised would be a
    // guess; drop it and let them start again.
    if (stored.status === "running" && stored.endsAt <= Date.now()) {
      writeStored(IDLE);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(stored);
  }, []);

  /* One interval, alive only while running. It moves `now`, and when the clock
     has run out it settles the timer. Both live in the tick callback rather than
     in effect bodies — completion is an event, not a render-time derivation.
     Because the deadline is compared against Date.now(), a tab that was hidden
     (where browsers throttle timers to about once a minute) settles correctly on
     its first tick back rather than finishing a minute late. */
  useEffect(() => {
    if (state.status !== "running") return;

    const tick = () => {
      if (Date.now() < state.endsAt) {
        setNow(Date.now());
        return;
      }
      if (completedRef.current) return;

      completedRef.current = true;
      writeStored(IDLE);
      setState(IDLE);
      onCompleteRef.current(state.hobbySlug, state.totalMinutes);
    };

    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [state]);

  const commit = useCallback((next: TimerState) => {
    writeStored(next);
    setState(next);
  }, []);

  const start = useCallback(
    (hobbySlug: string, minutes: number) => {
      completedRef.current = false;
      setNow(Date.now());
      commit({
        status: "running",
        hobbySlug,
        endsAt: Date.now() + minutes * 60_000,
        totalMinutes: minutes,
      });
    },
    [commit],
  );

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "running") return prev;
      const next: TimerState = {
        status: "paused",
        hobbySlug: prev.hobbySlug,
        remainingMs: Math.max(0, prev.endsAt - Date.now()),
        totalMinutes: prev.totalMinutes,
      };
      writeStored(next);
      return next;
    });
  }, []);

  const resume = useCallback(() => {
    setNow(Date.now());
    setState((prev) => {
      if (prev.status !== "paused") return prev;
      const next: TimerState = {
        status: "running",
        hobbySlug: prev.hobbySlug,
        endsAt: Date.now() + prev.remainingMs,
        totalMinutes: prev.totalMinutes,
      };
      writeStored(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    completedRef.current = false;
    commit(IDLE);
  }, [commit]);

  return { state, remainingMs: remainingFor(state, now), start, pause, resume, reset };
}
