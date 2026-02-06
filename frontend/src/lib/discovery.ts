/**
 * Client-side knowledge about the discovery job.
 *
 * Deliberately NOT in `app/actions/discovery.ts`: that file is `"use server"`,
 * and a server-actions module may only export async functions. A runtime value
 * exported from there becomes a server reference, not the value itself.
 */

/**
 * The phases of a discovery job, in order — one label per progress tick.
 *
 * The backend reports progress as a count of finished phases: three crew tasks
 * plus a final persist step.
 *
 *   1  analyze_profile_task          → builds a profile from all 22 answers
 *   2  rank_hobbies_task             → ranks hobbies against constraints + prefs
 *   3  generate_recommendations_task → writes the final matches + encouragement
 *   4  save_hobby_matches()          → persists them, before status flips
 *
 * This array's length must equal `DISCOVERY_TOTAL_STEPS` in
 * `backend/src/meraki_flow/api.py`. If you add or remove a crew task, update
 * both.
 */
export const DISCOVERY_STEPS = [
  "Reading your answers",
  "Analyzing your preferences",
  "Preparing your matches",
  "Saving your results",
] as const;
