"use server";

import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOBBY_STATUSES = new Set(["sampling", "active", "paused", "completed"]);

export async function getUserHobbies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("user_hobbies")
    .select("*, hobbies(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function addUserHobby(hobbyId: string, status: "sampling" | "active" = "sampling") {
  if (!hobbyId || !UUID_RE.test(hobbyId)) return { error: "Invalid hobby ID." };
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
        hobby_id: hobbyId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hobby_id" },
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
  if (!userHobbyId || !UUID_RE.test(userHobbyId)) return { error: "Invalid user hobby ID." };
  if (!HOBBY_STATUSES.has(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("user_hobbies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", userHobbyId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getAllHobbies() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hobbies")
    .select("*, hobby_categories(*)")
    .order("name");

  if (error) return { error: error.message };
  return { data };
}

export async function addHobbyDirect(slug: string) {
  if (!slug || slug.length > 50) return { error: "Invalid slug." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: hobby, error: lookupError } = await supabase
    .from("hobbies")
    .select("id")
    .eq("slug", slug)
    .single();

  if (lookupError || !hobby) return { error: "Hobby not found." };

  const { data, error } = await supabase
    .from("user_hobbies")
    .upsert(
      {
        user_id: user.id,
        hobby_id: hobby.id,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hobby_id" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if hobby with this slug already exists
  const { data: existing } = await supabase
    .from("hobbies")
    .select("id")
    .eq("slug", slug)
    .single();

  let hobbyId: string;

  if (existing) {
    hobbyId = existing.id;
  } else {
    const { data: created, error: createError } = await supabase
      .from("hobbies")
      .insert({ slug, name: trimmed })
      .select("id")
      .single();

    if (createError || !created) return { error: createError?.message ?? "Failed to create hobby." };
    hobbyId = created.id;
  }

  const { data, error } = await supabase
    .from("user_hobbies")
    .upsert(
      {
        user_id: user.id,
        hobby_id: hobbyId,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hobby_id" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { data, slug };
}
