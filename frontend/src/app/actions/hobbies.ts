"use server";

import { createClient } from "@/lib/supabase/server";
import { triggerRoadmapGeneration } from "./roadmap";
import { requireAuth } from "@/lib/supabase/requireAuth";
import type { Database } from "@/types/database.types";
import { CAP_MESSAGE, MAX_ACTIVE_HOBBIES } from "@/lib/hobbyLimits";

type UserHobbyRow = Database["public"]["Tables"]["user_hobbies"]["Row"];

/**
 * Both halves optional, rather than `{error} | {data}`.
 *
 * A bare union forces every caller to narrow before it can read `.error`, and
 * these are all called as `const res = await …; if (res.error)`. Declaring the
 * shape also stops the inferred type shifting under the actions whenever a
 * column is added — which is exactly what broke when `custom_name` landed.
 */
interface HobbyResult<T = UserHobbyRow> {
  error?: string;
  data?: T;
}

const SLUG_RE = /^[a-z0-9-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * 'completed' was dropped in 005. It was never set or read, and it contradicts
 * a product built on exploration rather than finishing — 'paused' covers "not
 * right now", deleting covers "not ever", and reaching the last roadmap stage
 * is an achievement for milestones, not a resting state.
 */
type HobbyStatus = "sampling" | "active" | "paused";
const HOBBY_STATUSES = new Set<string>(["sampling", "active", "paused"]);

/** Active hobbies for a user, for the cap. Excludes paused and completed. */
async function countActive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  excludeUserHobbyId?: string,
): Promise<number> {
  let query = supabase
    .from("user_hobbies")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  // Re-activating a row must not count itself as a competitor.
  if (excludeUserHobbyId) query = query.neq("id", excludeUserHobbyId);

  const { count } = await query;
  return count ?? 0;
}

const capReached = (): HobbyResult<never> => ({ error: CAP_MESSAGE });

/**
 * Every hobby, with its practice totals folded in.
 *
 * The totals are a second, deliberately narrow query — two columns, no join —
 * rather than an embedded aggregate, because PostgREST cannot give both a count
 * and a max() per parent in one embed.
 *
 * They matter because `toActiveHobby` used to hardcode `totalSessions: 0` and
 * `lastSessionDaysAgo: 0`, the row carrying neither. Every surface reading an
 * `ActiveHobby` therefore showed "0 sessions" regardless of the truth — the
 * profile's hobby list said it in plain text. It also meant ordering hobbies by
 * recency was impossible without fetching every session, which is why the hobby
 * page pulled the whole account just to pick its own colour.
 */
export async function getUserHobbies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("user_hobbies")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return { error: error.message };

  const { data: sessions, error: sessionsError } = await supabase
    .from("practice_sessions")
    .select("user_hobby_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    // Not fatal: the hobbies are the answer, the totals are the trimming.
    console.error("[getUserHobbies] Session totals failed:", sessionsError.message);
    return { data };
  }

  const totals = new Map<string, { count: number; lastAt: string }>();
  for (const s of sessions ?? []) {
    if (!s.user_hobby_id) continue;
    const existing = totals.get(s.user_hobby_id);
    // Newest-first, so the first row seen for a hobby is its latest.
    if (existing) existing.count += 1;
    else totals.set(s.user_hobby_id, { count: 1, lastAt: s.created_at });
  }

  return {
    data: (data ?? []).map((h) => ({
      ...h,
      session_count: totals.get(h.id)?.count ?? 0,
      last_session_at: totals.get(h.id)?.lastAt ?? null,
    })),
  };
}

export async function addUserHobby(
  hobbySlug: string,
  status: "sampling" | "active" = "sampling",
): Promise<HobbyResult> {
  if (!hobbySlug || !SLUG_RE.test(hobbySlug)) return { error: "Invalid hobby slug." };
  if (!HOBBY_STATUSES.has(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  /* The upsert makes re-adding an existing hobby a no-op rather than a second
     row, so only a genuinely new active hobby can push past the cap. Checking
     for an existing row first keeps "re-add what you already have" working
     even when you are full. */
  if (status === "active") {
    const { data: existing } = await supabase
      .from("user_hobbies")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("hobby_slug", hobbySlug)
      .maybeSingle();

    if (existing?.status !== "active" && (await countActive(supabase, user.id)) >= MAX_ACTIVE_HOBBIES) {
      return capReached();
    }
  }

  const { data, error } = await supabase
    .from("user_hobbies")
    .upsert(
      {
        user_id: user.id,
        hobby_slug: hobbySlug,
        status,
      },
      { onConflict: "user_id,hobby_slug" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateHobbyStatus(
  userHobbyId: string,
  status: HobbyStatus,
): Promise<HobbyResult> {
  if (!userHobbyId || !UUID_RE.test(userHobbyId)) return { error: "Invalid user hobby ID." };
  if (!HOBBY_STATUSES.has(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  /* Resuming counts against the cap too. Without this, pause-then-resume is a
     one-click way past it and the limit means nothing. */
  if (status === "active" && (await countActive(supabase, user.id, userHobbyId)) >= MAX_ACTIVE_HOBBIES) {
    return capReached();
  }

  const { data, error } = await supabase
    .from("user_hobbies")
    .update({ status })
    .eq("id", userHobbyId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

/** Shelve a hobby. Reversible, and `paused_at` is stamped by the 004 trigger. */
export async function pauseHobby(userHobbyId: string) {
  return updateHobbyStatus(userHobbyId, "paused");
}

/**
 * Rename a hobby for display only — the slug, and so every roadmap, challenge
 * and session joined to it, is left alone. An empty name clears the override
 * and falls back to the slug.
 */
export async function renameUserHobby(
  userHobbyId: string,
  name: string,
): Promise<HobbyResult> {
  if (!userHobbyId || !UUID_RE.test(userHobbyId)) return { error: "Invalid user hobby ID." };

  const trimmed = name.trim();
  if (trimmed.length > 100) return { error: "That name is too long." };

  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_hobbies")
    .update({ custom_name: trimmed || null })
    .eq("id", userHobbyId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

/**
 * Remove a hobby and everything that belongs to it.
 *
 * Only `practice_sessions` has a real FK to `user_hobbies`, so only it
 * cascades. `user_roadmaps` and `user_challenges` are joined by slug, and left
 * alone they would reattach to the next hobby added under the same slug —
 * a fresh start arriving with a stale roadmap and finished challenges.
 *
 * Roadmaps and challenges go first: if one of those fails the hobby is still
 * there and the whole thing can be retried. Deleting the hobby first and then
 * failing would strand exactly the rows this is trying to clear.
 */
export async function deleteUserHobby(
  userHobbyId: string,
): Promise<HobbyResult<{ slug: string }>> {
  if (!userHobbyId || !UUID_RE.test(userHobbyId)) return { error: "Invalid user hobby ID." };

  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data: hobby, error: readError } = await supabase
    .from("user_hobbies")
    .select("id, hobby_slug")
    .eq("id", userHobbyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!hobby) return { error: "That hobby is no longer there." };

  const { error: roadmapError } = await supabase
    .from("user_roadmaps")
    .delete()
    .eq("user_id", user.id)
    .eq("hobby_slug", hobby.hobby_slug);
  if (roadmapError) return { error: roadmapError.message };

  /* user_challenges points at `challenges`, which carries the slug — so the
     ids have to be looked up before the rows can go. */
  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("id")
    .eq("hobby_slug", hobby.hobby_slug);

  const challengeIds = (challengeRows ?? []).map((c) => c.id);
  if (challengeIds.length > 0) {
    const { error: userChallengeError } = await supabase
      .from("user_challenges")
      .delete()
      .eq("user_id", user.id)
      .in("challenge_id", challengeIds);
    if (userChallengeError) return { error: userChallengeError.message };
  }

  // Sessions cascade from here.
  const { error } = await supabase
    .from("user_hobbies")
    .delete()
    .eq("id", userHobbyId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { data: { slug: hobby.hobby_slug } };
}

/**
 * The one way a hobby becomes yours.
 *
 * Replaces `addHobbyDirect` and `completeSampling`, which were two upserts of
 * the same row reached from different sampling pathways — Watch used one and
 * stopped on a success screen, Micro and Local used the other and navigated.
 * Same intent, different outcome depending on which card you happened to open.
 *
 * It also kicks off the roadmap. A hobby with no roadmap lands on a dashboard
 * card whose only offer is "build one" and a hobby page of empty states, which
 * is what the moment of highest intent used to buy you. The job id comes back
 * so the caller can hand it to `useRoadmapGeneration`, which then shows the
 * build in flight rather than an empty roadmap slot.
 *
 * A failed trigger is not a failed start: the hobby is saved either way, and
 * the hobby page still offers the manual button.
 */
export async function startHobby(
  slug: string,
): Promise<HobbyResult & { roadmapJobId?: string }> {
  if (!slug || !SLUG_RE.test(slug)) return { error: "Invalid hobby slug." };

  const result = await addUserHobby(slug, "active");
  if ("error" in result && result.error) return result;

  const { job_id, error } = await triggerRoadmapGeneration(slug);
  if (error) console.error("[startHobby] Roadmap trigger failed:", error);

  return { ...result, roadmapJobId: job_id };
}

/**
 * Add a hobby by typing its name, from the dashboard.
 *
 * Triggers the roadmap for the same reason `startHobby` does — a hobby added
 * here used to land as a card whose only offer was "build one".
 */
export async function addCustomHobby(
  name: string,
): Promise<HobbyResult & { slug?: string; roadmapJobId?: string }> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) return { error: "Invalid hobby name." };

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  if (!slug) return { error: "Invalid hobby name." };

  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const { data: existing } = await supabase
    .from("user_hobbies")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("hobby_slug", slug)
    .maybeSingle();

  if (existing?.status !== "active" && (await countActive(supabase, user.id)) >= MAX_ACTIVE_HOBBIES) {
    return capReached();
  }

  const { data, error } = await supabase
    .from("user_hobbies")
    .upsert(
      {
        user_id: user.id,
        hobby_slug: slug,
        // The typed name is what the user wanted to call it, so keep it rather
        // than round-tripping through the slug and handing back "Diy Crafts".
        custom_name: trimmed,
        status: "active",
      },
      { onConflict: "user_id,hobby_slug" },
    )
    .select()
    .single();

  if (error) return { error: error.message };

  const { job_id, error: roadmapError } = await triggerRoadmapGeneration(slug);
  if (roadmapError) console.error("[addCustomHobby] Roadmap trigger failed:", roadmapError);

  return { data, slug, roadmapJobId: job_id };
}
