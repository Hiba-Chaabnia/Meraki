/**
 * The alternating blue / lime card system.
 *
 * Values live as CSS variables in `src/app/globals.css` (`:root`) so they can be
 * used from plain CSS too. Import THEME_PRIMARY / THEME_SECONDARY here rather
 * than re-declaring the hexes in a component, and alternate collections with
 * `idx % 2 === 0 ? THEME_PRIMARY : THEME_SECONDARY`.
 */
export interface SectionTheme {
  /** Card surface fill */
  bg: string;
  /** Border, title text, icons — the theme's identity color */
  accent: string;
  /** Soft inner borders, unselected states, inactive progress dots */
  border: string;
  /** Tag / badge fill and ghost-button fill */
  light: string;
  /** Text placed on top of `accent` (lime needs dark text) */
  textOnAccent?: string;
}

export const THEME_PRIMARY: SectionTheme = {
  bg: "var(--primary-theme-bg)",
  accent: "var(--primary-theme-accent)",
  border: "var(--primary-theme-border)",
  light: "var(--primary-theme-light)",
  textOnAccent: "var(--primary-theme-on-accent)",
};

export const THEME_SECONDARY: SectionTheme = {
  bg: "var(--secondary-theme-bg)",
  accent: "var(--secondary-theme-accent)",
  border: "var(--secondary-theme-border)",
  light: "var(--secondary-theme-light)",
  textOnAccent: "var(--secondary-theme-on-accent)",
};

/** Paused / archived. Outside the alternation — nothing alternates into it. */
export const THEME_NEUTRAL: SectionTheme = {
  bg: "var(--neutral-theme-bg)",
  accent: "var(--neutral-theme-accent)",
  border: "var(--neutral-theme-border)",
  light: "var(--neutral-theme-light)",
  textOnAccent: "var(--neutral-theme-on-accent)",
};

/** Convenience for index-alternated collections. */
export const CARD_THEMES: [SectionTheme, SectionTheme] = [
  THEME_PRIMARY,
  THEME_SECONDARY,
];

/** Resolve a stored theme key (e.g. `DashboardHobby.theme`) to its quad. */
export function themeFor(key: "primary" | "secondary"): SectionTheme {
  return key === "primary" ? THEME_PRIMARY : THEME_SECONDARY;
}
