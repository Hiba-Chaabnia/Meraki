"use server";

import { requireAuth } from "@/lib/supabase/requireAuth";

function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export async function updateProfile(updates: {
  full_name?: string;
  bio?: string;
  location?: string;
  avatar_url?: string | null;
  public_profile?: boolean;
}) {
  if (updates.full_name !== undefined && updates.full_name.length > 100)
    return { error: "Full name must be 100 characters or fewer." };
  if (updates.bio !== undefined && updates.bio.length > 500)
    return { error: "Bio must be 500 characters or fewer." };
  if (updates.location !== undefined && updates.location.length > 100)
    return { error: "Location must be 100 characters or fewer." };

  const sanitized = {
    ...updates,
    ...(updates.full_name !== undefined && { full_name: sanitize(updates.full_name) }),
    ...(updates.bio !== undefined && { bio: sanitize(updates.bio) }),
    ...(updates.location !== undefined && { location: sanitize(updates.location) }),
  };

  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}
