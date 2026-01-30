"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/requireAuth";

const SLUG_RE = /^[a-z0-9-]+$/;
const HOBBY_STATUSES = new Set(["sampling", "active", "paused", "completed"]);

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
  return { data };
}

export async function addUserHobby(hobbySlug: string, status: "sampling" | "active" = "sampling") {
  if (!hobbySlug || !SLUG_RE.test(hobbySlug)) return { error: "Invalid hobby slug." };
  if (!HOBBY_STATUSES.has(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

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
  status: "sampling" | "active" | "paused" | "completed",
) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userHobbyId || !UUID_RE.test(userHobbyId)) return { error: "Invalid user hobby ID." };
  if (!HOBBY_STATUSES.has(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

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

export async function addHobbyDirect(slug: string) {
  if (!slug || slug.length > 50) return { error: "Invalid slug." };
  return addUserHobby(slug, "active");
}

export async function addCustomHobby(name: string) {
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
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_hobbies")
    .upsert(
      {
        user_id: user.id,
        hobby_slug: slug,
        status: "active",
      },
      { onConflict: "user_id,hobby_slug" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { data, slug };
}
