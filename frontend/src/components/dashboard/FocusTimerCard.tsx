"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, MinusIcon, PlayIcon, PlusIcon } from "@/components/ui/Icons";
import { useFocusTimer } from "@/lib/hooks/useFocusTimer";
import type { DashboardHobby } from "@/lib/dashboardHome";

/** Shortcuts. Anything else is reached through Custom and the steppers. */
const PRESETS = [10, 20];
/** Multiples of 5, so every reachable value lands on the logger's step-5 slider. */
const MIN_MINUTES = 5;
const MAX_MINUTES = 120;
const STEP_MINUTES = 5;

/**
 * Everything here is fluid against the card's own inline size (`cqi`), not the
 * viewport: the card is 5/12 of the dashboard on desktop and full width on a
 * phone, so a `vw` ramp would misread both. The ceiling of each clamp is the
 * shipped size; the ramp covers every width below it, and the floor stops a
 * narrow column shrinking the card past reading size.
 */
const CLOCK_SIZE = "42px";
const CLOCK_FS = `clamp(30px, calc(13px + 7cqi), var(--focus-clock-size, ${CLOCK_SIZE}))`;
const CHIP_FS = "clamp(9.5px, calc(7.4px + 0.86cqi), 11px)";
const ACTION_FS = "clamp(11.5px, calc(9px + 1.05cqi), 13.5px)";

const CARD_PAD = "clamp(11px, 3.6cqi, 15px)";
const CLOCK_PAD = "clamp(12px, 4.3cqi, 18px)";
const CHIP_PAD_X = "clamp(7px, 2.9cqi, 12px)";
const CHIP_PAD_Y = "clamp(4px, 1.4cqi, 6px)";
const HOBBY_CHIP_MAX = "min(130px, 33cqi)";
const STEP_BTN = "clamp(28px, 8.5cqi, 34px)";

const CHIP_BOX = {
  fontSize: CHIP_FS,
  paddingInline: CHIP_PAD_X,
  paddingBlock: CHIP_PAD_Y,
} as const;
const ACTION_BOX = {
  fontSize: ACTION_FS,
  paddingInline: "clamp(10px, 3.8cqi, 16px)",
  paddingBlock: "clamp(6px, 1.9cqi, 8px)",
} as const;

const CHIP =
  "cursor-pointer rounded-full font-semibold transition-colors duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
const CHIP_OFF = "bg-[var(--white-muted)] text-[#6b7280] hover:text-[var(--foreground)]";
/* §2.3: lime is the "chosen" colour, and it needs dark text on it. One colour
   for every selected chip, not the hobby's own theme — two hobbies selected in
   two different colours read as two different controls. */
const SELECTED = "bg-[var(--secondary)] text-[var(--foreground)]";

interface FocusTimerCardProps {
  /**
   * Active hobbies only — you cannot practise a paused one. Capped at three,
   * which is what lets them be chips rather than a menu.
   */
  hobbies: DashboardHobby[];
  /** The dashboard's suggested hobby, so the picker usually needs no touching. */
  defaultHobbyId: string | null;
  onComplete: (hobbySlug: string, minutes: number) => void;
  /** Tuning seam for the preview harness. Production leaves this alone. */
  presets?: number[];
}

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${`${s}`.padStart(2, "0")}`;
}

/** Sub-minute values exist only so the preview can run a real timer to zero. */
function formatPreset(minutes: number): string {
  return minutes < 1 ? `${Math.round(minutes * 60)} s` : `${minutes} min`;
}

/**
 * A chip that opens a native picker.
 *
 * The `<select>` is a transparent overlay rather than the visible control, so
 * the chip can read "Select hobby" instead of echoing the current value.
 * Native means the phone's own wheel picker, which is where this collapsed
 * layout is used.
 */
function ChipSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <span
      className={`${CHIP} ${CHIP_OFF} relative inline-flex min-w-0 items-center gap-1 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      style={CHIP_BOX}
    >
      <span className="truncate">{label}</span>
      <ChevronDownIcon className="h-3 w-3 flex-shrink-0" />
      <select
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Marks the "Custom…" row in the duration picker, which is not a minute value. */
const CUSTOM_OPTION = "custom";

const HOBBY_LABEL = "Select hobby";
const TIME_LABEL = "Select time";

/**
 * How much of the top row is spelled out.
 *
 * `full` — every hobby and every duration as its own chip.
 * `hobby` — hobbies behind one picker, durations still spelled out.
 * `both` — one picker each.
 */
type RowMode = "full" | "hobby" | "both";

const MIRROR = "pointer-events-none invisible absolute left-0 top-0 flex w-max items-center gap-4";

/** A chip with no behaviour, for measuring a layout that is not on screen. */
function GhostChip({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className={`${CHIP} inline-flex items-center gap-1 ${wide ? "truncate" : ""}`}
      style={wide ? { ...CHIP_BOX, maxWidth: HOBBY_CHIP_MAX } : CHIP_BOX}
    >
      {children}
    </span>
  );
}

/**
 * Nudges the duration by five minutes.
 *
 * Shown only under Custom. The clock already displays the duration you are
 * about to commit to, so adjusting it in place is direct — and it needs no
 * field, no validation, no invalid state and no cancel-on-blur rule. Nothing
 * typeable means nothing to reject.
 */
function StepButton({
  dir,
  visible,
  disabled,
  onClick,
}: {
  dir: "down" | "up";
  /** Kept mounted when false, so leaving Custom or starting a timer fades. */
  visible: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "down" ? MinusIcon : PlusIcon;
  return (
    <button
      type="button"
      disabled={disabled || !visible}
      onClick={onClick}
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      aria-label={dir === "down" ? `${STEP_MINUTES} minutes less` : `${STEP_MINUTES} minutes more`}
      className={`flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--white-muted)] text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--white-soft)] active:scale-95 disabled:cursor-not-allowed ${
        visible ? "opacity-100" : "pointer-events-none scale-90 opacity-0"
      } ${disabled && visible ? "opacity-40" : ""}`}
      style={{ width: STEP_BTN, height: STEP_BTN }}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * "Ten minutes is plenty" as a button.
 *
 * The card's real job is the finish, not the countdown: at zero it hands the
 * hobby and the duration straight to the session logger, so a practised session
 * records itself instead of being estimated from memory later.
 *
 * One layout across all three states rather than a swap — the chips, the clock
 * and the two buttons stay where they are, and only their labels and enablement
 * change. Starting a timer should not reflow the card under the cursor that
 * just pressed Start.
 */
export function FocusTimerCard({
  hobbies,
  defaultHobbyId,
  onComplete,
  presets = PRESETS,
}: FocusTimerCardProps) {
  const { state, remainingMs, start, pause, resume, reset } = useFocusTimer(onComplete);

  const suggested = hobbies.find((h) => h.userHobbyId === defaultHobbyId) ?? hobbies[0] ?? null;
  const [slug, setSlug] = useState(suggested?.slug ?? "");
  const [minutes, setMinutes] = useState(presets[0]);
  /* The steppers are the custom mode, not an always-on control: two extra
     buttons beside the clock earn their space only once you have said the
     presets are not what you wanted. */
  const [custom, setCustom] = useState(false);

  /* Snapped to the step grid, not just offset by it: a preset that is not a
     multiple of five would otherwise carry its remainder forever, and the
     logger's slider only accepts multiples of five. */
  const step = (delta: number) =>
    setMinutes((m) => {
      const next = Math.round((m + delta) / STEP_MINUTES) * STEP_MINUTES;
      return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, next));
    });

  /* How much of the row still fits, measured rather than guessed at a
     breakpoint: it depends on how many hobbies there are and how long their
     names are, which a container query cannot know.

     The hobby chips give way first. Their width is the variable part — three
     long names cost far more than "10 min · 20 min · 30 min" — and the durations
     are a short fixed set worth keeping one tap away. */
  const rowRef = useRef<HTMLDivElement>(null);
  const mirrorFullRef = useRef<HTMLDivElement>(null);
  const mirrorHalfRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<RowMode>("full");

  useEffect(() => {
    const row = rowRef.current;
    const full = mirrorFullRef.current;
    const half = mirrorHalfRef.current;
    if (!row || !full || !half) return;

    // ResizeObserver fires once on observe, so the first measurement comes from
    // the callback too — no setState in the effect body.
    const observer = new ResizeObserver(() => {
      const width = row.clientWidth;
      setMode(
        width >= full.offsetWidth ? "full" : width >= half.offsetWidth ? "hobby" : "both",
      );
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  if (hobbies.length === 0) return null;

  const running = state.status === "running";
  const busy = running || state.status === "paused";

  const selectedSlug = busy ? state.hobbySlug : slug;
  const chosen = hobbies.find((h) => h.slug === selectedSlug) ?? suggested;
  const shownMinutes = busy ? state.totalMinutes : minutes;

  /* Idle shows the duration you are about to commit to, so the number you
     picked is the number you see before you press Start. */
  const clockMs = busy ? remainingMs : shownMinutes * 60_000;

  const hobbyGhosts = hobbies.map((h) => (
    <GhostChip key={h.userHobbyId} wide>
      {h.name}
    </GhostChip>
  ));
  const timeGhosts = [
    ...presets.map((m) => <GhostChip key={m}>{formatPreset(m)}</GhostChip>),
    <GhostChip key="custom">Custom</GhostChip>,
  ];

  return (
    <div
      className="rounded-2xl border border-[var(--white-muted)] bg-white"
      style={{ containerType: "inline-size", padding: CARD_PAD }}
    >
      {/* `overflow-hidden` is for the mirrors below: each is wider than this box
          whenever its layout is the one being ruled out, and an absolutely
          positioned overflow still extends an ancestor's scrollable area. */}
      <div ref={rowRef} className="relative overflow-hidden">
        {/* Two off-screen mirrors, each at its layout's natural width. Plain
            spans, not the real controls: only width matters here, and copying
            the controls would copy them for a screen reader too. Neither
            mirror's width depends on the chosen mode, which is what stops the
            layouts flipping each other. */}
        <div ref={mirrorFullRef} aria-hidden className={MIRROR}>
          <div className="flex items-center gap-1.5">{hobbyGhosts}</div>
          <div className="flex items-center gap-1.5">{timeGhosts}</div>
        </div>
        <div ref={mirrorHalfRef} aria-hidden className={MIRROR}>
          <GhostChip>
            {HOBBY_LABEL}
            <ChevronDownIcon className="h-3 w-3" />
          </GhostChip>
          <div className="flex items-center gap-1.5">{timeGhosts}</div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {mode === "full" ? (
            <div className="flex min-w-0 items-center gap-1.5">
              {hobbies.map((h) => {
                const on = h.slug === selectedSlug;
                return (
                  <button
                    key={h.userHobbyId}
                    type="button"
                    onClick={() => setSlug(h.slug)}
                    disabled={busy}
                    aria-pressed={on}
                    className={`${CHIP} truncate ${on ? SELECTED : CHIP_OFF}`}
                    style={{ ...CHIP_BOX, maxWidth: HOBBY_CHIP_MAX }}
                  >
                    {h.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <ChipSelect
              label={HOBBY_LABEL}
              value={selectedSlug}
              disabled={busy}
              onChange={setSlug}
              options={hobbies.map((h) => ({ value: h.slug, label: h.name }))}
            />
          )}

          {mode === "both" ? (
            <ChipSelect
              label={TIME_LABEL}
              value={custom ? CUSTOM_OPTION : String(minutes)}
              disabled={busy}
              onChange={(v) => {
                setCustom(v === CUSTOM_OPTION);
                if (v !== CUSTOM_OPTION) setMinutes(Number(v));
              }}
              options={[
                ...presets.map((m) => ({ value: String(m), label: formatPreset(m) })),
                { value: CUSTOM_OPTION, label: "Custom…" },
              ]}
            />
          ) : (
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {presets.map((m) => {
                const on = !custom && minutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setCustom(false);
                      setMinutes(m);
                    }}
                    disabled={busy}
                    aria-pressed={on}
                    className={`${CHIP} ${on ? SELECTED : CHIP_OFF}`}
                    style={CHIP_BOX}
                  >
                    {formatPreset(m)}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCustom(true)}
                disabled={busy}
                aria-pressed={custom}
                className={`${CHIP} ${custom ? SELECTED : CHIP_OFF}`}
                style={CHIP_BOX}
              >
                Custom
              </button>
            </div>
          )}
        </div>
      </div>
      {/* The steppers flank the clock rather than sitting in the chip row: the
          number they change is the one on screen. `1fr` on both sides keeps the
          clock centred on the card whatever the buttons measure — and keeps it
          centred in the same place when they are not there at all. */}
      <div
        className="grid grid-cols-[1fr_auto_1fr] items-center"
        style={{ paddingBlock: CLOCK_PAD }}
      >
        <div className="flex justify-end">
          <StepButton
            dir="down"
            visible={custom && !busy}
            disabled={minutes <= MIN_MINUTES}
            onClick={() => step(-STEP_MINUTES)}
          />
        </div>
        <p
          role="timer"
          className="px-3 text-center font-bold leading-none tabular-nums text-[var(--foreground)]"
          style={{ fontSize: CLOCK_FS }}
        >
          {formatClock(clockMs)}
        </p>
        <div className="flex justify-start">
          <StepButton
            dir="up"
            visible={custom && !busy}
            disabled={minutes >= MAX_MINUTES}
            onClick={() => step(STEP_MINUTES)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1"
          style={ACTION_BOX}
          disabled={!chosen}
          onClick={() => {
            if (running) return pause();
            if (state.status === "paused") return resume();
            if (chosen) start(chosen.slug, minutes);
          }}
        >
          <span className="flex items-center justify-center gap-1.5">
            {!running && <PlayIcon className="h-3.5 w-3.5" />}
            {running ? "Pause" : state.status === "paused" ? "Resume" : "Start Focus Timer"}
          </span>
        </Button>
        {/* Reset logs nothing — an abandoned session is not a session. */}
        <Button
          size="sm"
          variant="ghost"
          className="flex-1"
          style={ACTION_BOX}
          disabled={!busy}
          onClick={reset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
