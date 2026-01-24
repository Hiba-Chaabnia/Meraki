"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateProfile(updates: {
  full_name?: string;
  bio?: string;
  location?: string;
  pronouns?: string;
  avatar_url?: string | null;
}) {
  if (updates.full_name !== undefined && updates.full_name.length > 100)
    return { error: "Full name must be 100 characters or fewer." };
  if (updates.bio !== undefined && updates.bio.length > 500)
    return { error: "Bio must be 500 characters or fewer." };
  if (updates.location !== undefined && updates.location.length > 100)
    return { error: "Location must be 100 characters or fewer." };
  if (updates.pronouns !== undefined && updates.pronouns.length > 50)
    return { error: "Pronouns must be 50 characters or fewer." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}
