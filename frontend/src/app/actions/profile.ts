"use server";

import { requireAuth } from "@/lib/supabase/requireAuth";

export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

  return { url: `${urlData.publicUrl}?t=${Date.now()}` };
}

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
  if ("error" in auth) return { error: auth.error };
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
