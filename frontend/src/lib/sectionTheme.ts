export interface SectionTheme {
  bg: string;
  accent: string;
  border: string;
  light: string;
  textOnAccent?: string;
}

export const THEME_PRIMARY: SectionTheme = {
  bg: "var(--primary-theme-bg)",
  accent: "var(--primary-theme-accent)",
  border: "var(--primary-theme-border)",
  light: "var(--primary-theme-light)",
  textOnAccent: "var(--primary-theme-textOnAccent)",
};

export const THEME_SECONDARY: SectionTheme = {
  bg: "var(--secondary-theme-bg)",
  accent: "var(--secondary-theme-accent)",
  border: "var(--secondary-theme-border)",
  light: "var(--secondary-theme-light)",
  textOnAccent: "var(--secondary-theme-textOnAccent)",
};