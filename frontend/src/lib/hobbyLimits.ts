/**
 * How many hobbies may be active at once.
 *
 * Paused ones do not count — that is the point of pausing, and a cap that
 * punished shelving something would push people to delete instead.
 *
 * Three is a deliberate constraint rather than a technical ceiling. A roadmap
 * is 4-5 stages of real practice, and "ten minutes is plenty" does not survive
 * four parallel commitments — the cap is the product telling you to finish
 * fewer things properly. It happens to suit the dashboard too: three is where
 * the week strip's stacked segments stay readable inside a 110px pillar, and
 * where the blue/lime alternation still separates one hobby from the next
 * without leaning on the legend.
 *
 * It lives here rather than in `app/actions/hobbies.ts` because that file is
 * `"use server"`, and a server-actions module may only export async functions —
 * a plain const compiles fine and then fails at runtime.
 */
export const MAX_ACTIVE_HOBBIES = 3;

/** The one sentence shown wherever the cap refuses something. */
export const CAP_MESSAGE = `You can have ${MAX_ACTIVE_HOBBIES} hobbies on the go at once. Pause one to make room.`;
