/**
 * Who the legal documents are between, and how to reach them.
 *
 * Kept here so the two documents can't drift, and so changing the operator is
 * one edit rather than a search across prose.
 */

/** The address published on the legal pages. */
export const CONTACT_EMAIL = "hiba.chaabnia.pro@gmail.com";

/**
 * Meraki is operated by an individual, not a company. Under GDPR this person is
 * the data controller; under Tunisia's Organic Law 2004-63 they are the party
 * responsible for the processing.
 */
export const OPERATOR_NAME = "Hiba Chaabnia";

/** Where the operator is established — sets governing law and venue. */
export const OPERATOR_COUNTRY = "Tunisia";

/**
 * Public source repository.
 *
 * The Terms deliberately don't restate the code licence — they point here and
 * let the LICENSE file govern. Two documents stating licence terms is two
 * documents that can contradict each other.
 */
export const REPO_URL = "https://github.com/Hiba-Chaabnia/Meraki";

/**
 * Decided: email only, no postal address.
 *
 * GDPR Art. 13(1)(a) expects the controller's identity and contact details;
 * for a sole operator running a free service, a monitored email address is
 * accepted in practice. Publishing a home address is a real and permanent
 * privacy cost for one person, and it isn't warranted here.
 *
 * Revisit if EU users become a meaningful share of the audience or if Meraki
 * ever becomes a registered company — at that point use the registered office,
 * not a home address. Set this to a string and it renders in "Who we are".
 */
export const OPERATOR_ADDRESS: string | null = null;
