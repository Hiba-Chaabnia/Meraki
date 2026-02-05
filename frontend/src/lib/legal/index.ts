import { PRIVACY } from "./privacy";
import { TERMS } from "./terms";
import type { LegalDoc, LegalSlug } from "./types";

export type { LegalDoc, LegalSection, LegalSlug } from "./types";
export { PRIVACY } from "./privacy";
export { TERMS } from "./terms";
export { CONTACT_EMAIL } from "./contact";
export { formatUpdated, formatUpdatedShort } from "./format";

/** Order here is the order in the document switcher. */
export const LEGAL_DOCS: LegalDoc[] = [PRIVACY, TERMS];

/** The document a reader would go to next — powers the header cross-link. */
export function getOtherDoc(slug: LegalSlug): LegalDoc {
  return slug === "privacy" ? TERMS : PRIVACY;
}

export function getLegalDoc(slug: LegalSlug): LegalDoc {
  return slug === "privacy" ? PRIVACY : TERMS;
}
