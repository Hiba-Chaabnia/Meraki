/**
 * Every piece of spacing on the legal pages, in one object.
 *
 * This used to be a component prop, tunable at runtime by a slider panel in
 * the preview, while the values were being worked out with the user. That
 * panel is gone now that the values are settled — this is a plain constant,
 * imported directly by LegalHeader / LegalPage / LegalRail.
 *
 * Applied as inline styles rather than Tailwind classes because building class
 * names from variables is forbidden (Tailwind can't see them, so they never
 * reach the compiled stylesheet). Inline `style` is the project's sanctioned
 * route for dynamic-but-fixed values like these; see frontend/CLAUDE.md.
 *
 * All values are px except `measureCh`, which is `ch` because it caps line
 * length and should scale with the font, not the layout.
 */
export interface LegalSpacing {
  /** Height of the fixed header bar. */
  headerH: number;
  /** Horizontal gutter — used by BOTH the header and the page shell, so the
   *  logo lines up with the document's left edge. */
  gutterX: number;
  /** Vertical padding above and below the two-column shell. */
  shellY: number;
  /** Space between the document column and the contents rail. */
  columnGap: number;
  /** Width of the contents rail. */
  railWidth: number;
  /** How far below the header the rail sticks, and how far below it an
   *  anchored section heading lands. */
  stickyOffset: number;
  /** Space below the title + date chip block. */
  titleGap: number;
  /** Space between the title and the date chip. */
  chipGap: number;
  /** Space below the intro paragraphs. */
  introGap: number;
  /** Space between numbered sections. */
  sectionGap: number;
  /** Space between a section's heading row and its body. */
  sectionHeadingGap: number;
  /** Gap between the flower marker and the section heading. */
  markerGap: number;
  /** Padding inside the contact card. */
  contactPad: number;
  /** Line-length cap for the prose and the contact card, in `ch`. */
  measureCh: number;
}

export const LEGAL_SPACING: LegalSpacing = {
  headerH: 64,
  gutterX: 96,
  shellY: 56,
  columnGap: 36,
  /* Wide enough that the longest heading in either document — "Why We Use It,
     and on What Basis", ~231px at this font/size — fits on one line inside
     the card, including its padding and the marker column. Measured directly
     in-browser rather than guessed, since Mulish is proportional. */
  railWidth: 320,
  stickyOffset: 24,
  chipGap: 12,
  /* A single 24px rhythm below the title, below the intro, between sections,
     and between a heading and its body — one value, deliberately uniform. */
  titleGap: 24,
  introGap: 24,
  sectionGap: 24,
  sectionHeadingGap: 24,
  markerGap: 14,
  contactPad: 36,
  measureCh: 120,
};
