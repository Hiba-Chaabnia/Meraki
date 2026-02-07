/**
 * The "today's still open" amber.
 *
 * Not a brand token on purpose: it is a semantic state, and §2.3 of
 * src/CLAUDE.md puts those on low-saturation soft pairs rather than the cream /
 * blue / lime palette. It lives here because <StreakChip> and <PracticeWeek>
 * both draw it and had each hardcoded the same three hexes.
 */
export const OPEN_TODAY = {
  /** Tint fill — dashed pillar, chip background. */
  bg: "#FEF3E2",
  /** Border and dot. */
  border: "#F59E0B",
  /** Text on the tint. */
  text: "#B45309",
} as const;
