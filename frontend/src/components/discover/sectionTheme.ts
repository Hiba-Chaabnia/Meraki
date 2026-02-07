export interface SectionTheme {
  bg: string;
  accent: string;
  border: string;
  light: string;
  textOnAccent?: string;
}

export const SECTION_THEME: Record<string, SectionTheme> = {
  time:       { bg: "#EBF2FE", accent: "#5396F4", border: "#BAD5FB", light: "#D6E8FD" },
  creative:   { bg: "#FFF0E6", accent: "#FF9149", border: "#FFCBA4", light: "#FFE0CC" },
  learning:   { bg: "#F5F9E0", accent: "#8FB52A", border: "#DDEB85", light: "#EBF4B8" },
  social:     { bg: "#FFF8E0", accent: "#E6B800", border: "#FFE999", light: "#FFF2B8" },
  budget:     { bg: "#E8F5EE", accent: "#4A9D6E", border: "#A8D8BC", light: "#C8E8D6" },
  motivation: { bg: "#EBF0FE", accent: "#65A1F5", border: "#AACCFC", light: "#CDE0FD" },
  sensory:    { bg: "#FDE8EE", accent: "#D4628A", border: "#F4B4C5", light: "#F9D4DF" },
  practical:  { bg: "#E4F2F0", accent: "#3D9E8F", border: "#A0D4CA", light: "#C2E4DD" },
  reflection: { bg: "#F3EEFE", accent: "#8B6CCF", border: "#C9B8F0", light: "#DDD0F5" },
};
