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
