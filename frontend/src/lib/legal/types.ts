import type { ReactNode } from "react";

/**
 * Legal documents are stored as data, not as hand-written page markup.
 *
 * The reason is the numbering: the old privacy/terms pages typed "1." … "11."
 * directly into the JSX, so inserting a section meant renumbering every heading
 * below it by hand — and the table of contents, if there had been one, would
 * have had to be kept in sync separately. Here the number is the array index,
 * and the rail, the anchors and the headings all read from one list.
 *
 * `body` stays a ReactNode because legal copy genuinely needs links, lists and
 * emphasis. It is styled by the `.legal-prose` component class in globals.css
 * rather than by classes inside the content, so the content files stay readable
 * as prose.
 */
export interface LegalSection {
  /** URL fragment. Stable and public — changing one breaks inbound links. */
  id: string;
  title: string;
  body: ReactNode;
}

export type LegalSlug = "privacy" | "terms";

export interface LegalDoc {
  slug: LegalSlug;
  /** Full title, used for the <h1> and the page metadata. */
  title: string;
  /** Short form for the document switcher, where space is tight. */
  shortTitle: string;
  /** ISO date. Formatted for display, and emitted as <time dateTime>. */
  updated: string;
  /** One or two paragraphs above section 1. */
  intro: ReactNode;
  sections: LegalSection[];
  /**
   * Contact is deliberately NOT a numbered section — it's an invitation, not a
   * clause, and burying it as "11." made it read like one. It closes the page
   * as a themed card carrying the document's sign-off and the email CTA.
   */
  contact: {
    heading: string;
    body: ReactNode;
  };
}
