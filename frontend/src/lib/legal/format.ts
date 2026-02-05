/**
 * Leaf module on purpose: LegalHeader is a client component, and importing this
 * from lib/legal/index would drag both documents' full text into its bundle.
 */

/** "31 July 2026" — spelled out so there's no US/EU ordering ambiguity. */
export function formatUpdated(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "31 Jul 2026" — the compact form used in the date chip. */
export function formatUpdatedShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
